import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AttendanceBreakdownProps {
  attendance: Array<{
    sanctuary_attendance: number;
    online_attendance: number;
    nursery_attendance: number;
    k3_attendance: number;
    grade_4_6_attendance: number;
    youth_attendance: number;
  }>;
}

const COLORS = [
  "hsl(205, 79%, 20%)",
  "hsl(205, 58%, 47%)",
  "hsl(49, 86%, 46%)",
  "hsl(210, 25%, 15%)",
  "hsl(205, 40%, 60%)",
  "hsl(45, 80%, 55%)",
];

const AttendanceBreakdown = ({ attendance }: AttendanceBreakdownProps) => {
  // Aggregate totals across all records
  const totals = attendance.reduce(
    (acc, a) => ({
      sanctuary: acc.sanctuary + a.sanctuary_attendance,
      online: acc.online + a.online_attendance,
      nursery: acc.nursery + a.nursery_attendance,
      k3: acc.k3 + a.k3_attendance,
      grade46: acc.grade46 + a.grade_4_6_attendance,
      youth: acc.youth + a.youth_attendance,
    }),
    { sanctuary: 0, online: 0, nursery: 0, k3: 0, grade46: 0, youth: 0 }
  );

  const data = [
    { name: "Sanctuary", value: totals.sanctuary },
    { name: "Online", value: totals.online },
    { name: "Youth", value: totals.youth },
    { name: "K-3", value: totals.k3 },
    { name: "Gr. 4-6", value: totals.grade46 },
    { name: "Nursery", value: totals.nursery },
  ].filter((d) => d.value > 0);

  const grand = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg">Where People Gather</CardTitle>
        <p className="text-xs text-muted-foreground">All-time attendance by area</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 13,
              }}
              formatter={(value: number) => [value.toLocaleString(), ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-center text-sm text-muted-foreground -mt-2">
          <span className="font-semibold text-foreground">{grand.toLocaleString()}</span> total check-ins
        </p>
      </CardContent>
    </Card>
  );
};

export default AttendanceBreakdown;
