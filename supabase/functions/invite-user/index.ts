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
    console.log("invite-user: start");

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("invite-user: no auth header");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    console.log("invite-user: verifying user");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    console.log("invite-user: getUser result", JSON.stringify({ error: userError?.message, userId: userData?.user?.id }));

    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    console.log("invite-user: checking admin role for", userId);
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    console.log("invite-user: role check", JSON.stringify({ roleData, roleError: roleError?.message }));

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, allowed_tabs, role } = body;
    console.log("invite-user: parsed body", JSON.stringify({ email, allowed_tabs, role }));

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("invite-user: creating invitation record");
    const { data: invitation, error: invError } = await adminClient
      .from("invitations")
      .insert({
        email,
        invited_by: userId,
        allowed_tabs: allowed_tabs || [],
      })
      .select()
      .single();

    if (invError) {
      console.log("invite-user: invitation insert error", invError.message);
      return new Response(JSON.stringify({ error: invError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("invite-user: sending auth invite email");
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get("origin") || supabaseUrl}`,
    });

    console.log("invite-user: auth invite result", JSON.stringify({ error: inviteError?.message, userId: inviteData?.user?.id }));

    if (inviteError) {
      if (inviteError.message.includes("already been registered")) {
        console.log("invite-user: user already exists, updating permissions");
        const { data: existingUser } = await adminClient.auth.admin.listUsers();
        const foundUser = existingUser?.users?.find((u: any) => u.email === email);

        if (foundUser) {
          if (role === "admin") {
            await adminClient.from("user_roles").upsert({
              user_id: foundUser.id,
              role: "admin",
            }, { onConflict: "user_id,role" });
          }

          if (allowed_tabs?.length) {
            for (const tab of allowed_tabs) {
              await adminClient.from("user_tab_permissions").upsert({
                user_id: foundUser.id,
                tab_name: tab,
              }, { onConflict: "user_id,tab_name" });
            }
          }

          await adminClient.from("invitations")
            .update({ status: "accepted", accepted_at: new Date().toISOString() })
            .eq("id", invitation.id);

          return new Response(JSON.stringify({
            message: "User already exists — permissions updated",
            invitation,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (role === "admin" && inviteData?.user) {
      await adminClient.from("user_roles").upsert({
        user_id: inviteData.user.id,
        role: "admin",
      }, { onConflict: "user_id,role" });
    }

    console.log("invite-user: success");
    return new Response(JSON.stringify({
      message: "Invitation sent successfully",
      invitation,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("invite-user: uncaught error", err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
