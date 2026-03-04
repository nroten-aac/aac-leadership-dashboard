import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceRecord {
  event_date: string;
  service: string;
  adjusted_total: number;
  year: number;
  quarter: string;
  month: string;
}

interface AttendanceChartProps {
  attendance: AttendanceRecord[];
}

const AttendanceChart = ({ attendance }: AttendanceChartProps) => {
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [quarterFilter, setQuarterFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  // Extract unique filter options
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
    const order = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return Array.from(set).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [attendance]);

  // Apply filters
  const filtered = useMemo(() => {
    return attendance.filter((a) => {
      if (yearFilter !== "all" && a.year !== Number(yearFilter)) return false;
      if (quarterFilter !== "all" && a.quarter !== quarterFilter) return false;
      if (monthFilter !== "all" && a.month !== monthFilter) return false;
      return true;
    });
  }, [attendance, yearFilter, quarterFilter, monthFilter]);

  // Group by event_date, sum adjusted_total across both services
  const chartData = useMemo(() => {
    const weeklyMap = new Map<string, number>();
    filtered.forEach((r) => {
      const existing = weeklyMap.get(r.event_date) || 0;
      weeklyMap.set(r.event_date, existing + r.adjusted_total);
    });

    return Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({
        date,
        label: format(parseISO(date), "M/d/yy"),
        combined: total,
      }));
  }, [filtered]);

  // Linear regression for trendline
  const dataWithTrend = useMemo(() => {
    const n = chartData.length;
    if (n === 0) return [];
    const sumX = chartData.reduce((s, _, i) => s + i, 0);
    const sumY = chartData.reduce((s, d) => s + d.combined, 0);
    const sumXY = chartData.reduce((s, d, i) => s + i * d.combined, 0);
    const sumX2 = chartData.reduce((s, _, i) => s + i * i, 0);
    const denom = n * sumX2 - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;

    return chartData.map((d, i) => ({
      ...d,
      trend: Math.round(slope * i + intercept),
    }));
  }, [chartData]);

  // Trend percentage
  const { trendPct, isUp } = useMemo(() => {
    const recent = chartData.slice(-4);
    const older = chartData.slice(-8, -4);
    const recentAvg = recent.reduce((s, d) => s + d.combined, 0) / (recent.length || 1);
    const olderAvg = older.reduce((s, d) => s + d.combined, 0) / (older.length || 1);
    const pct = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
    return { trendPct: pct, isUp: pct >= 0 };
  }, [chartData]);

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">Weekly Attendance</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Combined adjusted total (both services)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setQuarterFilter("all"); setMonthFilter("all"); }}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={quarterFilter} onValueChange={setQuarterFilter}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Qtrs</SelectItem>
                {quarters.map((q) => (
                  <SelectItem key={q} value={q}>{q}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>{m.slice(0, 3)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${
                isUp ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(trendPct)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dataWithTrend.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">No data for selected filters</p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
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
                  borderRadius: "8px",
                  fontSize: 13,
                }}
                labelFormatter={(_, payload) => {
                  if (payload && payload.length > 0) {
                    const item = payload[0]?.payload;
                    return item?.date ? format(parseISO(item.date), "MMM d, yyyy") : "";
                  }
                  return "";
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="combined"
                name="Total Attendance"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                barSize={dataWithTrend.length > 30 ? 12 : 22}
              >
                <LabelList
                  dataKey="combined"
                  position="top"
                  style={{ fontSize: dataWithTrend.length > 30 ? 7 : 9, fill: "hsl(var(--muted-foreground))" }}
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
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
