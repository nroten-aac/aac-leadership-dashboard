import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    return {
      month: format(startOfMonth(date), "MMM yyyy"),
      key: format(startOfMonth(date), "yyyy-MM"),
    };
  });

  const chartData = months.map(({ month, key }) => {
    const monthDonations = donations.filter((d) => format(parseISO(d.donation_date), "yyyy-MM") === key);
    return {
      month,
      tithes: monthDonations.filter((d) => d.donation_type === "tithe").reduce((s, d) => s + d.amount, 0),
      offerings: monthDonations.filter((d) => d.donation_type === "offering").reduce((s, d) => s + d.amount, 0),
      other: monthDonations.filter((d) => !["tithe", "offering"].includes(d.donation_type)).reduce((s, d) => s + d.amount, 0),
    };
  });

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Giving Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 13,
              }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Area type="monotone" dataKey="tithes" name="Tithes" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
            <Area type="monotone" dataKey="offerings" name="Offerings" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" strokeWidth={2} />
            <Area type="monotone" dataKey="other" name="Other" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DonationsChart;
