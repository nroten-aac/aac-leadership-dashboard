import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { useState } from "react";

interface MonthlyGiving {
  id: string;
  year: number;
  month: string;
  fund: string;
  amount: number;
}

interface DonationsChartProps {
  monthlyGiving: MonthlyGiving[];
}

const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const FUND_COLORS: Record<string, string> = {
  general: "hsl(140 50% 38%)",
  building: "hsl(var(--secondary))",
  missions: "hsl(var(--accent))",
  benevolence: "hsl(var(--primary))",
};
const FUND_LABELS: Record<string, string> = {
  general: "General",
  building: "Building",
  missions: "Missions",
  benevolence: "Benevolence",
};
const ALL_FUNDS = ["general", "building", "missions", "benevolence"];

const DonationsChart = ({ monthlyGiving }: DonationsChartProps) => {
  const [activeFunds, setActiveFunds] = useState<string[]>(ALL_FUNDS);

  const toggleFund = (fund: string) => {
    setActiveFunds((prev) =>
      prev.includes(fund) ? prev.filter((f) => f !== fund) : [...prev, fund]
    );
  };

  // Build last 24 months
  const now = new Date();
  const months = Array.from({ length: 24 }, (_, i) => {
    const date = subMonths(now, 23 - i);
    const monthName = format(date, "MMMM");
    const year = date.getFullYear();
    return { label: format(date, "MMM yy"), monthName, year };
  });

  const chartData = months.map(({ label, monthName, year }) => {
    const row: Record<string, any> = { month: label };
    for (const fund of ALL_FUNDS) {
      const entry = monthlyGiving.find(
        (g) => g.year === year && g.month === monthName && g.fund === fund
      );
      row[FUND_LABELS[fund]] = entry ? entry.amount : 0;
    }
    return row;
  });

  const totalGiving = chartData.reduce((s, d) => {
    let sum = s;
    for (const fund of activeFunds) {
      sum += (d[FUND_LABELS[fund]] as number) || 0;
    }
    return sum;
  }, 0);

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-display font-semibold text-foreground">Giving Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            ${totalGiving.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} over 24 months
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ALL_FUNDS.map((fund) => (
            <button
              key={fund}
              onClick={() => toggleFund(fund)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                activeFunds.includes(fund)
                  ? "text-primary-foreground border-transparent"
                  : "bg-muted text-muted-foreground border-border opacity-50"
              }`}
              style={
                activeFunds.includes(fund)
                  ? { backgroundColor: FUND_COLORS[fund] }
                  : {}
              }
            >
              {FUND_LABELS[fund]}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} barCategoryGap="12%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: 13,
            }}
            formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {ALL_FUNDS.map((fund, i) =>
            activeFunds.includes(fund) ? (
              <Bar
                key={fund}
                dataKey={FUND_LABELS[fund]}
                stackId="a"
                fill={FUND_COLORS[fund]}
                radius={i === ALL_FUNDS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ) : null
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonationsChart;
