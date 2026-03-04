import { Users, TrendingUp, DollarSign, BookOpen } from "lucide-react";

interface StatsCardsProps {
  totalDonations: number;
  avgAttendance: number;
  totalEnrollments: number;
}

const CHURCH_FAMILY = {
  memberAdults: 55,
  memberDependents: 17,
  regularAdults: 38,
  regularDependents: 14,
};
const CHURCH_FAMILY_TOTAL = Object.values(CHURCH_FAMILY).reduce((a, b) => a + b, 0);

const StatsCards = ({ totalDonations, avgAttendance, totalEnrollments }: StatsCardsProps) => {
  const familyGroups = [
    { label: "Member Adults", value: CHURCH_FAMILY.memberAdults, color: "hsl(var(--primary))" },
    { label: "Member Dependents", value: CHURCH_FAMILY.memberDependents, color: "hsl(var(--secondary))" },
    { label: "RA Adults", value: CHURCH_FAMILY.regularAdults, color: "hsl(var(--accent))" },
    { label: "RA Dependents", value: CHURCH_FAMILY.regularDependents, color: "hsl(var(--muted-foreground))" },
  ];

  const cards = [
    {
      title: "Avg. Attendance",
      value: avgAttendance.toString(),
      subtitle: "per service",
      icon: TrendingUp,
      highlight: false,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      title: "Total Giving",
      value: `$${totalDonations.toLocaleString()}`,
      subtitle: "all time",
      icon: DollarSign,
      highlight: false,
      iconBg: "bg-accent/20",
      iconColor: "text-accent-foreground",
    },
    {
      title: "Discipleship",
      value: totalEnrollments.toString(),
      subtitle: "active enrollments",
      icon: BookOpen,
      highlight: true,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Church Family card */}
      <div className="rounded-2xl p-5 bg-card shadow-card transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Church Family</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-display font-bold mt-2 text-foreground">{CHURCH_FAMILY_TOTAL}</p>
        <div className="mt-3 space-y-1.5">
          {familyGroups.map((g) => (
            <div key={g.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-muted-foreground">{g.label}</span>
              </div>
              <span className="font-semibold text-foreground">{g.value}</span>
            </div>
          ))}
        </div>
      </div>

      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-2xl p-5 transition-all duration-300 hover:shadow-card-hover ${
            card.highlight
              ? "gradient-primary text-primary-foreground shadow-soft"
              : "bg-card shadow-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${card.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {card.title}
            </p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              card.highlight ? "bg-primary-foreground/15" : card.iconBg
            }`}>
              <card.icon className={`h-4.5 w-4.5 ${card.highlight ? "text-primary-foreground" : card.iconColor}`} />
            </div>
          </div>
          <p className={`text-2xl font-display font-bold mt-2 ${card.highlight ? "text-primary-foreground" : "text-foreground"}`}>
            {card.value}
          </p>
          <p className={`text-xs mt-0.5 ${card.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
