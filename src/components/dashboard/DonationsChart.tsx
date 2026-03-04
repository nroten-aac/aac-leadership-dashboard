import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from "recharts";
import { format, subMonths } from "date-fns";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [activeFunds, setActiveFunds] = useState<string[]>(["general"]);
  const [yearFilter, setYearFilter] = useState<string>("rolling");
  const [quarterFilter, setQuarterFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const toggleFund = (fund: string) => {
    setActiveFunds((prev) =>
      prev.includes(fund) ? prev.filter((f) => f !== fund) : [...prev, fund]
    );
  };

  const years = useMemo(() => {
    const set = new Set(monthlyGiving.map((g) => g.year));
    return Array.from(set).sort();
  }, [monthlyGiving]);

  const quarters = ["Q1", "Q2", "Q3", "Q4"];

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
      // Year filter
      if (yearFilter === "rolling") {
        const gMonthIdx = MONTH_ORDER.indexOf(g.month);
        if (g.year < cutoffYear) return false;
        if (g.year === cutoffYear && gMonthIdx < cutoffMonthIdx) return false;
      } else if (yearFilter !== "all") {
        if (g.year !== Number(yearFilter)) return false;
      }
      // Quarter filter
      if (quarterFilter !== "all" && getQuarter(g.month) !== quarterFilter) return false;
      // Month filter
      if (monthFilter !== "all" && g.month !== monthFilter) return false;
      return true;
    });
  }, [monthlyGiving, yearFilter, quarterFilter, monthFilter]);

  // Build chart data from filtered records
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

  const totalGiving = chartData.reduce((s, d) => {
    let sum = s;
    for (const fund of activeFunds) {
      sum += (d[FUND_LABELS[fund]] as number) || 0;
    }
    return sum;
  }, 0);

  // Dynamic title
  const titleSuffix = useMemo(() => {
    const parts: string[] = [];
    if (yearFilter === "rolling") parts.push("Rolling 12 Months");
    else if (yearFilter === "all") parts.push("All Time");
    else parts.push(yearFilter);
    if (quarterFilter !== "all") parts.push(quarterFilter);
    if (monthFilter !== "all") parts.push(monthFilter);
    return parts.join(" · ");
  }, [yearFilter, quarterFilter, monthFilter]);

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
          <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setQuarterFilter("all"); setMonthFilter("all"); }}>
            <SelectTrigger className="w-[120px] h-8 text-xs rounded-xl border-border/50">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rolling">Rolling 12mo</SelectItem>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={quarterFilter} onValueChange={setQuarterFilter}>
            <SelectTrigger className="w-[100px] h-8 text-xs rounded-xl border-border/50">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Qtrs</SelectItem>
              {quarters.map((q) => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[110px] h-8 text-xs rounded-xl border-border/50">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>{m.slice(0, 3)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">No data for selected filters</p>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={chartData} barCategoryGap="20%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={chartData.length > 18 ? Math.floor(chartData.length / 12) : 0}
              angle={chartData.length > 12 ? -45 : 0}
              textAnchor={chartData.length > 12 ? "end" : "middle"}
              height={chartData.length > 12 ? 55 : 30}
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
              formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {ALL_FUNDS.map((fund) =>
              activeFunds.includes(fund) ? (
                <Bar
                  key={fund}
                  dataKey={FUND_LABELS[fund]}
                  fill={FUND_COLORS[fund]}
                  radius={[4, 4, 0, 0]}
                  barSize={chartData.length > 18 ? 10 : chartData.length > 6 ? 16 : 28}
                >
                  <LabelList
                    dataKey={FUND_LABELS[fund]}
                    position="top"
                    style={{
                      fontSize: chartData.length > 18 ? 7 : 9,
                      fill: "hsl(var(--foreground))",
                      fontWeight: 700,
                    }}
                    formatter={(value: number) => (value > 0 ? `$${value.toLocaleString()}` : "")}
                  />
                </Bar>
              ) : null
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DonationsChart;
