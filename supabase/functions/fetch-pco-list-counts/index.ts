import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PC_BASE = "https://api.planningcenteronline.com/people/v2";

// All PCO list names to fetch
const TARGET_LISTS = [
  "Life Groups",
  "AAC Bible Studies",
  "Discipleship Groups",
  "PT Mentorship",
  "Member Adults",
  "Member Children",
  "Regular Attender Adults",
  "Regular Attender Children",
  "Visitors",
];

async function pcFetch(path: string, appId: string, secret: string) {
  const url = path.startsWith("http") ? path : `${PC_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: "Basic " + btoa(`${appId}:${secret}`),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Planning Center API error [${res.status}]: ${body}`);
  }
  return res.json();
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

    // Fetch all lists
    const allLists: any[] = [];
    let nextUrl: string | null = "/lists?per_page=100";

    while (nextUrl) {
      const data = await pcFetch(nextUrl, PC_APP_ID, PC_SECRET);
      allLists.push(...(data.data || []));
      nextUrl = data.links?.next || null;
    }

    console.log(`Found ${allLists.length} total lists`);

    // For each target list, find the list ID then get the people count
    const results: Record<string, number> = {};
    for (const name of TARGET_LISTS) {
      const list = allLists.find(
        (l: any) => l.attributes.name?.toLowerCase() === name.toLowerCase()
      );
      if (list) {
        try {
          const peopleData = await pcFetch(`/lists/${list.id}/people?per_page=1`, PC_APP_ID, PC_SECRET);
          const count = peopleData.meta?.total_count ?? peopleData.data?.length ?? 0;
          console.log(`List "${name}" (id=${list.id}): ${count} people`);
          results[name] = count;
        } catch (e) {
          console.error(`Error fetching people for list "${name}":`, e);
          results[name] = 0;
        }
      } else {
        console.log(`List "${name}": not found in PCO`);
        results[name] = 0;
      }
    }

    return new Response(JSON.stringify({ lists: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("PCO list counts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
