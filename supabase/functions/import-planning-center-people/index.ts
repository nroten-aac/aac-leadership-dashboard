import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PC_PEOPLE_BASE = "https://api.planningcenteronline.com/people/v2";
const PC_SERVICES_BASE = "https://api.planningcenteronline.com/services/v2";

const DISCIPLESHIP_LISTS = [
  "Life Groups",
  "AAC Bible Studies",
  "Discipleship Groups",
  "PT Mentorship",
];

async function pcFetch(url: string, appId: string, secret: string) {
  const fullUrl = url.startsWith("http") ? url : `${PC_PEOPLE_BASE}${url}`;
  const res = await fetch(fullUrl, {
    headers: {
      Authorization: "Basic " + btoa(`${appId}:${secret}`),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PCO API error [${res.status}]: ${body}`);
  }
  return res.json();
}

async function fetchAllPages(path: string, appId: string, secret: string, basePeople = true) {
  const base = basePeople ? PC_PEOPLE_BASE : PC_SERVICES_BASE;
  const items: any[] = [];
  let nextUrl: string | null = `${base}${path}`;

  while (nextUrl) {
    const data = await pcFetch(nextUrl, appId, secret);
    items.push(...(data.data || []));
    nextUrl = data.links?.next || null;
  }
  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PC_APP_ID = Deno.env.get("PLANNING_CENTER_APP_ID");
    const PC_SECRET = Deno.env.get("PLANNING_CENTER_SECRET");
    if (!PC_APP_ID || !PC_SECRET) {
      return new Response(
        JSON.stringify({ error: "Planning Center credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // ---- Step 1: Fetch all people with emails & phones ----
    console.log("Fetching all people from PCO...");
    const allPeople: any[] = [];
    let nextUrl: string | null = `${PC_PEOPLE_BASE}/people?per_page=100&include=emails,phone_numbers`;

    while (nextUrl) {
      const data = await pcFetch(nextUrl, PC_APP_ID, PC_SECRET);
      const included = data.included || [];
      for (const person of data.data || []) {
        const pid = person.id;
        person._emails = included
          .filter((i: any) => i.type === "Email" && i.relationships?.person?.data?.id === pid)
          .map((e: any) => e.attributes.address);
        person._phones = included
          .filter((i: any) => i.type === "PhoneNumber" && i.relationships?.person?.data?.id === pid)
          .map((p: any) => p.attributes.number);
      }
      allPeople.push(...(data.data || []));
      nextUrl = data.links?.next || null;
    }

    console.log(`Fetched ${allPeople.length} people`);

    // ---- Step 2: Upsert members ----
    const members = allPeople.map((p) => {
      const attrs = p.attributes;
      const statusMap: Record<string, string> = {
        active: "active",
        inactive: "inactive",
        pending: "visitor",
      };
      return {
        pco_id: p.id,
        first_name: attrs.first_name || "Unknown",
        last_name: attrs.last_name || "Unknown",
        email: p._emails?.[0] || null,
        phone: p._phones?.[0] || null,
        gender: (() => {
          const g = (attrs.gender || "").toLowerCase();
          if (g === "m" || g === "male") return "male";
          if (g === "f" || g === "female") return "female";
          return g || null;
        })(),
        date_of_birth: attrs.birthdate || null,
        membership_status: statusMap[attrs.status?.toLowerCase()] || "active",
        membership_date: attrs.created_at
          ? attrs.created_at.split("T")[0]
          : new Date().toISOString().split("T")[0],
        notes: `Imported from Planning Center (ID: ${p.id})`,
      };
    });

    let imported = 0;
    const errors: string[] = [];
    for (let i = 0; i < members.length; i += 100) {
      const batch = members.slice(i, i + 100);
      const { error } = await serviceClient.from("members").upsert(batch, {
        onConflict: "pco_id",
        ignoreDuplicates: false,
      });
      if (error) {
        errors.push(`Members batch ${i / 100 + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }
    console.log(`Upserted ${imported} members`);

    // Build pco_id -> member_id map
    const { data: allMembers } = await serviceClient
      .from("members")
      .select("id, pco_id")
      .not("pco_id", "is", null);
    const pcoToMemberId = new Map<string, string>();
    for (const m of allMembers || []) {
      if (m.pco_id) pcoToMemberId.set(m.pco_id, m.id);
    }

    // ---- Step 3: Fetch discipleship list memberships ----
    console.log("Fetching PCO lists for discipleship groups...");
    const allLists = await fetchAllPages("/lists?per_page=100", PC_APP_ID, PC_SECRET);

    const groupRows: { member_id: string; group_name: string; group_type: string }[] = [];

    for (const listName of DISCIPLESHIP_LISTS) {
      const list = allLists.find(
        (l: any) => l.attributes.name?.toLowerCase() === listName.toLowerCase()
      );
      if (!list) {
        console.log(`Discipleship list "${listName}" not found`);
        continue;
      }

      const people = await fetchAllPages(`/lists/${list.id}/people?per_page=100`, PC_APP_ID, PC_SECRET);
      console.log(`List "${listName}": ${people.length} people`);

      for (const p of people) {
        const memberId = pcoToMemberId.get(p.id);
        if (memberId) {
          groupRows.push({ member_id: memberId, group_name: listName, group_type: "discipleship" });
        }
      }
    }

    // ---- Step 4: Fetch volunteer teams from PCO Services ----
    console.log("Fetching volunteer teams from PCO Services...");
    try {
      const teams = await fetchAllPages("/teams?per_page=100", PC_APP_ID, PC_SECRET, false);
      console.log(`Found ${teams.length} volunteer teams`);

      for (const team of teams) {
        const teamName = team.attributes?.name;
        if (!teamName) continue;

        try {
          const teamPeople = await fetchAllPages(
            `/teams/${team.id}/person_team_position_assignments?per_page=100&include=person`,
            PC_APP_ID,
            PC_SECRET,
            false
          );

          // Get unique person IDs from included data
          const included = teamPeople;
          const seenPcoIds = new Set<string>();

          for (const assignment of teamPeople) {
            const personRel = assignment.relationships?.person?.data;
            if (personRel?.id && !seenPcoIds.has(personRel.id)) {
              seenPcoIds.add(personRel.id);
              const memberId = pcoToMemberId.get(personRel.id);
              if (memberId) {
                groupRows.push({ member_id: memberId, group_name: teamName, group_type: "volunteer" });
              }
            }
          }
        } catch (e) {
          console.error(`Error fetching team "${teamName}" members:`, e);
        }
      }
    } catch (e) {
      console.error("Error fetching volunteer teams (Services API):", e);
      errors.push(`Volunteer teams: ${e instanceof Error ? e.message : "Unknown error"}`);
    }

    // ---- Step 5: Clear and re-insert member_groups ----
    console.log(`Inserting ${groupRows.length} group memberships...`);
    await serviceClient.from("member_groups").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    for (let i = 0; i < groupRows.length; i += 100) {
      const batch = groupRows.slice(i, i + 100);
      const { error } = await serviceClient.from("member_groups").upsert(batch, {
        onConflict: "member_id,group_name,group_type",
      });
      if (error) {
        errors.push(`Groups batch ${i / 100 + 1}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Imported ${imported} of ${members.length} people, ${groupRows.length} group memberships`,
        imported,
        total: members.length,
        groups: groupRows.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Import error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
