import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: vaultRow, error: vaultErr } = await admin
      .schema("vault" as any)
      .from("decrypted_secrets")
      .select("decrypted_secret")
      .eq("name", "pco_cron_secret")
      .maybeSingle();

    const cronSecret = (vaultRow as any)?.decrypted_secret as string | undefined;
    const provided = req.headers.get("x-cron-secret");
    if (vaultErr || !cronSecret || provided !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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