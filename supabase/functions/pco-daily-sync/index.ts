import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const serviceKeyEnv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") || "";
    const provided = auth.replace(/^Bearer\s+/i, "");
    if (!provided || provided !== serviceKeyEnv) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = serviceKeyEnv;

    const callFn = async (name: string, body: any) => {
      const start = Date.now();
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
          },
          body: JSON.stringify(body ?? {}),
        });
        const text = await res.text();
        let parsed: any = text;
        try { parsed = JSON.parse(text); } catch { /* keep raw */ }
        return { fn: name, ok: res.ok, status: res.status, ms: Date.now() - start, response: parsed };
      } catch (e) {
        return { fn: name, ok: false, status: 0, ms: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
      }
    };

    // Sync attendance (last 4 weeks), giving (full), and people
    const results = [];
    results.push(await callFn("import-pco-attendance", { weeks: 4 }));
    results.push(await callFn("import-pco-giving", {}));
    results.push(await callFn("import-planning-center-people", {}));

    const allOk = results.every((r) => r.ok);
    return new Response(
      JSON.stringify({ ok: allOk, ranAt: new Date().toISOString(), results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("pco-daily-sync error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});