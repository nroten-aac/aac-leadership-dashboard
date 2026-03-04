import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [membersRes, attendanceRes, donationsRes, programsRes, enrollmentsRes] = await Promise.all([
      supabase.from("members").select("id, first_name, last_name, membership_status, membership_date, gender"),
      supabase.from("attendance").select("id, event_date, service, sanctuary_attendance, adjusted_total, online_attendance, nursery_attendance, k3_attendance, grade_4_6_attendance, youth_attendance, total_adults, notes, month, year, quarter"),
      supabase.from("donations").select("id, amount, donation_date, donation_type, member_id"),
      supabase.from("discipleship_programs").select("id, name, program_type, leader_name, is_active"),
      supabase.from("program_enrollments").select("id, member_id, program_id, status, enrollment_date"),
    ]);

    // Compute attendance stats
    const att = attendanceRes.data || [];
    const totalServices = att.length;
    const avgAdjusted = totalServices > 0 ? Math.round(att.reduce((s, a) => s + (a.adjusted_total || 0), 0) / totalServices) : 0;
    const avgOnline = totalServices > 0 ? Math.round(att.reduce((s, a) => s + (a.online_attendance || 0), 0) / totalServices) : 0;

    // Recent attendance (last 20 records)
    const recentAtt = [...att].sort((a, b) => b.event_date.localeCompare(a.event_date)).slice(0, 20);

    const dbContext = `
You are a church data assistant for Ashe Alliance Church. Answer questions about church data accurately.

CURRENT DATABASE STATE:
- Members (${membersRes.data?.length || 0} total):
  Active: ${membersRes.data?.filter(m => m.membership_status === 'active').length || 0}
  Inactive: ${membersRes.data?.filter(m => m.membership_status === 'inactive').length || 0}
  Visitors: ${membersRes.data?.filter(m => m.membership_status === 'visitor').length || 0}
  Male: ${membersRes.data?.filter(m => m.gender === 'male').length || 0}
  Female: ${membersRes.data?.filter(m => m.gender === 'female').length || 0}

- Attendance: ${totalServices} service records (aggregate counts per service)
  Avg Adjusted Total per service: ${avgAdjusted}
  Avg Online per service: ${avgOnline}
  Date range: ${att.length > 0 ? att.sort((a,b) => a.event_date.localeCompare(b.event_date))[0]?.event_date : 'N/A'} to ${att.length > 0 ? att.sort((a,b) => b.event_date.localeCompare(a.event_date))[0]?.event_date : 'N/A'}
  Services tracked: 9:15 AM and 11:00 AM
  Fields: sanctuary_attendance, volunteer_classroom_attendance, nursery_attendance, k3_attendance, grade_4_6_attendance, youth_attendance, in_person_total, adjusted_total, online_attendance, total_k6_attendance, total_adults

- Donations: ${donationsRes.data?.length || 0} records
  Total Amount: $${donationsRes.data?.reduce((s, d) => s + d.amount, 0)?.toLocaleString() || '0'}
  Tithes: $${donationsRes.data?.filter(d => d.donation_type === 'tithe').reduce((s, d) => s + d.amount, 0)?.toLocaleString() || '0'}
  Offerings: $${donationsRes.data?.filter(d => d.donation_type === 'offering').reduce((s, d) => s + d.amount, 0)?.toLocaleString() || '0'}

- Discipleship Programs: ${programsRes.data?.length || 0} programs
  ${programsRes.data?.map(p => p.name + ' (' + p.program_type + ') - Led by ' + (p.leader_name || 'TBD') + ' - ' + (p.is_active ? 'Active' : 'Inactive')).join('\n  ') || 'None'}

- Program Enrollments: ${enrollmentsRes.data?.length || 0} total
  Active: ${enrollmentsRes.data?.filter(e => e.status === 'active').length || 0}

RECENT ATTENDANCE (last 20 services):
${JSON.stringify(recentAtt)}

MEMBER DETAILS:
${JSON.stringify(membersRes.data?.slice(0, 50) || [])}

RECENT DONATIONS:
${JSON.stringify(donationsRes.data?.sort((a, b) => b.donation_date.localeCompare(a.donation_date)).slice(0, 20) || [])}

Be helpful, accurate, and concise. Format numbers and currency properly. If data is empty, let them know they can add data through the dashboard.
`;

    const { messages } = await req.json();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: dbContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
