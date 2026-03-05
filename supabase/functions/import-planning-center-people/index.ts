import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PC_BASE = "https://api.planningcenteronline.com/people/v2";

async function pcFetch(path: string, appId: string, secret: string) {
  const res = await fetch(`${PC_BASE}${path}`, {
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
    // Authenticate user
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

    // Verify the user's JWT
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

    // Fetch all people with pagination
    const allPeople: any[] = [];
    let nextUrl: string | null = "/people?per_page=100&include=emails,phone_numbers";

    while (nextUrl) {
      const data = await pcFetch(nextUrl, PC_APP_ID, PC_SECRET);
      allPeople.push(...(data.data || []));

      // Collect included emails & phones
      const included = data.included || [];
      // Attach emails/phones to people
      for (const person of data.data || []) {
        const personId = person.id;
        person._emails = included
          .filter((i: any) => i.type === "Email" && i.relationships?.person?.data?.id === personId)
          .map((e: any) => e.attributes.address);
        person._phones = included
          .filter((i: any) => i.type === "PhoneNumber" && i.relationships?.person?.data?.id === personId)
          .map((p: any) => p.attributes.number);
      }

      // Handle pagination
      const nextLink = data.links?.next || data.meta?.next?.offset;
      if (data.links?.next) {
        // Extract path from full URL
        const url = new URL(data.links.next);
        nextUrl = url.pathname.replace("/people/v2", "") + url.search;
      } else {
        nextUrl = null;
      }
    }

    // Map PC people to our members table format
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const members = allPeople.map((p) => {
      const attrs = p.attributes;
      const statusMap: Record<string, string> = {
        active: "active",
        inactive: "inactive",
        pending: "visitor",
      };

      return {
        first_name: attrs.first_name || "Unknown",
        last_name: attrs.last_name || "Unknown",
        email: p._emails?.[0] || null,
        phone: p._phones?.[0] || null,
        gender: attrs.gender || null,
        date_of_birth: attrs.birthdate || null,
        membership_status: statusMap[attrs.status?.toLowerCase()] || "active",
        membership_date: attrs.created_at
          ? attrs.created_at.split("T")[0]
          : new Date().toISOString().split("T")[0],
        notes: `Imported from Planning Center (ID: ${p.id})`,
      };
    });

    if (members.length === 0) {
      return new Response(
        JSON.stringify({ message: "No people found in Planning Center", imported: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert in batches of 100
    let imported = 0;
    let errors: string[] = [];
    for (let i = 0; i < members.length; i += 100) {
      const batch = members.slice(i, i + 100);
      const { error } = await serviceClient.from("members").insert(batch);
      if (error) {
        errors.push(`Batch ${i / 100 + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Imported ${imported} of ${members.length} people from Planning Center`,
        imported,
        total: members.length,
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
