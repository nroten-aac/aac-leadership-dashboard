import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, Cloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import RecentEntries from "./RecentEntries";

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

      <RecentEntries
        table="monthly_giving"
        title="Recent Giving Entries"
        orderBy={[
          { column: "year", ascending: false },
          { column: "month", ascending: false },
          { column: "created_at", ascending: false },
        ]}
        columns={[
          { key: "month", label: "Month" },
          { key: "year", label: "Year" },
          { key: "fund", label: "Fund", render: (v) => FUND_LABELS[v] || v },
          { key: "amount", label: "Amount", render: (v) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          { key: "source", label: "Source", render: (v) => (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              v === "planning_center" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-muted text-muted-foreground"
            }`}>
              {v === "planning_center" ? "PCO Import" : "Manual"}
            </span>
          )},
          { key: "created_at", label: "Added", render: (v) => new Date(v).toLocaleDateString() },
        ]}
      />
    </div>
  );
};

export default GivingEntry;
