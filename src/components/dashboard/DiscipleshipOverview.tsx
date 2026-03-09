import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import type { PcoListCounts } from "@/hooks/useDashboardData";

interface DiscipleshipOverviewProps {
  enrollments: Array<{
    status: string;
    discipleship_programs: { name: string; program_type: string } | null;
  }>;
  pcoListCounts: PcoListCounts | null;
}

const PCO_LIST_LABELS: Record<string, string> = {
  "Life Groups": "Life Groups",
  "AAC Bible Studies": "Bible Studies",
  "Discipleship Groups": "Discipleship",
  "PT Mentorship": "PT Mentorship",
};

const COLORS = [
  "hsl(205, 79%, 20%)",
  "hsl(205, 58%, 47%)",
  "hsl(49, 86%, 46%)",
  "hsl(205, 40%, 60%)",
];

const PCO_LIST_KEYS = ["Life Groups", "AAC Bible Studies", "Discipleship Groups", "PT Mentorship"];

const DiscipleshipOverview = ({ enrollments, pcoListCounts }: DiscipleshipOverviewProps) => {
  const data = pcoListCounts
    ? PCO_LIST_KEYS.map((key) => ({
        name: PCO_LIST_LABELS[key],
        value: pcoListCounts[key as keyof PcoListCounts] ?? 0,
      }))
    : [];

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <h3 className="font-display font-semibold text-foreground">Discipleship</h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-2">{total} people in lists</p>
      {total === 0 ? (
        <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
          {pcoListCounts ? "No list members found" : "Loading Planning Center data…"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={100} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: 13,
              }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} name="People">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DiscipleshipOverview;
