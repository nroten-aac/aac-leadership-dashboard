import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

interface AttendanceRecord {
  event_date: string;
  service: string;
  adjusted_total: number;
  online_attendance: number;
  sanctuary_attendance: number;
  nursery_attendance: number;
  k3_attendance: number;
  grade_4_6_attendance: number;
  youth_attendance: number;
}

interface AttendanceChartProps {
  attendance: AttendanceRecord[];
}

const AttendanceChart = ({ attendance }: AttendanceChartProps) => {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    return {
      month: format(startOfMonth(date), "MMM yyyy"),
      key: format(startOfMonth(date), "yyyy-MM"),
    };
  });

  const chartData = months.map(({ month, key }) => {
    const monthRecords = attendance.filter((a) => {
      const d = format(parseISO(a.event_date), "yyyy-MM");
      return d === key;
    });

    const serviceCount = monthRecords.length || 1;
    const avgInPerson = Math.round(monthRecords.reduce((s, a) => s + a.adjusted_total, 0) / serviceCount);
    const avgOnline = Math.round(monthRecords.reduce((s, a) => s + a.online_attendance, 0) / serviceCount);

    return { month, inPerson: avgInPerson, online: avgOnline };
  });

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Avg. Attendance by Month</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 13,
              }}
            />
            <Legend />
            <Bar dataKey="inPerson" name="In-Person" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="online" name="Online" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
