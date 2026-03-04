import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";

interface MembershipBreakdownProps {
  members: Array<{
    membership_status: string;
    gender: string | null;
    membership_date: string;
  }>;
}

const STATUS_COLORS = [
  "hsl(205, 79%, 20%)",
  "hsl(210, 15%, 55%)",
  "hsl(49, 86%, 46%)",
];

const GENDER_COLORS = [
  "hsl(205, 58%, 47%)",
  "hsl(205, 40%, 60%)",
  "hsl(210, 10%, 70%)",
];

const MembershipBreakdown = ({ members }: MembershipBreakdownProps) => {
  const active = members.filter((m) => m.membership_status === "active").length;
  const inactive = members.filter((m) => m.membership_status === "inactive").length;
  const visitors = members.filter((m) => m.membership_status === "visitor").length;
  const male = members.filter((m) => m.gender === "male").length;
  const female = members.filter((m) => m.gender === "female").length;
  const otherGender = members.length - male - female;

  const statusData = [
    { name: "Active", value: active },
    { name: "Inactive", value: inactive },
    { name: "Visitors", value: visitors },
  ].filter((d) => d.value > 0);

  const genderData = [
    { name: "Male", value: male },
    { name: "Female", value: female },
    ...(otherGender > 0 ? [{ name: "Other", value: otherGender }] : []),
  ].filter((d) => d.value > 0);

  const now = new Date();
  const thisMonth = members.filter((m) => {
    const d = new Date(m.membership_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-semibold text-foreground">Membership</h3>
        {thisMonth > 0 && (
          <Badge className="bg-accent/20 text-accent-foreground border-0 rounded-lg text-xs">
            +{thisMonth} this month
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground text-center mb-1">Status</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground text-center mb-1">Gender</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {genderData.map((_, i) => (
                  <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center mt-2 text-xs">
        {statusData.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[i] }} />
            <span className="text-muted-foreground">{s.name}: <strong className="text-foreground">{s.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembershipBreakdown;
