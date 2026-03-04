import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

interface DonationsChartProps {
  donations: Array<{
    amount: number;
    donation_date: string;
    donation_type: string;
  }>;
}

const DonationsChart = ({ donations }: DonationsChartProps) => {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, 11 - i);
    return {
      month: format(startOfMonth(date), "MMM yy"),
      key: format(startOfMonth(date), "yyyy-MM"),
    };
  });

  const chartData = months.map(({ month, key }) => {
    const md = donations.filter((d) => format(parseISO(d.donation_date), "yyyy-MM") === key);
    return {
      month,
      Tithes: md.filter((d) => d.donation_type === "tithe").reduce((s, d) => s + d.amount, 0),
      Offerings: md.filter((d) => d.donation_type === "offering").reduce((s, d) => s + d.amount, 0),
      Other: md.filter((d) => !["tithe", "offering"].includes(d.donation_type)).reduce((s, d) => s + d.amount, 0),
    };
  });

  const totalGiving = chartData.reduce((s, d) => s + d.Tithes + d.Offerings + d.Other, 0);

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground">Giving Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            ${totalGiving.toLocaleString()} over 12 months
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: 13,
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Tithes" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Offerings" stackId="a" fill="hsl(var(--secondary))" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Other" stackId="a" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonationsChart;
