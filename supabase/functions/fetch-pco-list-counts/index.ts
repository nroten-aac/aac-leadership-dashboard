import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PC_BASE = "https://api.planningcenteronline.com/people/v2";

// The 4 PCO list names to match
const TARGET_LISTS = [
  "Life Groups",
  "AAC Bible Studies",
  "Discipleship Groups",
  "PT Mentorship",
];

async function pcFetch(path: string, appId: string, secret: string) {
  const url = path.startsWith("http") ? path : `${PC_BASE}${path}`;
  console.log(`Fetching PCO: ${url}`);
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

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
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

    console.log(`PCO credentials: APP_ID length=${PC_APP_ID.length}, SECRET length=${PC_SECRET.length}`);

    // First test: try the base people endpoint to verify credentials
    try {
      const testData = await pcFetch("/people?per_page=1", PC_APP_ID, PC_SECRET);
      console.log("PCO credentials verified - people endpoint works");
    } catch (testErr) {
      console.error("PCO credentials test failed:", testErr);
      return new Response(
        JSON.stringify({ error: "Planning Center credentials are invalid or expired. Please update them." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all lists with pagination
    const allLists: any[] = [];
    let nextUrl: string | null = "/lists?per_page=100";

    while (nextUrl) {
      const data = await pcFetch(nextUrl, PC_APP_ID, PC_SECRET);
      console.log(`Fetched ${data.data?.length || 0} lists`);
      allLists.push(...(data.data || []));
      if (data.links?.next) {
        nextUrl = data.links.next;
      } else {
        nextUrl = null;
      }
    }

    // Find our target lists and get their count
    // Log first list's attributes for debugging
    if (allLists.length > 0) {
      console.log("Sample list attributes:", JSON.stringify(Object.keys(allLists[0].attributes)));
      const sample = allLists[0];
      console.log("Sample list data:", JSON.stringify({ name: sample.attributes.name, ...sample.attributes }));
    }

    const results: Record<string, number> = {};
    for (const name of TARGET_LISTS) {
      const list = allLists.find(
        (l: any) => l.attributes.name?.toLowerCase() === name.toLowerCase()
      );
      if (list) {
        // Try different attribute names for the count
        const count = list.attributes.total_people_count 
          ?? list.attributes.total_people 
          ?? list.attributes.people_count
          ?? list.attributes.count
          ?? 0;
        console.log(`List "${name}": id=${list.id}, attrs=${JSON.stringify(list.attributes)}`);
        results[name] = count;
      } else {
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
