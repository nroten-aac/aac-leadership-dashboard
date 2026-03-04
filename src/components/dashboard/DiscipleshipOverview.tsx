import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface DiscipleshipOverviewProps {
  enrollments: Array<{
    status: string;
    discipleship_programs: { name: string; program_type: string } | null;
  }>;
}

const PROGRAM_LABELS: Record<string, string> = {
  life_group: "Life Groups",
  pt_program: "PT Program",
  discipleship_group: "Discipleship",
  bible_study: "Bible Studies",
};

const COLORS = [
  "hsl(205, 79%, 20%)",
  "hsl(205, 58%, 47%)",
  "hsl(49, 86%, 46%)",
  "hsl(205, 40%, 60%)",
];

const DiscipleshipOverview = ({ enrollments }: DiscipleshipOverviewProps) => {
  const activeEnrollments = enrollments.filter((e) => e.status === "active");

  const data = Object.entries(PROGRAM_LABELS).map(([key, label]) => ({
    name: label,
    value: activeEnrollments.filter((e) => e.discipleship_programs?.program_type === key).length,
  }));

  const total = activeEnrollments.length;

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg">Discipleship</CardTitle>
        <p className="text-xs text-muted-foreground">{total} active enrollments</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
            No active enrollments yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={100} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Enrolled">
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscipleshipOverview;
