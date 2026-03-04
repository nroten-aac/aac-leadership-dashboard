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
} from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AttendanceRecord {
  event_date: string;
  service: string;
  adjusted_total: number;
}

interface AttendanceChartProps {
  attendance: AttendanceRecord[];
}

const AttendanceChart = ({ attendance }: AttendanceChartProps) => {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, 11 - i);
    return {
      month: format(startOfMonth(date), "MMM yy"),
      key: format(startOfMonth(date), "yyyy-MM"),
    };
  });

  // Combine both services' adjusted_total per month
  const chartData = months.map(({ month, key }) => {
    const monthRecords = attendance.filter(
      (a) => format(parseISO(a.event_date), "yyyy-MM") === key
    );

    // Group by week (event_date) and sum both services' adjusted_total per week, then average across weeks
    const weeklyTotals = new Map<string, number>();
    monthRecords.forEach((r) => {
      const existing = weeklyTotals.get(r.event_date) || 0;
      weeklyTotals.set(r.event_date, existing + r.adjusted_total);
    });

    const weeks = Array.from(weeklyTotals.values());
    const combinedAvg = weeks.length > 0
      ? Math.round(weeks.reduce((s, v) => s + v, 0) / weeks.length)
      : 0;

    return { month, combined: combinedAvg };
  });

  // Simple linear regression for trendline
  const points = chartData.map((d, i) => ({ x: i, y: d.combined }));
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  const dataWithTrend = chartData.map((d, i) => ({
    ...d,
    trend: Math.round(slope * i + intercept),
  }));

  // Trend percentage (last 3 vs prior 3)
  const recent = chartData.slice(-3);
  const older = chartData.slice(-6, -3);
  const recentAvg = recent.reduce((s, d) => s + d.combined, 0) / (recent.length || 1);
  const olderAvg = older.reduce((s, d) => s + d.combined, 0) / (older.length || 1);
  const trendPct = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
  const isUp = trendPct >= 0;

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="font-display text-lg">Attendance Trend</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Combined adjusted total · 12-month avg
          </p>
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            isUp ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(trendPct)}%
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={dataWithTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 13,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="combined"
              name="Adjusted Total"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              barSize={28}
            />
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
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
