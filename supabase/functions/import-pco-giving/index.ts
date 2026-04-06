import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PC_GIVING_BASE = "https://api.planningcenteronline.com/giving/v2";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// Map PCO fund names to our fund keys
const FUND_MAP: Record<string, string> = {
  "general": "general",
  "general fund": "general",
  "building": "building",
  "building fund": "building",
  "missions": "missions",
  "missions fund": "missions",
  "missions & outreach": "missions",
  "missions and outreach": "missions",
  "benevolence": "benevolence",
  "benevolence fund": "benevolence",
};

function normalizeFund(name: string): string | null {
  const lower = name.toLowerCase().trim();
  return FUND_MAP[lower] ?? null;
}

async function pcFetch(path: string, appId: string, secret: string) {
  const url = path.startsWith("http") ? path : `${PC_GIVING_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: "Basic " + btoa(`${appId}:${secret}`),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Planning Center Giving API error [${res.status}]: ${body}`);
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

    // Step 1: Fetch all funds to build ID→name map
    const fundsMap = new Map<string, string>();
    let fundsUrl: string | null = "/funds?per_page=100";
    while (fundsUrl) {
      const data = await pcFetch(fundsUrl, PC_APP_ID, PC_SECRET);
      for (const fund of data.data || []) {
        fundsMap.set(fund.id, fund.attributes.name);
      }
      fundsUrl = data.links?.next
        ? (() => { const u = new URL(data.links.next); return u.pathname.replace("/giving/v2", "") + u.search; })()
        : null;
    }
    console.log(`Found ${fundsMap.size} funds:`, Object.fromEntries(fundsMap));

    // Step 2: Fetch all donations with designations
    // Aggregate by month/year/fund
    const aggregated = new Map<string, { month: string; year: number; fund: string; amount: number }>();
    let donationsUrl: string | null = "/donations?per_page=100&include=designations&order=received_at";
    let totalDonations = 0;
    let unmappedFunds = new Set<string>();

    while (donationsUrl) {
      const data = await pcFetch(donationsUrl, PC_APP_ID, PC_SECRET);
      const included = data.included || [];

      for (const donation of data.data || []) {
        totalDonations++;
        const receivedAt = donation.attributes.received_at;
        if (!receivedAt) continue;

        const date = new Date(receivedAt);
        const year = date.getFullYear();
        const month = MONTH_NAMES[date.getMonth()];

        // Get designations for this donation
        const designationRels = donation.relationships?.designations?.data || [];
        for (const desRel of designationRels) {
          const designation = included.find(
            (i: any) => i.type === "Designation" && i.id === desRel.id
          );
          if (!designation) continue;

          const amountCents = designation.attributes.amount_cents || 0;
          const amount = amountCents / 100;
          const fundId = designation.relationships?.fund?.data?.id;
          const fundName = fundId ? fundsMap.get(fundId) : null;

          if (!fundName) continue;
          const normalizedFund = normalizeFund(fundName);
          if (!normalizedFund) {
            unmappedFunds.add(fundName);
            continue;
          }

          const key = `${year}-${month}-${normalizedFund}`;
          if (!aggregated.has(key)) {
            aggregated.set(key, { month, year, fund: normalizedFund, amount: 0 });
          }
          aggregated.get(key)!.amount += amount;
        }
      }

      donationsUrl = data.links?.next
        ? (() => { const u = new URL(data.links.next); return u.pathname.replace("/giving/v2", "") + u.search; })()
        : null;
    }

    console.log(`Processed ${totalDonations} donations into ${aggregated.size} monthly aggregates`);
    if (unmappedFunds.size > 0) {
      console.log(`Unmapped fund names: ${Array.from(unmappedFunds).join(", ")}`);
    }

    // Step 3: Only insert records that don't already exist
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const records = Array.from(aggregated.values()).map(r => ({
      ...r,
      amount: Math.round(r.amount * 100) / 100,
    }));

    // Fetch existing monthly_giving to check for duplicates
    const { data: existingData } = await serviceClient
      .from("monthly_giving")
      .select("year, month, fund");

    const existingKeys = new Set(
      (existingData || []).map((e: any) => `${e.year}-${e.month}-${e.fund}`)
    );

    const newRecords = records.filter(
      r => !existingKeys.has(`${r.year}-${r.month}-${r.fund}`)
    );

    let inserted = 0;
    const errors: string[] = [];
    const skipped = records.length - newRecords.length;

    // Insert new records in batches
    for (let i = 0; i < newRecords.length; i += 100) {
      const batch = newRecords.slice(i, i + 100);
      const { error } = await serviceClient.from("monthly_giving").insert(batch);
      if (error) {
        errors.push(`Batch ${Math.floor(i / 100) + 1}: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    const unmappedMsg = unmappedFunds.size > 0
      ? ` (${unmappedFunds.size} unmapped fund names: ${Array.from(unmappedFunds).join(", ")})`
      : "";

    return new Response(
      JSON.stringify({
        message: `Synced ${upserted} monthly giving records from ${totalDonations} donations${unmappedMsg}`,
        upserted,
        totalDonations,
        unmappedFunds: Array.from(unmappedFunds),
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("PCO giving import error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
