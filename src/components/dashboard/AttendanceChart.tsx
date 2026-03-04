import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AttendanceRecord {
  event_date: string;
  service: string;
  adjusted_total: number;
  online_attendance: number;
  sanctuary_attendance: number;
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

  const chartData = months.map(({ month, key }) => {
    const monthRecords = attendance.filter(
      (a) => format(parseISO(a.event_date), "yyyy-MM") === key
    );
    const count = monthRecords.length || 1;
    const avgTotal = Math.round(monthRecords.reduce((s, a) => s + a.adjusted_total, 0) / count);
    const avgOnline = Math.round(monthRecords.reduce((s, a) => s + a.online_attendance, 0) / count);
    const avgInPerson = Math.round(monthRecords.reduce((s, a) => s + (a.adjusted_total - a.online_attendance), 0) / count);

    return { month, total: avgTotal, inPerson: avgInPerson, online: avgOnline };
  });

  // Trend calc
  const recent = chartData.slice(-3);
  const older = chartData.slice(-6, -3);
  const recentAvg = recent.reduce((s, d) => s + d.total, 0) / (recent.length || 1);
  const olderAvg = older.reduce((s, d) => s + d.total, 0) / (older.length || 1);
  const trendPct = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
  const isUp = trendPct >= 0;

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="font-display text-lg">Attendance Trend</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">12-month rolling average</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(trendPct)}%
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
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
            <Line type="monotone" dataKey="inPerson" name="In-Person" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="online" name="Online" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--secondary))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
