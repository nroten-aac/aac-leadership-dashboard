import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Decode JWT to get user ID
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const [, payload] = decode(token);
      userId = (payload as any).sub;
      if (!userId) throw new Error("No sub in token");
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify user exists
    const { data: adminUser, error: adminUserError } = await adminClient.auth.admin.getUserById(userId);
    if (adminUserError || !adminUser?.user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow if there are NO admins yet (first-time setup)
    const { data: existingAdmins } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("role", "admin");

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(JSON.stringify({ error: "An admin already exists. Ask an existing admin to promote you." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Promote this user to admin
    await adminClient.from("user_roles").upsert({
      user_id: userId,
      role: "admin",
    }, { onConflict: "user_id,role" });

    // Give admin all tab permissions
    const allTabs = ["dashboard", "data-entry", "members", "attendance", "giving", "discipleship"];
    for (const tab of allTabs) {
      await adminClient.from("user_tab_permissions").upsert({
        user_id: userId,
        tab_name: tab,
      }, { onConflict: "user_id,tab_name" });
    }

    return new Response(JSON.stringify({ message: "You are now an admin!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
