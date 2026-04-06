import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";

type ColumnDef = {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
};

interface RecentEntriesProps {
  table: "attendance" | "monthly_giving" | "members";
  columns: ColumnDef[];
  orderBy?: string | { column: string; ascending: boolean }[];
  title?: string;
  limit?: number;
  yearField?: string;
}

const RecentEntries = ({ table, columns, orderBy = "created_at", title = "Recent Entries", limit = 10, yearField }: RecentEntriesProps) => {
  const [selectedYear, setSelectedYear] = useState<string>("recent");

  const { data, isLoading } = useQuery({
    queryKey: [table, "recent-all"],
    queryFn: async () => {
      let query = supabase.from(table).select("*");
      if (Array.isArray(orderBy)) {
        orderBy.forEach((o) => {
          query = query.order(o.column, { ascending: o.ascending });
        });
      } else {
        query = query.order(orderBy, { ascending: false });
      }
      // Fetch up to 1000 rows to support year filtering
      const { data, error } = await query.limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const years = useMemo(() => {
    if (!data || !yearField) return [];
    const set = new Set(data.map((r: any) => r[yearField]));
    return Array.from(set).sort((a: any, b: any) => b - a);
  }, [data, yearField]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (selectedYear === "recent") return data.slice(0, limit);
    if (!yearField) return data.slice(0, limit);
    return data.filter((r: any) => String(r[yearField]) === selectedYear);
  }, [data, selectedYear, yearField, limit]);

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" /> {title}
        </h3>
        {yearField && years.length > 0 && (
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent ({limit})</SelectItem>
              {years.map((y: any) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !filtered?.length ? (
        <p className="text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row: any) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default RecentEntries;
