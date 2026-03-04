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

interface AttendanceRecord {
  event_date: string;
  service: string;
  adjusted_total: number;
}

interface AttendanceChartProps {
  attendance: AttendanceRecord[];
}

const AttendanceChart = ({ attendance }: AttendanceChartProps) => {
  // Group by event_date, sum adjusted_total across both services
  const weeklyMap = new Map<string, number>();
  attendance.forEach((r) => {
    const existing = weeklyMap.get(r.event_date) || 0;
    weeklyMap.set(r.event_date, existing + r.adjusted_total);
  });

  // Sort by date and take last 20 weeks for readability
  const allWeeks = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({
      date,
      label: format(parseISO(date), "M/d"),
      combined: total,
    }));

  const chartData = allWeeks.slice(-20);

  // Linear regression for trendline
  const points = chartData.map((d, i) => ({ x: i, y: d.combined }));
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  const dataWithTrend = chartData.map((d, i) => ({
    ...d,
    trend: Math.round(slope * i + intercept),
  }));

  // Trend percentage (last 4 weeks vs prior 4)
  const recent = chartData.slice(-4);
  const older = chartData.slice(-8, -4);
  const recentAvg = recent.reduce((s, d) => s + d.combined, 0) / (recent.length || 1);
  const olderAvg = older.reduce((s, d) => s + d.combined, 0) / (older.length || 1);
  const trendPct = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
  const isUp = trendPct >= 0;

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="font-display text-lg">Weekly Attendance</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Combined adjusted total (both services)
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
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={dataWithTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 13,
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const item = payload[0]?.payload;
                  return item?.date ? format(parseISO(item.date), "MMM d, yyyy") : label;
                }
                return label;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="combined"
              name="Total Attendance"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              barSize={20}
            >
              <LabelList
                dataKey="combined"
                position="top"
                style={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
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
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
