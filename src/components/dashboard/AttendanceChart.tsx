import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

interface AttendanceChartProps {
  attendance: Array<{
    event_date: string;
    event_type: string;
    present: boolean;
  }>;
}

const AttendanceChart = ({ attendance }: AttendanceChartProps) => {
  // Group attendance by month for the last 6 months
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    return {
      month: format(startOfMonth(date), "MMM yyyy"),
      key: format(startOfMonth(date), "yyyy-MM"),
    };
  });

  const chartData = months.map(({ month, key }) => {
    const monthAttendance = attendance.filter((a) => {
      const d = format(parseISO(a.event_date), "yyyy-MM");
      return d === key && a.present;
    });
    return {
      month,
      sunday: monthAttendance.filter((a) => a.event_type === "sunday_service").length,
      wednesday: monthAttendance.filter((a) => a.event_type === "wednesday_service").length,
      other: monthAttendance.filter((a) => !["sunday_service", "wednesday_service"].includes(a.event_type)).length,
    };
  });

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Attendance Trends</CardTitle>
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
            <Bar dataKey="sunday" name="Sunday" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="wednesday" name="Wednesday" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="other" name="Other" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AttendanceChart;
