import { useState, useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList,
} from "recharts";
import { format, parseISO, subYears } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";
import MultiSelectFilter from "./MultiSelectFilter";

interface AttendanceRecord {
  event_date: string;
  service: string;
  adjusted_total: number;
  online_attendance?: number;
  notes?: string | null;
  year: number;
  quarter: string;
  month: string;
}

interface AttendanceChartProps {
  attendance: AttendanceRecord[];
}

const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const AttendanceChart = ({ attendance }: AttendanceChartProps) => {
  const [yearFilter, setYearFilter] = useState<string[]>(["rolling"]);
  const [quarterFilter, setQuarterFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);

  const years = useMemo(() => {
    const set = new Set(attendance.map((a) => a.year));
    return Array.from(set).sort();
  }, [attendance]);

  const quarters = useMemo(() => {
    const set = new Set(attendance.map((a) => a.quarter));
    return Array.from(set).sort();
  }, [attendance]);

  const months = useMemo(() => {
    const set = new Set(attendance.map((a) => a.month));
    return Array.from(set).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  }, [attendance]);

  const rollingCutoff = useMemo(() => {
    if (attendance.length === 0) return "";
    const sorted = [...attendance].sort((a, b) => b.event_date.localeCompare(a.event_date));
    const mostRecent = parseISO(sorted[0].event_date);
    return format(subYears(mostRecent, 1), "yyyy-MM-dd");
  }, [attendance]);

  const filtered = useMemo(() => {
    return attendance.filter((a) => {
      // Year filter
      if (yearFilter.length > 0) {
        if (yearFilter.includes("rolling")) {
          if (a.event_date < rollingCutoff) return false;
        } else {
          if (!yearFilter.includes(String(a.year))) return false;
        }
      }
      if (quarterFilter.length > 0 && !quarterFilter.includes(a.quarter)) return false;
      if (monthFilter.length > 0 && !monthFilter.includes(a.month)) return false;
      return true;
    });
  }, [attendance, yearFilter, quarterFilter, monthFilter, rollingCutoff]);

  const chartData = useMemo(() => {
    const weeklyMap = new Map<string, { combined: number; online: number; notes: string[] }>();
    filtered.forEach((r) => {
      const existing = weeklyMap.get(r.event_date) || { combined: 0, online: 0, notes: [] };
      const notesList = existing.notes;
      if (r.notes) notesList.push(r.notes);
      weeklyMap.set(r.event_date, {
        combined: existing.combined + r.adjusted_total,
        online: existing.online + ((r as any).online_attendance || 0),
        notes: notesList,
      });
    });
    return Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        label: format(parseISO(date), "M/d/yy"),
        combined: vals.combined,
        online: vals.online,
        notes: vals.notes.filter(Boolean).join("; ") || null,
      }));
  }, [filtered]);

  const dataWithTrend = useMemo(() => {
    const n = chartData.length;
    if (n === 0) return [];
    const nonZero = chartData
      .map((d, i) => ({ i, total: d.combined + d.online }))
      .filter((d) => d.total > 0);
    if (nonZero.length < 2) {
      return chartData.map((d) => ({ ...d, trend: null as number | null }));
    }
    const nz = nonZero.length;
    const sumX = nonZero.reduce((s, d) => s + d.i, 0);
    const sumY = nonZero.reduce((s, d) => s + d.total, 0);
    const sumXY = nonZero.reduce((s, d) => s + d.i * d.total, 0);
    const sumX2 = nonZero.reduce((s, d) => s + d.i * d.i, 0);
    const denom = nz * sumX2 - sumX * sumX;
    const slope = denom !== 0 ? (nz * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / nz;
    return chartData.map((d, i) => ({
      ...d,
      trend: (d.combined + d.online) > 0 ? Math.round(slope * i + intercept) : null,
    }));
  }, [chartData]);

  const { trendPct, isUp } = useMemo(() => {
    const recent = chartData.slice(-4);
    const older = chartData.slice(-8, -4);
    const recentAvg = recent.reduce((s, d) => s + d.combined, 0) / (recent.length || 1);
    const olderAvg = older.reduce((s, d) => s + d.combined, 0) / (older.length || 1);
    const pct = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
    return { trendPct: pct, isUp: pct >= 0 };
  }, [chartData]);

  const yearOptions = [
    { value: "rolling", label: "Rolling Year" },
    ...years.map((y) => ({ value: String(y), label: String(y) })),
  ];
  const quarterOptions = quarters.map((q) => ({ value: q, label: q }));
  const monthOptions = months.map((m) => ({ value: m, label: m.slice(0, 3) }));

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground">Weekly Attendance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Combined adjusted total (both services)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelectFilter label="Years" options={yearOptions} selected={yearFilter} onChange={(v) => { setYearFilter(v); if (!v.includes("rolling")) { /* keep quarter/month */ } }} width="w-[130px]" />
          <MultiSelectFilter label="Qtrs" options={quarterOptions} selected={quarterFilter} onChange={setQuarterFilter} width="w-[110px]" />
          <MultiSelectFilter label="Months" options={monthOptions} selected={monthFilter} onChange={setMonthFilter} width="w-[120px]" />
          <div
            className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${
              isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            }`}
          >
            {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(trendPct)}%
          </div>
        </div>
      </div>
      {dataWithTrend.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">No data for selected filters</p>
      ) : (
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={dataWithTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={Math.max(0, Math.floor(dataWithTrend.length / 20))}
              angle={-45}
              textAnchor="end"
              height={55}
            />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: 13,
                maxWidth: 280,
              }}
              labelFormatter={(_, payload) => {
                if (payload && payload.length > 0) {
                  const item = payload[0]?.payload;
                  if (!item) return "";
                  const dateStr = item.date ? format(parseISO(item.date), "MMM d, yyyy") : "";
                  const notes = item.notes;
                  return notes ? `${dateStr}\n📝 ${notes}` : dateStr;
                }
                return "";
              }}
              labelStyle={{ whiteSpace: "pre-wrap" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="online"
              name="Online"
              stackId="attendance"
              fill="hsl(var(--secondary))"
              radius={[0, 0, 0, 0]}
              barSize={dataWithTrend.length > 30 ? 12 : 22}
            >
              <LabelList
                dataKey="online"
                position="center"
                style={{ fontSize: dataWithTrend.length > 30 ? 7 : 10, fill: "white", fontWeight: 700 }}
                formatter={(value: number) => (value > 0 ? value : "")}
              />
            </Bar>
            <Bar
              dataKey="combined"
              name="In-Person"
              stackId="attendance"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
            >
              <LabelList
                dataKey="combined"
                position="top"
                style={{ fontSize: dataWithTrend.length > 30 ? 9 : 12, fill: "hsl(var(--foreground))", fontWeight: 700 }}
                formatter={(value: number) => value}
              />
            </Bar>
            <Line
              type="monotone"
              dataKey="trend"
              name="Trend"
              stroke="hsl(var(--accent))"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AttendanceChart;
