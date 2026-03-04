import { useState, useMemo } from "react";
import { Users, TrendingUp, DollarSign, BookOpen } from "lucide-react";
import { parseISO, subYears, subMonths, format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceRecord {
  event_date: string;
  adjusted_total: number;
  year: number;
  quarter: string;
  month: string;
}

interface MonthlyGiving {
  id: string;
  year: number;
  month: string;
  fund: string;
  amount: number;
}

interface StatsCardsProps {
  attendance: AttendanceRecord[];
  totalDonations: number;
  totalEnrollments: number;
  monthlyGiving: MonthlyGiving[];
}

const CHURCH_FAMILY = {
  memberAdults: 55,
  memberDependents: 17,
  regularAdults: 38,
  regularDependents: 14,
};
const CHURCH_FAMILY_TOTAL = Object.values(CHURCH_FAMILY).reduce((a, b) => a + b, 0);

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

type FilterType = "rolling" | "year" | "quarter" | "month";

const getQuarter = (month: string) => {
  const idx = MONTH_ORDER.indexOf(month);
  if (idx < 3) return "Q1";
  if (idx < 6) return "Q2";
  if (idx < 9) return "Q3";
  return "Q4";
};

const StatsCards = ({ attendance, totalDonations, totalEnrollments, monthlyGiving }: StatsCardsProps) => {
  // Attendance filter state
  const [filterType, setFilterType] = useState<FilterType>("rolling");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  // Giving filter state
  const [givingFilterType, setGivingFilterType] = useState<FilterType>("rolling");
  const [givingSelectedYear, setGivingSelectedYear] = useState<string>("");
  const [givingSelectedQuarter, setGivingSelectedQuarter] = useState<string>("");
  const [givingSelectedMonth, setGivingSelectedMonth] = useState<string>("");

  // Attendance options
  const years = useMemo(() => {
    const set = new Set(attendance.map((a) => a.year));
    return Array.from(set).sort();
  }, [attendance]);

  const quarters = useMemo(() => {
    const set = new Set(attendance.map((a) => a.quarter));
    return Array.from(set).sort();
  }, [attendance]);

  const months = useMemo(() => {
    const set = new Set(attendance.map((a) => a.month));
    return Array.from(set).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  }, [attendance]);

  // Giving options
  const givingYears = useMemo(() => {
    const set = new Set(monthlyGiving.map((g) => g.year));
    return Array.from(set).sort();
  }, [monthlyGiving]);

  const givingMonths = useMemo(() => {
    const set = new Set(monthlyGiving.map((g) => g.month));
    return Array.from(set).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  }, [monthlyGiving]);

  const rollingCutoff = useMemo(() => {
    if (attendance.length === 0) return "";
    const sorted = [...attendance].sort((a, b) => b.event_date.localeCompare(a.event_date));
    return format(subYears(parseISO(sorted[0].event_date), 1), "yyyy-MM-dd");
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    if (filterType === "rolling") {
      return attendance.filter((a) => a.event_date >= rollingCutoff);
    } else if (filterType === "year" && selectedYear) {
      return attendance.filter((a) => a.year === Number(selectedYear));
    } else if (filterType === "quarter" && selectedQuarter) {
      return attendance.filter((a) => a.quarter === selectedQuarter);
    } else if (filterType === "month" && selectedMonth) {
      return attendance.filter((a) => a.month === selectedMonth);
    }
    return attendance;
  }, [attendance, filterType, selectedYear, selectedQuarter, selectedMonth, rollingCutoff]);

  const avgAttendance = useMemo(() => {
    const weeklyMap = new Map<string, number>();
    filteredAttendance.forEach((a) => {
      weeklyMap.set(a.event_date, (weeklyMap.get(a.event_date) || 0) + a.adjusted_total);
    });
    const nonZeroWeeks = Array.from(weeklyMap.values()).filter((v) => v > 0);
    if (nonZeroWeeks.length === 0) return 0;
    return Math.round(nonZeroWeeks.reduce((s, v) => s + v, 0) / nonZeroWeeks.length);
  }, [filteredAttendance]);

  const roomAverages = useMemo(() => {
    const rooms = ["sanctuary_attendance", "nursery_attendance", "k3_attendance", "grade_4_6_attendance", "youth_attendance"] as const;
    const roomLabels: Record<string, string> = {
      sanctuary_attendance: "Sanctuary",
      nursery_attendance: "Nursery",
      k3_attendance: "K-3",
      grade_4_6_attendance: "Gr. 4-6",
      youth_attendance: "Youth",
    };
    const roomColors: Record<string, string> = {
      sanctuary_attendance: "hsl(var(--primary))",
      nursery_attendance: "hsl(var(--secondary))",
      k3_attendance: "hsl(var(--accent))",
      grade_4_6_attendance: "hsl(140 50% 38%)",
      youth_attendance: "hsl(var(--muted-foreground))",
    };
    const weeklyMaps: Record<string, Map<string, number>> = {};
    for (const r of rooms) weeklyMaps[r] = new Map();
    filteredAttendance.forEach((a) => {
      for (const r of rooms) {
        weeklyMaps[r].set(a.event_date, (weeklyMaps[r].get(a.event_date) || 0) + (a as any)[r]);
      }
    });
    return rooms.map((r) => {
      const vals = Array.from(weeklyMaps[r].values()).filter((v) => v > 0);
      return {
        label: roomLabels[r],
        color: roomColors[r],
        value: vals.length === 0 ? 0 : Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      };
    });
  }, [filteredAttendance]);

  // Giving totals by fund
  const givingByFund = useMemo(() => {
    const now = new Date();
    const cutoff = subMonths(now, 12);
    const cutoffYear = cutoff.getFullYear();
    const cutoffMonthIdx = cutoff.getMonth();

    const filtered = monthlyGiving.filter((g) => {
      if (givingFilterType === "rolling") {
        const gMonthIdx = MONTH_ORDER.indexOf(g.month);
        if (g.year < cutoffYear) return false;
        if (g.year === cutoffYear && gMonthIdx < cutoffMonthIdx) return false;
      } else if (givingFilterType === "year" && givingSelectedYear) {
        if (g.year !== Number(givingSelectedYear)) return false;
      } else if (givingFilterType === "quarter" && givingSelectedQuarter) {
        if (getQuarter(g.month) !== givingSelectedQuarter) return false;
      } else if (givingFilterType === "month" && givingSelectedMonth) {
        if (g.month !== givingSelectedMonth) return false;
      }
      return true;
    });

    const totals: Record<string, number> = {};
    let grand = 0;
    for (const fund of ALL_FUNDS) totals[fund] = 0;
    filtered.forEach((g) => {
      if (totals[g.fund] !== undefined) {
        totals[g.fund] += g.amount;
        grand += g.amount;
      }
    });
    return { totals, grand };
  }, [monthlyGiving, givingFilterType, givingSelectedYear, givingSelectedQuarter, givingSelectedMonth]);

  const handleFilterChange = (value: string) => {
    setFilterType(value as FilterType);
    setSelectedYear("");
    setSelectedQuarter("");
    setSelectedMonth("");
  };

  const handleGivingFilterChange = (value: string) => {
    setGivingFilterType(value as FilterType);
    setGivingSelectedYear("");
    setGivingSelectedQuarter("");
    setGivingSelectedMonth("");
  };

  const needsSecondSelect = filterType === "year" || filterType === "quarter" || filterType === "month";
  const secondOptions = filterType === "year" ? years.map(String) : filterType === "quarter" ? quarters : months;
  const secondValue = filterType === "year" ? selectedYear : filterType === "quarter" ? selectedQuarter : selectedMonth;
  const setSecondValue = filterType === "year" ? setSelectedYear : filterType === "quarter" ? setSelectedQuarter : setSelectedMonth;

  const givingNeedsSecond = givingFilterType === "year" || givingFilterType === "quarter" || givingFilterType === "month";
  const givingSecondOptions = givingFilterType === "year" ? givingYears.map(String) : givingFilterType === "quarter" ? ["Q1","Q2","Q3","Q4"] : givingMonths;
  const givingSecondValue = givingFilterType === "year" ? givingSelectedYear : givingFilterType === "quarter" ? givingSelectedQuarter : givingSelectedMonth;
  const setGivingSecondValue = givingFilterType === "year" ? setGivingSelectedYear : givingFilterType === "quarter" ? setGivingSelectedQuarter : setGivingSelectedMonth;

  const familyGroups = [
    { label: "Member Adults", value: CHURCH_FAMILY.memberAdults, color: "hsl(var(--primary))" },
    { label: "Member Dependents", value: CHURCH_FAMILY.memberDependents, color: "hsl(var(--secondary))" },
    { label: "RA Adults", value: CHURCH_FAMILY.regularAdults, color: "hsl(var(--accent))" },
    { label: "RA Dependents", value: CHURCH_FAMILY.regularDependents, color: "hsl(var(--muted-foreground))" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Church Family card */}
      <div className="rounded-2xl p-5 bg-card shadow-card transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Church Family</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-display font-bold mt-2 text-foreground">{CHURCH_FAMILY_TOTAL}</p>
        <div className="mt-3 space-y-1.5">
          {familyGroups.map((g) => (
            <div key={g.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-muted-foreground">{g.label}</span>
              </div>
              <span className="font-semibold text-foreground">{g.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avg. Attendance card with filter */}
      <div className="rounded-2xl p-5 bg-card shadow-card transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Avg. Attendance</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary/10">
            <TrendingUp className="h-4.5 w-4.5 text-secondary" />
          </div>
        </div>
        <p className="text-2xl font-display font-bold mt-2 text-foreground">{avgAttendance}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Select value={filterType} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-6 text-[11px] w-auto min-w-[80px] rounded-lg border-border/50 px-2 py-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rolling">Rolling Year</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          {needsSecondSelect && (
            <Select value={secondValue} onValueChange={setSecondValue}>
              <SelectTrigger className="h-6 text-[11px] w-auto min-w-[70px] rounded-lg border-border/50 px-2 py-0">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {secondOptions.map((o) => (
                  <SelectItem key={o} value={String(o)}>
                    {filterType === "month" ? String(o).slice(0, 3) : o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="mt-3 space-y-1.5">
          {roomAverages.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-muted-foreground">{r.label}</span>
              </div>
              <span className="font-semibold text-foreground">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total Giving with filters + fund breakdown */}
      <div className="rounded-2xl p-5 bg-card shadow-card transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Total Giving</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent/20">
            <DollarSign className="h-4.5 w-4.5 text-accent-foreground" />
          </div>
        </div>
        <p className="text-2xl font-display font-bold mt-2 text-foreground">
          ${givingByFund.grand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Select value={givingFilterType} onValueChange={handleGivingFilterChange}>
            <SelectTrigger className="h-6 text-[11px] w-auto min-w-[80px] rounded-lg border-border/50 px-2 py-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rolling">Rolling Year</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          {givingNeedsSecond && (
            <Select value={givingSecondValue} onValueChange={setGivingSecondValue}>
              <SelectTrigger className="h-6 text-[11px] w-auto min-w-[70px] rounded-lg border-border/50 px-2 py-0">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {givingSecondOptions.map((o) => (
                  <SelectItem key={o} value={String(o)}>
                    {givingFilterType === "month" ? String(o).slice(0, 3) : o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="mt-3 space-y-1.5">
          {ALL_FUNDS.map((fund) => (
            <div key={fund} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FUND_COLORS[fund] }} />
                <span className="text-muted-foreground">{FUND_LABELS[fund]}</span>
              </div>
              <span className="font-semibold text-foreground">
                ${givingByFund.totals[fund].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Discipleship */}
      <div className="rounded-2xl p-5 gradient-primary text-primary-foreground shadow-soft transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-primary-foreground/70">Discipleship</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-foreground/15">
            <BookOpen className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
        </div>
        <p className="text-2xl font-display font-bold mt-2 text-primary-foreground">{totalEnrollments}</p>
        <p className="text-xs mt-0.5 text-primary-foreground/60">active enrollments</p>
      </div>
    </div>
  );
};

export default StatsCards;
