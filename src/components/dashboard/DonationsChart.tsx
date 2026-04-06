import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from "recharts";
import { subMonths } from "date-fns";
import { useState, useMemo } from "react";
import MultiSelectFilter from "./MultiSelectFilter";

interface MonthlyGiving {
  id: string;
  year: number;
  month: string;
  fund: string;
  amount: number;
}

interface DonationsChartProps {
  monthlyGiving: MonthlyGiving[];
  defaultFunds?: string[];
  defaultYearFilter?: string[];
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

const DonationsChart = ({ monthlyGiving, defaultFunds, defaultYearFilter }: DonationsChartProps) => {
  const [activeFunds, setActiveFunds] = useState<string[]>(defaultFunds ?? ALL_FUNDS);
  const [yearFilter, setYearFilter] = useState<string[]>(defaultYearFilter ?? [String(new Date().getFullYear())]);

  const [quarterFilter, setQuarterFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);

  const toggleFund = (fund: string) => {
    setActiveFunds((prev) =>
      prev.includes(fund) ? prev.filter((f) => f !== fund) : [...prev, fund]
    );
  };

  const years = useMemo(() => {
    const set = new Set(monthlyGiving.map((g) => g.year));
    return Array.from(set).sort();
  }, [monthlyGiving]);

  const ALL_QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

  const months = useMemo(() => {
    const set = new Set(monthlyGiving.map((g) => g.month));
    return Array.from(set).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  }, [monthlyGiving]);

  const getQuarter = (month: string) => {
    const idx = MONTH_ORDER.indexOf(month);
    if (idx < 3) return "Q1";
    if (idx < 6) return "Q2";
    if (idx < 9) return "Q3";
    return "Q4";
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = subMonths(now, 12);
    const cutoffYear = cutoff.getFullYear();
    const cutoffMonthIdx = cutoff.getMonth();

    return monthlyGiving.filter((g) => {
      if (yearFilter.length > 0) {
        if (yearFilter.includes("rolling")) {
          const gMonthIdx = MONTH_ORDER.indexOf(g.month);
          if (g.year < cutoffYear) return false;
          if (g.year === cutoffYear && gMonthIdx < cutoffMonthIdx) return false;
        } else {
          if (!yearFilter.includes(String(g.year))) return false;
        }
      }
      if (quarterFilter.length > 0 && !quarterFilter.includes(getQuarter(g.month))) return false;
      if (monthFilter.length > 0 && !monthFilter.includes(g.month)) return false;
      return true;
    });
  }, [monthlyGiving, yearFilter, quarterFilter, monthFilter]);

  const chartData = useMemo(() => {
    const map = new Map<string, Record<string, any>>();
    filtered.forEach((g) => {
      const key = `${g.month.slice(0, 3)} ${String(g.year).slice(2)}`;
      const sortKey = `${g.year}-${String(MONTH_ORDER.indexOf(g.month)).padStart(2, "0")}`;
      if (!map.has(sortKey)) {
        map.set(sortKey, { month: key, _sort: sortKey });
        for (const fund of ALL_FUNDS) {
          map.get(sortKey)![FUND_LABELS[fund]] = 0;
        }
      }
      const label = FUND_LABELS[g.fund];
      if (label) {
        map.get(sortKey)![label] = (map.get(sortKey)![label] || 0) + g.amount;
      }
    });
    return Array.from(map.values()).sort((a, b) => a._sort.localeCompare(b._sort));
  }, [filtered]);

