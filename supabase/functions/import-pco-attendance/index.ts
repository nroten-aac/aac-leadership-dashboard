import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PC_CHECKINS_BASE = "https://api.planningcenteronline.com/check-ins/v2";

// Hardcoded PCO Event IDs (verified during exploration)
const SANCTUARY_EVENT_ID = "854011"; // AAC Sunday Service
const CHILDRENS_EVENT_ID = "850959"; // Children's Ministry

// Sanctuary headcount attendance type (Sanctuary = 291169)
const SANCTUARY_ATTENDANCE_TYPE_ID = "291169";
// Online Live headcount attendance type
const ONLINE_ATTENDANCE_TYPE_ID = "338718";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getQuarter(monthIdx: number) {
  return `Q${Math.ceil((monthIdx + 1) / 3)}`;
}

// Map PCO location names (current + legacy) to attendance table columns
const LOCATION_MAP: Record<string, string[]> = {
  nursery_attendance: ["Nursery and PK", "Nursery & PK", "Nursery", "PK"],
  k3_attendance: ["K – 3rd Grade", "K - 3rd Grade", "K-3rd Grade", "K – 3", "K-3"],
  grade_4_6_attendance: ["4th – 6th Grade", "4th - 6th Grade", "4th-6th Grade", "4-6"],
  youth_attendance: ["Youth"],
  volunteer_classroom_attendance: ["Youth Teacher", "Childcare Team", "Children's Ministry Volunteer"],
};

function categorizeLocation(locName: string): string | null {
  const norm = locName.trim().toLowerCase();
  for (const [col, names] of Object.entries(LOCATION_MAP)) {
    if (names.some((n) => n.toLowerCase() === norm)) return col;
  }
  return null;
}

