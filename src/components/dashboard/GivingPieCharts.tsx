import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";

interface MonthlyGiving {
  id: string;
  year: number;
  month: string;
  fund: string;
  amount: number;
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

const GivingPieCharts = ({ monthlyGiving }: { monthlyGiving: MonthlyGiving[] }) => {
  const { currentMonthData, currentMonthLabel, ytdData, ytdLabel, ytdMonthlyBreakdown } = useMemo(() => {
    if (!monthlyGiving.length) return { currentMonthData: [], currentMonthLabel: "", ytdData: [], ytdLabel: "", ytdMonthlyBreakdown: [] as { month: string; total: number }[] };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    // Exclude the current (incomplete) month
    const completed = monthlyGiving.filter((g) => {
      const gMonthIdx = MONTH_ORDER.indexOf(g.month);
      return !(g.year === currentYear && gMonthIdx === currentMonthIdx);
    });

    if (!completed.length) return { currentMonthData: [], currentMonthLabel: "", ytdData: [], ytdLabel: "", ytdMonthlyBreakdown: [] as { month: string; total: number }[] };

    // Find the most recent completed month
    const sorted = [...completed].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return MONTH_ORDER.indexOf(b.month) - MONTH_ORDER.indexOf(a.month);
    });
    const latestYear = sorted[0].year;
    const latestMonth = sorted[0].month;

    // Current month totals by fund
    const monthTotals: Record<string, number> = {};
    monthlyGiving
      .filter((g) => g.year === latestYear && g.month === latestMonth)
      .forEach((g) => {
        monthTotals[g.fund] = (monthTotals[g.fund] || 0) + g.amount;
      });

    // YTD totals by fund (excluding current incomplete month)
    const ytdTotals: Record<string, number> = {};
    completed
      .filter((g) => g.year === latestYear)
      .forEach((g) => {
        ytdTotals[g.fund] = (ytdTotals[g.fund] || 0) + g.amount;
      });

    // Per-month totals (all funds) for YTD year
    const monthTotalsMap: Record<string, number> = {};
    completed
      .filter((g) => g.year === latestYear)
      .forEach((g) => {
        monthTotalsMap[g.month] = (monthTotalsMap[g.month] || 0) + g.amount;
      });
    const ytdMonthlyBreakdown = MONTH_ORDER
      .filter((m) => monthTotalsMap[m] != null)
      .map((m) => ({ month: m, total: monthTotalsMap[m] }));

    const toData = (totals: Record<string, number>) =>
      Object.entries(totals)
        .filter(([, v]) => v > 0)
        .map(([fund, value]) => ({
          name: FUND_LABELS[fund] || fund,
          value,
          color: FUND_COLORS[fund] || "hsl(var(--muted))",
        }));

    return {
      currentMonthData: toData(monthTotals),
      currentMonthLabel: `${latestMonth.slice(0, 3)} ${latestYear}`,
      ytdData: toData(ytdTotals),
      ytdLabel: `${latestYear} YTD`,
      ytdMonthlyBreakdown,
    };
  }, [monthlyGiving]);

  const renderPie = (
    data: { name: string; value: number; color: string }[],
    title: string,
    total: number,
    breakdown?: { month: string; total: number }[],
  ) => (
    <div className="bg-card rounded-2xl shadow-card p-6 flex-1 min-w-[280px]">
      <h3 className="font-display font-semibold text-foreground text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">
        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
      </p>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No data</p>
      ) : (
        <>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="60%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: 14,
                }}
                formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                <div>
                  <span className="text-foreground font-medium">{entry.name}</span>
                  <span className="text-muted-foreground ml-1.5">
                    ${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {breakdown && breakdown.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Monthly contributions to total
            </p>
            <div className="space-y-1.5">
              {breakdown.map((m) => {
                const pct = total > 0 ? (m.total / total) * 100 : 0;
                return (
                  <div key={m.month} className="flex items-center gap-2 text-xs">
                    <span className="w-12 shrink-0 text-muted-foreground">{m.month.slice(0, 3)}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-24 text-right font-medium tabular-nums text-foreground">
                      ${m.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 text-xs pt-1.5 mt-1 border-t border-border">
                <span className="w-12 shrink-0 font-semibold">Total</span>
                <div className="flex-1" />
                <span className="w-24 text-right font-bold tabular-nums text-primary">
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );

  const currentTotal = currentMonthData.reduce((s, d) => s + d.value, 0);
  const ytdTotal = ytdData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {renderPie(currentMonthData, `Giving Breakdown — ${currentMonthLabel}`, currentTotal)}
      {renderPie(ytdData, `Giving Breakdown — ${ytdLabel}`, ytdTotal, ytdMonthlyBreakdown)}
    </div>
  );
};

export default GivingPieCharts;
