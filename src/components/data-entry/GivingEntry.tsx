import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, Cloud, Loader2, CheckCircle, AlertCircle, Pencil, Trash2, Clock, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const FUNDS = ["general","building","missions","benevolence"];
const FUND_LABELS: Record<string, string> = { general: "General", building: "Building", missions: "Missions", benevolence: "Benevolence" };

const PcoGivingImportSection = ({ queryClient, toast }: { queryClient: any; toast: any }) => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ message: string; unmappedFunds?: string[]; errors?: string[] } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("import-pco-giving");
      if (error) {
        toast({ title: "Import failed", description: error.message, variant: "destructive" });
        setResult({ message: error.message });
      } else {
        setResult(data);
        toast({ title: "Import complete", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["monthly_giving"] });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setResult({ message: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
        <Cloud className="h-4 w-4" /> Planning Center Giving Import
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Pull all donation data from Planning Center and sync it to the giving database. This replaces existing monthly giving records with fresh data from PCO.
      </p>
      <Button onClick={handleImport} disabled={importing} className="gap-2">
        {importing ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
        ) : (
          <><Cloud className="h-4 w-4" /> Import from Planning Center</>
        )}
      </Button>
      {result && (
        <div className={`mt-4 p-3 rounded-xl text-sm flex items-start gap-2 ${result.errors ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {result.errors ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <div>
            <p>{result.message}</p>
            {result.unmappedFunds && result.unmappedFunds.length > 0 && (
              <p className="text-xs mt-1">Unmapped funds: {result.unmappedFunds.join(", ")}</p>
            )}
            {result.errors?.map((e, i) => <p key={i} className="text-xs mt-1">{e}</p>)}
          </div>
        </div>
      )}
    </div>
  );
};

const GivingEntry = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [fund, setFund] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month || !year || !fund || !amount) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("monthly_giving").upsert(
      { month, year: parseInt(year), fund, amount: parseFloat(amount), source: "manual" },
      { onConflict: "month,year,fund" as any }
    );
    setSaving(false);
    if (error) {
      const { error: insertError } = await supabase.from("monthly_giving").insert({
        month, year: parseInt(year), fund, amount: parseFloat(amount), source: "manual",
      });
      if (insertError) {
        toast({ title: "Error", description: insertError.message, variant: "destructive" });
        return;
      }
    }
    toast({ title: "Saved", description: `${FUND_LABELS[fund]} giving for ${month} ${year} saved.` });
    queryClient.invalidateQueries({ queryKey: ["monthly_giving"] });
    setAmount("");
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const header = lines[0].toLowerCase();

    // Expect columns: month, year, fund, amount
    const rows = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      return { month: cols[0], year: parseInt(cols[1]), fund: cols[2]?.toLowerCase(), amount: parseFloat(cols[3]) };
    }).filter(r => r.month && r.year && r.fund && !isNaN(r.amount));

    if (rows.length === 0) {
      toast({ title: "No valid rows", description: "CSV should have columns: month, year, fund, amount", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("monthly_giving").insert(rows);
    if (error) {
      toast({ title: "Import error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Imported", description: `${rows.length} giving records imported.` });
      queryClient.invalidateQueries({ queryKey: ["monthly_giving"] });
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Manual Entry */}
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Manual Entry
        </h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Input type="number" value={year} onChange={e => setYear(e.target.value)} min={2020} max={2030} />
          </div>
          <div className="space-y-1.5">
            <Label>Fund</Label>
            <Select value={fund} onValueChange={setFund}>
              <SelectTrigger><SelectValue placeholder="Select fund" /></SelectTrigger>
              <SelectContent>
                {FUNDS.map(f => <SelectItem key={f} value={f}>{FUND_LABELS[f]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount ($)</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <Button type="submit" disabled={saving} className="h-10">
            {saving ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>

      {/* CSV Upload */}
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
          <Upload className="h-4 w-4" /> CSV Import
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Upload a CSV with columns: <code className="bg-muted px-1 rounded">month, year, fund, amount</code>
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border cursor-pointer hover:bg-muted transition-colors">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Choose CSV file</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
        </label>
      </div>

      {/* Planning Center Import */}
      <PcoGivingImportSection queryClient={queryClient} toast={toast} />

      <GivingEntriesTable />
    </div>
  );
};

export default GivingEntry;

/* ───── Giving Entries Table with Edit/Delete/View All ───── */

const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const GivingEntriesTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewYear, setViewYear] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editFund, setEditFund] = useState("");
  const [deleteRow, setDeleteRow] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["monthly_giving", "recent", viewYear],
    queryFn: async () => {
      let query = supabase
        .from("monthly_giving")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (viewYear) {
        query = query.eq("year", parseInt(viewYear));
      } else {
        query = query.limit(10);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Get available years for the filter
  const { data: yearsData } = useQuery({
    queryKey: ["monthly_giving", "years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_giving")
        .select("year")
        .order("year", { ascending: false });
      if (error) throw error;
      const unique = [...new Set(data.map((r: any) => r.year))];
      return unique as number[];
    },
  });

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditAmount(String(row.amount));
    setEditFund(row.fund);
  };

  const handleSaveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    const { error } = await supabase
      .from("monthly_giving")
      .update({ amount: parseFloat(editAmount), fund: editFund })
      .eq("id", editRow.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Entry updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["monthly_giving"] });
      setEditRow(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    const { error } = await supabase
      .from("monthly_giving")
      .delete()
      .eq("id", deleteRow.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Entry deleted." });
      queryClient.invalidateQueries({ queryKey: ["monthly_giving"] });
    }
    setDeleteRow(null);
  };

  return (
    <>
      <div className="bg-card rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" /> {viewYear ? `Giving Entries — ${viewYear}` : "Recent Giving Entries"}
          </h3>
          {viewYear && (
            <Button variant="ghost" size="sm" onClick={() => setViewYear(null)}>
              Back to Recent
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Fund</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{FUND_LABELS[row.fund] || row.fund}</TableCell>
                    <TableCell>${Number(row.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.source === "planning_center"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {row.source === "planning_center" ? "PCO Import" : "Manual"}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(row)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteRow(row)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* View All by Year buttons */}
        {!viewYear && yearsData && yearsData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">View all entries by year:</p>
            <div className="flex gap-2 flex-wrap">
              {yearsData.map((y) => (
                <Button key={y} variant="outline" size="sm" onClick={() => setViewYear(String(y))}>
                  {y}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Giving Entry</DialogTitle>
          </DialogHeader>
          {editRow && (
            <div className="grid gap-4 py-2">
              <p className="text-sm text-muted-foreground">
                {editRow.month} {editRow.year}
              </p>
              <div className="space-y-1.5">
                <Label>Fund</Label>
                <Select value={editFund} onValueChange={setEditFund}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FUNDS.map(f => <SelectItem key={f} value={f}>{FUND_LABELS[f]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow && `Delete ${FUND_LABELS[deleteRow.fund] || deleteRow.fund} entry for ${deleteRow.month} ${deleteRow.year} ($${Number(deleteRow.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })})?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