async function pcFetch(url: string, appId: string, secret: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: "Basic " + btoa(`${appId}:${secret}`),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PCO API error [${res.status}] ${url}: ${body}`);
  }
  return res.json();
}

async function fetchAllPages(url: string, appId: string, secret: string) {
  const items: any[] = [];
  const included: any[] = [];
  let nextUrl: string | null = url;
  while (nextUrl) {
    const data = await pcFetch(nextUrl, appId, secret);
    items.push(...(data.data || []));
    if (data.included) included.push(...data.included);
    nextUrl = data.links?.next || null;
  }
  return { data: items, included };
}

interface DayAggregate {
  event_date: string;
  service_9_15: number;
  service_11_00: number;
  online_9_15: number;
  online_11_00: number;
  // Children's totals (single row per date with service "Not Applicable")
  nursery: number;
  k3: number;
  grade_4_6: number;
  youth: number;
  volunteers: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
      return new Response(JSON.stringify({ error: "Planning Center credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body — { weeks?: number, startDate?: "YYYY-MM-DD", endDate?: "YYYY-MM-DD" }
    let body: any = {};
    try { body = await req.json(); } catch { /* default */ }
    const requestedWeeks = parseInt(body.weeks);
    const weeks = Math.min(Math.max(Number.isFinite(requestedWeeks) ? requestedWeeks : 6, 6), 26);

    let startDate: string;
    let endDate: string;
    if (body.startDate && body.endDate) {
      startDate = body.startDate;
      endDate = body.endDate;
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - weeks * 7);
      startDate = start.toISOString().split("T")[0];
      endDate = end.toISOString().split("T")[0];
    }

    console.log(`Importing PCO attendance ${startDate} → ${endDate}`);
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const errors: string[] = [];

    // Aggregate per event_date
    const byDate = new Map<string, DayAggregate>();
    const ensure = (date: string): DayAggregate => {
      let d = byDate.get(date);
      if (!d) {
        d = { event_date: date, service_9_15: 0, service_11_00: 0,
              online_9_15: 0, online_11_00: 0,
              nursery: 0, k3: 0, grade_4_6: 0, youth: 0, volunteers: 0 };
        byDate.set(date, d);
      }
      return d;
    };

    // ---- 1. Sanctuary headcounts ----
    // PCO doesn't expose /events/{id}/event_times directly. Fetch event_periods with included event_times.
    console.log("Fetching Sanctuary event periods + times...");
    const periodsUrl =
      `${PC_CHECKINS_BASE}/events/${SANCTUARY_EVENT_ID}/event_periods` +
      `?where[starts_at][gte]=${startDate}T00:00:00Z&where[starts_at][lte]=${endDate}T23:59:59Z` +
      `&include=event_times&per_page=100`;
    const { data: periods, included: periodIncluded } = await fetchAllPages(periodsUrl, PC_APP_ID, PC_SECRET);
    const eventTimes = (periodIncluded || []).filter((i: any) => i.type === "EventTime");
    console.log(`Found ${periods.length} event periods, ${eventTimes.length} event times`);

    for (const et of eventTimes) {
      const startsAt: string = et.attributes?.starts_at;
      if (!startsAt) continue;
      const dt = new Date(startsAt);
      const dateStr = startsAt.split("T")[0];
      // EventTime has explicit hour/minute fields
      const hour = et.attributes?.hour;
      const name: string = (et.attributes?.name || "").toLowerCase();
      let slot: "9:15" | "11:00" | null = null;
      if (name.includes("9:15") || name.includes("915")) slot = "9:15";
      else if (name.includes("11:00") || name.includes("11am") || name.includes("11 am")) slot = "11:00";
      else if (typeof hour === "number") {
        if (hour === 9) slot = "9:15";
        else if (hour === 11) slot = "11:00";
      }
      if (!slot) continue;

      // Fetch headcounts for this event_time
      const hcUrl = `${PC_CHECKINS_BASE}/event_times/${et.id}/headcounts?per_page=100`;
      try {
        const { data: headcounts } = await fetchAllPages(hcUrl, PC_APP_ID, PC_SECRET);
        const day = ensure(dateStr);
        for (const h of headcounts) {
          const atId = h.relationships?.attendance_type?.data?.id;
          const total = h.attributes?.total || 0;
          if (atId === SANCTUARY_ATTENDANCE_TYPE_ID) {
            if (slot === "9:15") day.service_9_15 = total;
            else day.service_11_00 = total;
          } else if (atId === ONLINE_ATTENDANCE_TYPE_ID) {
            if (slot === "9:15") day.online_9_15 = total;
            else day.online_11_00 = total;
          }
        }
      } catch (e) {
        errors.push(`Sanctuary headcounts ${dateStr} ${slot}: ${e instanceof Error ? e.message : e}`);
      }
    }

    // ---- 2. Children's Ministry check-ins ----
    console.log("Fetching Children's Ministry check-ins...");
    const ciUrl =
      `${PC_CHECKINS_BASE}/events/${CHILDRENS_EVENT_ID}/check_ins` +
      `?where[created_at][gte]=${startDate}T00:00:00Z&where[created_at][lte]=${endDate}T23:59:59Z` +
      `&include=locations&per_page=100`;
    const { data: checkIns, included } = await fetchAllPages(ciUrl, PC_APP_ID, PC_SECRET);
    console.log(`Found ${checkIns.length} children's check-ins`);

    // Build location id -> name map
    const locMap = new Map<string, string>();
    for (const inc of included) {
      if (inc.type === "Location") locMap.set(inc.id, inc.attributes?.name || "");
    }

    for (const ci of checkIns) {
      const createdAt: string = ci.attributes?.created_at || "";
      if (!createdAt) continue;
      const dateStr = createdAt.split("T")[0];

      // Only import children's check-ins that fall on a Sunday.
      // PCO sometimes has stray volunteer/back-dated check-ins on weekdays
      // which would otherwise create orphan attendance rows.
      const dow = new Date(dateStr + "T12:00:00").getUTCDay();
      if (dow !== 0) continue;

      const locRel = ci.relationships?.locations?.data || [];
      // A check-in may have multiple locations; use the first matching mapped one
      let category: string | null = null;
      for (const l of locRel) {
        const locName = locMap.get(l.id) || "";
        const cat = categorizeLocation(locName);
        if (cat) { category = cat; break; }
      }
      if (!category) continue;

      const day = ensure(dateStr);
      if (category === "nursery_attendance") day.nursery += 1;
      else if (category === "k3_attendance") day.k3 += 1;
      else if (category === "grade_4_6_attendance") day.grade_4_6 += 1;
      else if (category === "youth_attendance") day.youth += 1;
      else if (category === "volunteer_classroom_attendance") day.volunteers += 1;
    }

    // ---- 3. Upsert into attendance table ----
    console.log(`Aggregated ${byDate.size} dates. Writing to DB...`);
    let written = 0;
    for (const day of byDate.values()) {
      const d = new Date(day.event_date + "T12:00:00");
      const monthName = MONTHS[d.getMonth()];
      const year = d.getFullYear();
      const quarter = getQuarter(d.getMonth());

      // Build rows: one for each service slot that has data, plus one "Not Applicable" row for kids
      const rowsToWrite: any[] = [];
      const baseKids = {
        nursery_attendance: 0,
        k3_attendance: 0,
        grade_4_6_attendance: 0,
        youth_attendance: 0,
        volunteer_classroom_attendance: 0,
        total_k6_attendance: 0,
      };

      if (day.service_9_15 > 0) {
        rowsToWrite.push({
          event_date: day.event_date,
          service: "1st Sunday Service (9:15)",
          month: monthName, year, quarter,
          sanctuary_attendance: day.service_9_15,
          online_attendance: day.online_9_15,
          ...baseKids,
          notes: "Imported from Planning Center",
        });
      }
      if (day.service_11_00 > 0) {
        rowsToWrite.push({
          event_date: day.event_date,
          service: "2nd Sunday Service (11:00)",
          month: monthName, year, quarter,
          sanctuary_attendance: day.service_11_00,
          online_attendance: day.online_11_00,
          ...baseKids,
          notes: "Imported from Planning Center",
        });
      }
      const hasKids = day.nursery + day.k3 + day.grade_4_6 + day.youth + day.volunteers > 0;
      if (hasKids) {
        rowsToWrite.push({
          event_date: day.event_date,
          service: "Not Applicable",
          month: monthName, year, quarter,
          sanctuary_attendance: 0,
          online_attendance: 0,
          nursery_attendance: day.nursery,
          k3_attendance: day.k3,
          grade_4_6_attendance: day.grade_4_6,
          youth_attendance: day.youth,
          volunteer_classroom_attendance: day.volunteers,
          total_k6_attendance: day.nursery + day.k3 + day.grade_4_6,
          notes: "Imported from Planning Center",
        });
      }

      for (const row of rowsToWrite) {
        // Upsert by (event_date, service): delete existing then insert
        const { error: delErr } = await serviceClient
          .from("attendance")
          .delete()
          .eq("event_date", row.event_date)
          .eq("service", row.service);
        if (delErr) {
          errors.push(`Delete ${row.event_date}/${row.service}: ${delErr.message}`);
          continue;
        }
        const { error: insErr } = await serviceClient.from("attendance").insert(row);
        if (insErr) {
          errors.push(`Insert ${row.event_date}/${row.service}: ${insErr.message}`);
        } else {
          written++;
        }
      }

      // Recalculate adjusted_total / in_person_total / total_adults across all rows for this date
      const { data: dateRows } = await serviceClient
        .from("attendance").select("*").eq("event_date", day.event_date);
      if (dateRows && dateRows.length > 0) {
        const totalKids = dateRows.reduce((s, r) =>
          s + r.volunteer_classroom_attendance + r.nursery_attendance + r.k3_attendance + r.grade_4_6_attendance + r.youth_attendance, 0);
        const is1st = (s: string) => s === "1st Sunday Service (9:15)" || s === "9:15 AM";
        for (const r of dateRows) {
          let adjustedTotal: number;
          if (is1st(r.service)) {
            adjustedTotal = r.sanctuary_attendance - Math.round(0.2 * totalKids);
          } else if (r.service === "Not Applicable") {
            adjustedTotal = r.volunteer_classroom_attendance + r.nursery_attendance + r.k3_attendance + r.grade_4_6_attendance + r.youth_attendance;
          } else {
            adjustedTotal = r.sanctuary_attendance;
          }
          const inPersonTotal = r.sanctuary_attendance + r.nursery_attendance + r.k3_attendance + r.grade_4_6_attendance + r.youth_attendance;
          const totalAdults = Math.max(0, r.sanctuary_attendance - r.volunteer_classroom_attendance);
          await serviceClient.from("attendance").update({
            adjusted_total: adjustedTotal,
            in_person_total: inPersonTotal,
            total_adults: totalAdults,
          }).eq("id", r.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Imported ${written} attendance rows across ${byDate.size} dates (${startDate} → ${endDate})`,
        dates: byDate.size,
        rows: written,
        details: Array.from(byDate.values()).map((d) => ({
          date: d.event_date,
          "9:15": d.service_9_15,
          "11:00": d.service_11_00,
          "online 9:15": d.online_9_15,
          "online 11:00": d.online_11_00,
          nursery: d.nursery,
          k3: d.k3,
          "4-6": d.grade_4_6,
          youth: d.youth,
          volunteers: d.volunteers,
        })),
        errors: errors.length ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Attendance import error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
