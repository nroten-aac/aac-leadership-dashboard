import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";
import { format } from "date-fns";

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
}

const RecentEntries = ({ table, columns, orderBy = "created_at", title = "Recent Entries", limit = 10 }: RecentEntriesProps) => {
  const { data, isLoading } = useQuery({
    queryKey: [table, "recent"],
    queryFn: async () => {
      let query = supabase.from(table).select("*");
      if (Array.isArray(orderBy)) {
        orderBy.forEach((o) => {
          query = query.order(o.column, { ascending: o.ascending });
        });
      } else {
        query = query.order(orderBy, { ascending: false });
      }
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4" /> {title}
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.length ? (
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
              {data.map((row: any) => (
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
