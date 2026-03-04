import { Users, TrendingUp, DollarSign, BookOpen } from "lucide-react";

interface StatsCardsProps {
  totalMembers: number;
  activeMembers: number;
  totalDonations: number;
  avgAttendance: number;
  totalEnrollments: number;
}

const StatsCards = ({ totalMembers, activeMembers, totalDonations, avgAttendance, totalEnrollments }: StatsCardsProps) => {
  const cards = [
    {
      title: "Total Members",
      value: totalMembers.toString(),
      subtitle: `${activeMembers} active`,
      icon: Users,
      highlight: false,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
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
