import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
    <div className="bg-card rounded-2xl shadow-card p-6">
      <h3 className="font-display font-semibold text-foreground">Where People Gather</h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-2">All-time attendance by area</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: 13,
            }}
            formatter={(value: number) => [value.toLocaleString(), ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-sm text-muted-foreground -mt-2 mb-3">
        <span className="font-semibold text-foreground">{grand.toLocaleString()}</span> total check-ins
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-muted-foreground truncate">{d.name}</span>
            <span className="font-semibold text-foreground ml-auto">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceBreakdown;
