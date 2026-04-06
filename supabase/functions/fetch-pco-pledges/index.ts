import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const appId = Deno.env.get("PLANNING_CENTER_APP_ID");
    const secret = Deno.env.get("PLANNING_CENTER_SECRET");
    if (!appId || !secret) throw new Error("Planning Center credentials not configured");

    const auth = btoa(`${appId}:${secret}`);
    const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };

    // Fetch pledge campaigns
    const res = await fetch("https://api.planningcenteronline.com/giving/v2/pledge_campaigns", { headers });
    if (!res.ok) throw new Error(`PCO API error: ${res.status}`);

    const campaigns = await res.json();

    const results = [];
    for (const camp of campaigns.data || []) {
      const attrs = camp.attributes;
      const totalPledgedCents = await sumAllPledges(camp.id, headers);

      results.push({
        id: camp.id,
        name: attrs.name,
        goal_cents: attrs.goal_cents,
        total_pledged_cents: totalPledgedCents,
        received_from_pledges_cents: attrs.received_total_from_pledges_cents,
        received_outside_pledges_cents: attrs.received_total_outside_of_pledges_cents,
        not_yet_received_cents: totalPledgedCents - attrs.received_total_from_pledges_cents,
      });
    }

    return new Response(JSON.stringify({ campaigns: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-pco-pledges error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sumAllPledges(campaignId: string, headers: Record<string, string>): Promise<number> {
  let total = 0;
  let url: string | null =
    `https://api.planningcenteronline.com/giving/v2/pledge_campaigns/${campaignId}/pledges?per_page=100`;

  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) break;
    const data = await res.json();
    for (const p of data.data || []) {
      total += p.attributes.amount_cents || 0;
    }
    url = data.links?.next || null;
  }
  return total;
}
