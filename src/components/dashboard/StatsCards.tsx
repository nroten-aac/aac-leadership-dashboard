import { useState, useMemo } from "react";
import { Users, TrendingUp, DollarSign, BookOpen } from "lucide-react";
import { parseISO, subYears, format } from "date-fns";
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

interface StatsCardsProps {
  attendance: AttendanceRecord[];
  totalDonations: number;
  totalEnrollments: number;
}

const CHURCH_FAMILY = {
  memberAdults: 55,
  memberDependents: 17,
  regularAdults: 38,
  regularDependents: 14,
};
const CHURCH_FAMILY_TOTAL = Object.values(CHURCH_FAMILY).reduce((a, b) => a + b, 0);

type FilterType = "rolling" | "year" | "quarter" | "month";

const StatsCards = ({ attendance, totalDonations, totalEnrollments }: StatsCardsProps) => {
  const [filterType, setFilterType] = useState<FilterType>("rolling");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

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
    const order = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return Array.from(set).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [attendance]);

  const rollingCutoff = useMemo(() => {
    if (attendance.length === 0) return "";
    const sorted = [...attendance].sort((a, b) => b.event_date.localeCompare(a.event_date));
    return format(subYears(parseISO(sorted[0].event_date), 1), "yyyy-MM-dd");
  }, [attendance]);

  const avgAttendance = useMemo(() => {
    let filtered = attendance;
    if (filterType === "rolling") {
      filtered = attendance.filter((a) => a.event_date >= rollingCutoff);
    } else if (filterType === "year" && selectedYear) {
      filtered = attendance.filter((a) => a.year === Number(selectedYear));
    } else if (filterType === "quarter" && selectedQuarter) {
      filtered = attendance.filter((a) => a.quarter === selectedQuarter);
    } else if (filterType === "month" && selectedMonth) {
      filtered = attendance.filter((a) => a.month === selectedMonth);
    }
    const nonZero = filtered.filter((a) => a.adjusted_total > 0);
    if (nonZero.length === 0) return 0;
    return Math.round(nonZero.reduce((s, a) => s + a.adjusted_total, 0) / nonZero.length);
  }, [attendance, filterType, selectedYear, selectedQuarter, selectedMonth, rollingCutoff]);

  const filterLabel = useMemo(() => {
    if (filterType === "rolling") return "rolling year";
    if (filterType === "year" && selectedYear) return selectedYear;
    if (filterType === "quarter" && selectedQuarter) return selectedQuarter;
    if (filterType === "month" && selectedMonth) return selectedMonth.slice(0, 3);
    return "per service";
  }, [filterType, selectedYear, selectedQuarter, selectedMonth]);

  const familyGroups = [
    { label: "Member Adults", value: CHURCH_FAMILY.memberAdults, color: "hsl(var(--primary))" },
    { label: "Member Dependents", value: CHURCH_FAMILY.memberDependents, color: "hsl(var(--secondary))" },
    { label: "RA Adults", value: CHURCH_FAMILY.regularAdults, color: "hsl(var(--accent))" },
    { label: "RA Dependents", value: CHURCH_FAMILY.regularDependents, color: "hsl(var(--muted-foreground))" },
  ];

  const handleFilterChange = (value: string) => {
    setFilterType(value as FilterType);
    setSelectedYear("");
    setSelectedQuarter("");
    setSelectedMonth("");
  };

  const needsSecondSelect = filterType === "year" || filterType === "quarter" || filterType === "month";
  const secondOptions = filterType === "year" ? years.map(String) : filterType === "quarter" ? quarters : months;
  const secondValue = filterType === "year" ? selectedYear : filterType === "quarter" ? selectedQuarter : selectedMonth;
  const setSecondValue = filterType === "year" ? setSelectedYear : filterType === "quarter" ? setSelectedQuarter : setSelectedMonth;

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
      </div>

      {/* Total Giving */}
      <div className="rounded-2xl p-5 bg-card shadow-card transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Total Giving</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent/20">
            <DollarSign className="h-4.5 w-4.5 text-accent-foreground" />
          </div>
        </div>
        <p className="text-2xl font-display font-bold mt-2 text-foreground">${totalDonations.toLocaleString()}</p>
        <p className="text-xs mt-0.5 text-muted-foreground">all time</p>
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
