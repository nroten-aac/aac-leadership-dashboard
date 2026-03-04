import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MembershipBreakdownProps {
  members: Array<{
    membership_status: string;
    gender: string | null;
    membership_date: string;
  }>;
}

const MembershipBreakdown = ({ members }: MembershipBreakdownProps) => {
  const active = members.filter((m) => m.membership_status === "active").length;
  const inactive = members.filter((m) => m.membership_status === "inactive").length;
  const visitors = members.filter((m) => m.membership_status === "visitor").length;
  const male = members.filter((m) => m.gender === "male").length;
  const female = members.filter((m) => m.gender === "female").length;

  const total = members.length || 1;

  const statusBars = [
    { label: "Active", count: active, pct: (active / total) * 100, color: "bg-primary" },
    { label: "Inactive", count: inactive, pct: (inactive / total) * 100, color: "bg-muted-foreground" },
    { label: "Visitors", count: visitors, pct: (visitors / total) * 100, color: "bg-accent" },
  ];

  // New members this month
  const now = new Date();
  const thisMonth = members.filter((m) => {
    const d = new Date(m.membership_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg">Membership</CardTitle>
        {thisMonth > 0 && (
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            +{thisMonth} this month
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {statusBars.map((s) => (
          <div key={s.label} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-semibold">{s.count}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${s.color} transition-all duration-700`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Gender Distribution</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm">Male: {male}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-sm">Female: {female}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MembershipBreakdown;
