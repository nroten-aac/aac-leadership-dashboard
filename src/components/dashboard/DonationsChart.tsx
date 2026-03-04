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
    <Card className="border-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="font-display text-lg">Giving Overview</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            ${totalGiving.toLocaleString()} over 12 months
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
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
      </CardContent>
    </Card>
  );
};

export default DonationsChart;
