import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PC_APP_ID = Deno.env.get("PLANNING_CENTER_APP_ID")!;
    const PC_SECRET = Deno.env.get("PLANNING_CENTER_SECRET")!;

    // Test with Alex Anderson's PCO ID
    const pcoId = "167209864";
    
    // Try 1: Get person with include=households
    const res1 = await fetch(
      `https://api.planningcenteronline.com/people/v2/people/${pcoId}?include=households`,
      { headers: { Authorization: "Basic " + btoa(`${PC_APP_ID}:${PC_SECRET}`), "Content-Type": "application/json" } }
    );
    const data1 = await res1.json();

    // Try 2: Get person's household_memberships
    const res2 = await fetch(
      `https://api.planningcenteronline.com/people/v2/people/${pcoId}/household_memberships`,
      { headers: { Authorization: "Basic " + btoa(`${PC_APP_ID}:${PC_SECRET}`), "Content-Type": "application/json" } }
    );
    const data2 = await res2.json();

    // Try 3: Get person's households directly
    const res3 = await fetch(
      `https://api.planningcenteronline.com/people/v2/people/${pcoId}/households`,
      { headers: { Authorization: "Basic " + btoa(`${PC_APP_ID}:${PC_SECRET}`), "Content-Type": "application/json" } }
    );
    const data3 = await res3.json();

    return new Response(JSON.stringify({
      person_relationships: data1.data?.relationships ? Object.keys(data1.data.relationships) : null,
      included_types: (data1.included || []).map((i: any) => ({ type: i.type, id: i.id, name: i.attributes?.name })),
      household_memberships: data2,
      households_direct: data3,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
