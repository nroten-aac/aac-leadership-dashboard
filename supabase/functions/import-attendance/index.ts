import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === "") return null;
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return null;
  let [m, d, y] = parts;
  let year = parseInt(y);
  if (year < 100) year += 2000;
  if (year === 1900) year = 2024; // fix known data error
  const month = m.padStart(2, "0");
  const day = d.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toInt(val: string | undefined): number {
  if (!val || val.trim() === "") return 0;
  const n = parseInt(val.trim());
  return isNaN(n) ? 0 : n;
}

function normalizeService(s: string): string {
  const lower = s.trim().toLowerCase().replace(/\s+/g, "");
  if (lower.startsWith("9:15")) return "9:15 AM";
  if (lower.startsWith("11:00") || lower.startsWith("11:00")) return "11:00 AM";
  if (lower === ":" || lower === "combined" || lower === "") return "Unknown";
  return s.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { csvData } = await req.json();
    const lines = csvData.split("\n").filter((l: string) => l.trim());
    
    // Skip header (first 2 lines since header spans 2 lines)
    const dataLines = lines.slice(2);
    const records: any[] = [];
    let skipped = 0;

    for (const line of dataLines) {
      // Parse CSV properly handling quoted fields
      const fields: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { fields.push(current); current = ""; }
        else { current += char; }
      }
      fields.push(current);

      const eventDate = parseDate(fields[0]);
      if (!eventDate) { skipped++; continue; }

      const record = {
        event_date: eventDate,
        month: fields[1]?.trim() || "Unknown",
        year: toInt(fields[2]) || 2024,
        quarter: fields[3]?.trim() || "Q1",
        service: normalizeService(fields[4] || ""),
        sanctuary_attendance: toInt(fields[5]),
        volunteer_classroom_attendance: toInt(fields[6]),
        nursery_attendance: toInt(fields[7]),
        k3_attendance: toInt(fields[8]),
        grade_4_6_attendance: toInt(fields[9]),
        youth_attendance: toInt(fields[10]),
        in_person_total: toInt(fields[11]),
        adjusted_total: toInt(fields[12]),
        online_attendance: toInt(fields[13]),
        total_k6_attendance: toInt(fields[14]),
        total_adults: toInt(fields[15]),
        notes: fields[16]?.trim() || null,
      };

      // Fix year 1900
      if (record.year === 1900) record.year = 2024;

      records.push(record);
    }

    // Insert in batches of 50
    let inserted = 0;
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      const { error } = await supabase.from("attendance").insert(batch);
      if (error) {
        console.error("Insert error at batch", i, error);
        return new Response(JSON.stringify({ error: error.message, batch: i }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      inserted += batch.length;
    }

    return new Response(JSON.stringify({ inserted, skipped, total: dataLines.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
