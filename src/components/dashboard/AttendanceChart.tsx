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

  const isComparisonMode = useMemo(() => {
    return yearFilter.length >= 2 && !yearFilter.includes("rolling");
  }, [yearFilter]);

  const selectedYears = useMemo(() => {
    return yearFilter.filter((y) => y !== "rolling").map(Number).sort();
  }, [yearFilter]);

  // Weekly chart data (linear mode)
  const weeklyChartData = useMemo(() => {
    if (isComparisonMode) return [];
    const weeklyMap = new Map<string, {
      combined: number; online: number; notes: string[];
      firstService: number; firstServiceOriginal: number; secondService: number; kids: number;
      nursery: number; k3: number; grade46: number; youth: number; volunteers: number;
    }>();
    filtered.forEach((r) => {
      const existing = weeklyMap.get(r.event_date) || {
        combined: 0, online: 0, notes: [],
        firstService: 0, firstServiceOriginal: 0, secondService: 0, kids: 0,
        nursery: 0, k3: 0, grade46: 0, youth: 0, volunteers: 0,
      };
      if (r.notes) existing.notes.push(r.notes);
      existing.combined += r.adjusted_total;
      existing.online += ((r as any).online_attendance || 0);

      const svc = r.service;
      if (svc === "1st Sunday Service (9:15)" || svc === "9:15 AM") {
        existing.firstService = r.adjusted_total;
        existing.firstServiceOriginal = (r as any).sanctuary_attendance || r.adjusted_total;
      } else if (svc === "2nd Sunday Service (11:00)" || svc === "11:00 AM") {
        existing.secondService = r.adjusted_total;
      } else if (svc === "Not Applicable") {
        existing.kids = r.adjusted_total;
      }
      existing.nursery += (r as any).nursery_attendance || 0;
      existing.k3 += (r as any).k3_attendance || 0;
      existing.grade46 += (r as any).grade_4_6_attendance || 0;
      existing.youth += (r as any).youth_attendance || 0;
      existing.volunteers += (r as any).volunteer_classroom_attendance || 0;

      weeklyMap.set(r.event_date, existing);
    });
    return Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        label: format(parseISO(date), "M/d/yy"),
        combined: vals.combined,
        online: vals.online,
        notes: vals.notes.filter(Boolean).join("; ") || null,
        firstService: vals.firstService,
        firstServiceOriginal: vals.firstServiceOriginal,
        secondService: vals.secondService,
        kids: vals.kids,
        nursery: vals.nursery,
        k3: vals.k3,
        grade46: vals.grade46,
        youth: vals.youth,
        volunteers: vals.volunteers,
      }));
  }, [filtered, isComparisonMode]);

  // Comparison mode: aggregate weekly → monthly averages, grouped by month
  const comparisonChartData = useMemo(() => {
    if (!isComparisonMode) return [];
    // First aggregate per week per date
    const weeklyMap = new Map<string, { combined: number; online: number; year: number; month: string }>();
    filtered.forEach((r) => {
      const existing = weeklyMap.get(r.event_date) || { combined: 0, online: 0, year: r.year, month: r.month };
      existing.combined += r.adjusted_total;
      existing.online += ((r as any).online_attendance || 0);
      weeklyMap.set(r.event_date, existing);
    });
    // Group by month+year → compute average
    const monthlyMap = new Map<string, { total: number; online: number; count: number }>();
    weeklyMap.forEach((val) => {
      const key = `${val.year}-${val.month}`;
      const existing = monthlyMap.get(key) || { total: 0, online: 0, count: 0 };
      existing.total += val.combined;
      existing.online += val.online;
      existing.count += 1;
      monthlyMap.set(key, existing);
    });
    // Build chart rows keyed by month index
    const rows = new Map<number, Record<string, any>>();
    for (const yr of selectedYears) {
      MONTH_ORDER.forEach((month, monthIdx) => {
        const key = `${yr}-${month}`;
        const data = monthlyMap.get(key);
        if (!rows.has(monthIdx)) {
          const row: Record<string, any> = { month: month.slice(0, 3), _sort: monthIdx };
          rows.set(monthIdx, row);
        }
        const row = rows.get(monthIdx)!;
        const ipKey = `In-Person '${String(yr).slice(2)}`;
        const olKey = `Online '${String(yr).slice(2)}`;
        if (!(ipKey in row)) row[ipKey] = 0;
        if (!(olKey in row)) row[olKey] = 0;
        if (data) {
          row[ipKey] = Math.round(data.total / data.count);
          row[olKey] = Math.round(data.online / data.count);
        }
      });
    }
    return Array.from(rows.values()).sort((a, b) => a._sort - b._sort);
  }, [filtered, isComparisonMode, selectedYears]);

  const chartData = isComparisonMode ? comparisonChartData : weeklyChartData;

  const dataWithTrend = useMemo(() => {
    if (isComparisonMode) {
      return chartData.map((d) => ({ ...d, trend: null as number | null }));
    }
    const n = chartData.length;
    if (n === 0) return [];
    const nonZero = chartData
      .map((d, i) => ({ i, total: (d.combined || 0) + (d.online || 0) }))
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
      trend: ((d.combined || 0) + (d.online || 0)) > 0 ? Math.round(slope * i + intercept) : null,
    }));
  }, [chartData, isComparisonMode]);

  const { trendPct, isUp } = useMemo(() => {
    if (isComparisonMode) return { trendPct: 0, isUp: true };
    const recent = weeklyChartData.slice(-4);
    const older = weeklyChartData.slice(-8, -4);
    const recentAvg = recent.reduce((s, d) => s + d.combined, 0) / (recent.length || 1);
    const olderAvg = older.reduce((s, d) => s + d.combined, 0) / (older.length || 1);
    const pct = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
    return { trendPct: pct, isUp: pct >= 0 };
  }, [weeklyChartData, isComparisonMode]);

  const comparisonBarKeys = useMemo(() => {
    if (!isComparisonMode) return [];
    const keys: { key: string; type: "ip" | "online"; year: number }[] = [];
    for (const yr of selectedYears) {
      keys.push({ key: `In-Person '${String(yr).slice(2)}`, type: "ip", year: yr });
      keys.push({ key: `Online '${String(yr).slice(2)}`, type: "online", year: yr });
    }
    return keys;
  }, [isComparisonMode, selectedYears]);

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
          <h3 className="font-display font-semibold text-foreground">
            Weekly Attendance{isComparisonMode ? " (Monthly Avg)" : ""}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isComparisonMode ? "Average weekly attendance per month" : "Combined adjusted total (both services)"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelectFilter label="Years" options={yearOptions} selected={yearFilter} onChange={(v) => { setYearFilter(v); }} width="w-[130px]" />
          <MultiSelectFilter label="Qtrs" options={quarterOptions} selected={quarterFilter} onChange={setQuarterFilter} width="w-[110px]" />
          <MultiSelectFilter label="Months" options={monthOptions} selected={monthFilter} onChange={setMonthFilter} width="w-[120px]" />
          {!isComparisonMode && (
            <div
              className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${
                isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
              }`}
            >
              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(trendPct)}%
            </div>
          )}
        </div>
      </div>
      {dataWithTrend.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">No data for selected filters</p>
      ) : (
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={dataWithTrend} barGap={isComparisonMode ? 2 : -10}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey={isComparisonMode ? "month" : "label"}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={isComparisonMode ? 0 : Math.max(0, Math.floor(dataWithTrend.length / 20))}
              angle={isComparisonMode ? 0 : -45}
              textAnchor={isComparisonMode ? "middle" : "end"}
              height={isComparisonMode ? 30 : 55}
            />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            {isComparisonMode ? (
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: 13,
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
            ) : (
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload;
                  if (!item) return null;
                  const dateStr = item.date ? format(parseISO(item.date), "MMM d, yyyy") : "";
                  const total = item.combined + item.online;
                  return (
                    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm max-w-[300px]">
                      <p className="font-semibold text-foreground mb-1.5">{dateStr}</p>
                      <div className="space-y-0.5 text-muted-foreground">
                        {item.firstService > 0 && <p>1st Service: <span className="text-foreground font-medium">{item.firstServiceOriginal !== item.firstService ? <>{item.firstServiceOriginal} <span className="text-muted-foreground">({item.firstService} adj.)</span></> : item.firstService}</span></p>}
                        {item.secondService > 0 && <p>2nd Service: <span className="text-foreground font-medium">{item.secondService}</span></p>}
                        {item.kids > 0 && (
                          <div className="ml-0">
                            <p>Children &amp; Volunteers: <span className="text-foreground font-medium">{item.kids}</span></p>
                            <div className="ml-3 text-xs text-muted-foreground/80">
                              {item.volunteers > 0 && <p>Volunteers: {item.volunteers}</p>}
                              {item.nursery > 0 && <p>Nursery: {item.nursery}</p>}
                              {item.k3 > 0 && <p>K–3: {item.k3}</p>}
                              {item.grade46 > 0 && <p>Grades 4–6: {item.grade46}</p>}
                              {item.youth > 0 && <p>Youth: {item.youth}</p>}
                            </div>
                          </div>
                        )}
                        {item.online > 0 && <p>Online: <span className="text-foreground font-medium">{item.online}</span></p>}
                        <div className="border-t border-border mt-1.5 pt-1.5">
                          <p className="font-semibold text-foreground">Total: {total}</p>
                        </div>
                      </div>
                      {item.notes && <p className="mt-1.5 text-xs text-muted-foreground/70">📝 {item.notes}</p>}
                    </div>
                  );
                }}
              />
            )}
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {isComparisonMode ? (
              comparisonBarKeys.map(({ key, type, year }, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={type === "ip" ? "hsl(var(--primary))" : "hsl(var(--secondary))"}
                  fillOpacity={year === selectedYears[selectedYears.length - 1] ? 1 : 0.45}
                  radius={[4, 4, 0, 0]}
                  barSize={type === "online" ? 10 : 16}
                >
                  <LabelList
                    dataKey={key}
                    position="top"
                    style={{
                      fontSize: 9,
                      fill: type === "online" ? "white" : "hsl(var(--foreground))",
                      fontWeight: 700,
                    }}
                    formatter={(value: number) => (value > 0 ? value : "")}
                  />
                </Bar>
              ))
            ) : (
              <>
                <Bar
                  dataKey="combined"
                  name="In-Person"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  barSize={dataWithTrend.length > 30 ? 14 : 24}
                >
                  <LabelList
                    dataKey="combined"
                    position="top"
                    style={{ fontSize: dataWithTrend.length > 30 ? 9 : 12, fill: "hsl(var(--foreground))", fontWeight: 700 }}
                    formatter={(value: number) => value}
                  />
                </Bar>
                <Bar
                  dataKey="online"
                  name="Online"
                  fill="hsl(var(--secondary))"
                  radius={[6, 6, 0, 0]}
                  barSize={dataWithTrend.length > 30 ? 10 : 16}
                >
                  <LabelList
                    dataKey="online"
                    position="top"
                    style={{ fontSize: dataWithTrend.length > 30 ? 7 : 10, fill: "white", fontWeight: 700 }}
                    formatter={(value: number) => (value > 0 ? value : "")}
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
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AttendanceChart;
