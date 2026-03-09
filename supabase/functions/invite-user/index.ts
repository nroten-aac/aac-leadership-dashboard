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

    console.log("invite-user: SUPABASE_URL =", supabaseUrl);

    // Decode JWT to get user ID (no verification needed since service role will validate)
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const [, payload] = decode(token);
      userId = (payload as any).sub;
      if (!userId) throw new Error("No sub in token");
      console.log("invite-user: decoded userId =", userId);
    } catch (e) {
      console.error("invite-user: JWT decode failed", e.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify user exists via admin API
    const { data: adminUser, error: adminUserError } = await adminClient.auth.admin.getUserById(userId);
    console.log("invite-user: admin getUserById", JSON.stringify({ error: adminUserError?.message, id: adminUser?.user?.id }));

    if (adminUserError || !adminUser?.user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    console.log("invite-user: role check", JSON.stringify(roleData));

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, allowed_tabs, role } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("invite-user: inviting", email, "role:", role);

    // Create invitation record
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
      console.error("invite-user: insert error", invError.message);
      return new Response(JSON.stringify({ error: invError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send invite via Supabase Auth
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.get("origin") || supabaseUrl}`,
    });

    if (inviteError) {
      console.log("invite-user: auth invite error", inviteError.message);

      if (inviteError.message.includes("already been registered")) {
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
    console.error("invite-user: uncaught error", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
