import { Users, TrendingUp, DollarSign, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
      value: totalMembers,
      subtitle: `${activeMembers} active`,
      icon: Users,
      gradient: "gradient-primary",
    },
    {
      title: "Avg. Attendance",
      value: avgAttendance,
      subtitle: "per service",
      icon: TrendingUp,
      gradient: "bg-secondary",
    },
    {
      title: "Total Giving",
      value: `$${totalDonations.toLocaleString()}`,
      subtitle: "all time",
      icon: DollarSign,
      gradient: "bg-accent",
    },
    {
      title: "Discipleship",
      value: totalEnrollments,
      subtitle: "active enrollments",
      icon: BookOpen,
      gradient: "gradient-primary",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card
          key={card.title}
          className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <CardContent className="p-0">
            <div className="flex items-center gap-4 p-5">
              <div className={`${card.gradient} p-3 rounded-xl`}>
                <card.icon className={`h-6 w-6 ${card.gradient === 'bg-accent' ? 'text-accent-foreground' : 'text-primary-foreground'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-display font-bold text-foreground animate-count-up">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
