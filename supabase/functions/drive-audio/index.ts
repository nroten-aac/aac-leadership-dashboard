const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers": "content-length, content-range, accept-ranges",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get("fileId");
    if (!fileId || !/^[A-Za-z0-9_-]{10,}$/.test(fileId)) {
      return new Response(JSON.stringify({ error: "Invalid fileId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_DRIVE_API_KEY) {
      return new Response(JSON.stringify({ error: "Drive connection not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
    };
    const range = req.headers.get("range");
    if (range) headers.Range = range;

    const upstream = await fetch(`${GATEWAY_URL}/files/${fileId}?alt=media`, { headers });

    const respHeaders = new Headers({
      ...corsHeaders,
      "Content-Type": upstream.headers.get("Content-Type") ?? "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    });
    const cl = upstream.headers.get("Content-Length");
    if (cl) respHeaders.set("Content-Length", cl);
    const cr = upstream.headers.get("Content-Range");
    if (cr) respHeaders.set("Content-Range", cr);

    return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});