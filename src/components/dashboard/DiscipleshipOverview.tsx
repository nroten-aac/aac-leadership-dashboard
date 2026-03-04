import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DiscipleshipOverviewProps {
  enrollments: Array<{
    status: string;
    discipleship_programs: { name: string; program_type: string } | null;
  }>;
}

const PROGRAM_LABELS: Record<string, string> = {
  life_group: "Life Groups",
  pt_program: "PT Program",
  discipleship_group: "Discipleship Groups",
  bible_study: "Bible Studies",
};

const COLORS = [
  "hsl(205, 79%, 20%)",
  "hsl(205, 58%, 47%)",
  "hsl(49, 86%, 46%)",
  "hsl(210, 25%, 15%)",
];

const DiscipleshipOverview = ({ enrollments }: DiscipleshipOverviewProps) => {
  const activeEnrollments = enrollments.filter((e) => e.status === "active");

  const byType = Object.entries(PROGRAM_LABELS).map(([key, label]) => ({
    name: label,
    value: activeEnrollments.filter((e) => e.discipleship_programs?.program_type === key).length,
  }));

  const total = activeEnrollments.length;

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Discipleship Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
            No active enrollments yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={byType}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {byType.map((_, i) => (
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
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscipleshipOverview;
