import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller using getUser
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

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