  const dataWithTrend = useMemo(() => {
    const withTotals = chartData.map((d) => {
      let total = 0;
      for (const fund of activeFunds) {
        total += (d[FUND_LABELS[fund]] as number) || 0;
      }
      return { ...d, _total: total };
    });

    const n = withTotals.length;
    if (n < 2) return withTotals.map((d) => ({ ...d, trend: null as number | null }));

    const nonZero = withTotals.map((d, i) => ({ i, total: d._total })).filter((d) => d.total > 0);
    if (nonZero.length < 2) return withTotals.map((d) => ({ ...d, trend: null as number | null }));

    const nz = nonZero.length;
    const sumX = nonZero.reduce((s, d) => s + d.i, 0);
    const sumY = nonZero.reduce((s, d) => s + d.total, 0);
    const sumXY = nonZero.reduce((s, d) => s + d.i * d.total, 0);
    const sumX2 = nonZero.reduce((s, d) => s + d.i * d.i, 0);
    const denom = nz * sumX2 - sumX * sumX;
    const slope = denom !== 0 ? (nz * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / nz;

    return withTotals.map((d, i) => ({
      ...d,
      trend: d._total > 0 ? Math.round(slope * i + intercept) : null,
    }));
  }, [chartData, activeFunds]);

  const totalGiving = chartData.reduce((s, d) => {
    let sum = s;
    for (const fund of activeFunds) {
      sum += (d[FUND_LABELS[fund]] as number) || 0;
    }
    return sum;
  }, 0);

  const titleSuffix = useMemo(() => {
    const parts: string[] = [];
    if (yearFilter.length === 0) parts.push("All Time");
    else if (yearFilter.includes("rolling")) parts.push("Rolling 12 Months");
    else parts.push(yearFilter.join(", "));
    if (quarterFilter.length > 0) parts.push(quarterFilter.join(", "));
    if (monthFilter.length > 0) parts.push(monthFilter.map((m) => m.slice(0, 3)).join(", "));
    return parts.join(" · ");
  }, [yearFilter, quarterFilter, monthFilter]);

  const yearOptions = [
    { value: "rolling", label: "Rolling 12mo" },
    ...years.map((y) => ({ value: String(y), label: String(y) })),
  ];
  const quarterOptions = ALL_QUARTERS.map((q) => ({ value: q, label: q }));
  const monthOptions = months.map((m) => ({ value: m, label: m.slice(0, 3) }));

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground">Giving Overview — {titleSuffix}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            ${totalGiving.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelectFilter label="Years" options={yearOptions} selected={yearFilter} onChange={setYearFilter} width="w-[130px]" />
          <MultiSelectFilter label="Qtrs" options={quarterOptions} selected={quarterFilter} onChange={setQuarterFilter} width="w-[110px]" />
          <MultiSelectFilter label="Months" options={monthOptions} selected={monthFilter} onChange={setMonthFilter} width="w-[120px]" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
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
      {dataWithTrend.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">No data for selected filters</p>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={dataWithTrend} barCategoryGap="20%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={dataWithTrend.length > 18 ? Math.floor(dataWithTrend.length / 12) : 0}
              angle={dataWithTrend.length > 12 ? -45 : 0}
              textAnchor={dataWithTrend.length > 12 ? "end" : "middle"}
              height={dataWithTrend.length > 12 ? 55 : 30}
            />
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
              formatter={(value: number, name: string) =>
                name === "Trend" ? `$${value.toLocaleString()}` : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              }
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {ALL_FUNDS.map((fund) =>
              activeFunds.includes(fund) ? (
                <Bar
                  key={fund}
                  dataKey={FUND_LABELS[fund]}
                  fill={FUND_COLORS[fund]}
                  radius={[4, 4, 0, 0]}
                  barSize={dataWithTrend.length > 18 ? 18 : dataWithTrend.length > 6 ? 28 : 44}
                >
                  <LabelList
                    dataKey={FUND_LABELS[fund]}
                    position="top"
                    style={{
                      fontSize: dataWithTrend.length > 18 ? 7 : 9,
                      fill: "hsl(var(--foreground))",
                      fontWeight: 700,
                    }}
                    formatter={(value: number) => (value > 0 ? `$${value.toLocaleString()}` : "")}
                  />
                </Bar>
              ) : null
            )}
            <Line
              type="monotone"
              dataKey="trend"
              name="Trend"
              stroke="hsl(var(--accent))"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DonationsChart;
