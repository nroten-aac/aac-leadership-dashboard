import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ACCOUNTS = ["money_market", "cd_0668", "cd_2029", "cd_1941"];
const ACCOUNT_LABELS: Record<string, string> = {
  money_market: "Money Market Account",
  cd_0668: "CD-0668",
  cd_2029: "CD-2029",
  cd_1941: "CD-1941",
};

const fmt = (v: number | null | undefined) =>
  v != null ? `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

const BuildingEntry = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // Building Expansion state
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState(new Date().getFullYear().toString());
  const [expGiving, setExpGiving] = useState("");
  const [expCd0668, setExpCd0668] = useState("");
  const [expCd1941, setExpCd1941] = useState("");
  const [expMM, setExpMM] = useState("");
  const [expCd2029, setExpCd2029] = useState("");
  const [expSaving, setExpSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  // Builder Payouts state
  const [poDate, setPoDate] = useState("");
  const [poAmount, setPoAmount] = useState("");
  const [poPayee, setPoPayee] = useState("");
  const [poDescription, setPoDescription] = useState("");
  const [poSaving, setPoSaving] = useState(false);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [editPoValues, setEditPoValues] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month || !year || !account || !amount) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("building_fund_accounts" as any).insert({
      month,
      year: parseInt(year),
      account_name: account,
      amount: parseFloat(amount),
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: `${ACCOUNT_LABELS[account]} entry for ${month} ${year} saved.` });
    queryClient.invalidateQueries({ queryKey: ["building_fund_accounts"] });
    setAmount("");
  };

  // Building Expansion submit
  const handleExpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expMonth || !expYear || !expGiving) {
      toast({ title: "Missing fields", description: "Month, year, and giving deposits are required.", variant: "destructive" });
      return;
    }
    setExpSaving(true);
    const { error } = await supabase.from("building_campaign").insert({
      month: expMonth,
      year: parseInt(expYear),
      monthly_giving_deposits: parseFloat(expGiving) || 0,
      cd_0668: expCd0668 ? parseFloat(expCd0668) : null,
      cd_1941: expCd1941 ? parseFloat(expCd1941) : null,
      money_market: expMM ? parseFloat(expMM) : null,
      cd_2029: expCd2029 ? parseFloat(expCd2029) : null,
    });
    setExpSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: `Building expansion entry for ${expMonth} ${expYear} saved.` });
    queryClient.invalidateQueries({ queryKey: ["building_campaign"] });
    setExpGiving(""); setExpCd0668(""); setExpCd1941(""); setExpMM(""); setExpCd2029("");
  };

  const { data: expRows = [] } = useQuery({
    queryKey: ["building_campaign", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("building_campaign").select("*").order("year", { ascending: false }).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data || []).sort((a: any, b: any) => {
        if (a.year !== b.year) return b.year - a.year;
        return MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
      });
    },
  });

  const handleExpUpdate = async (id: string) => {
    const { error } = await supabase.from("building_campaign").update(editValues).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["building_campaign"] });
    setEditingId(null);
    toast({ title: "Updated" });
  };

  const handleExpDelete = async (id: string) => {
    const { error } = await supabase.from("building_campaign").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["building_campaign"] });
    toast({ title: "Deleted" });
  };

  return (
    <div className="space-y-6">
      {/* Existing Building Fund Accounts */}
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Building Fund Accounts
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
            <Label>Account</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {ACCOUNTS.map(a => <SelectItem key={a} value={a}>{ACCOUNT_LABELS[a]}</SelectItem>)}
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

      <BuildingFundRecent />

      {/* Builder Payouts */}
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Builder Payouts
        </h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!poDate || !poAmount) {
              toast({ title: "Missing fields", description: "Date and amount are required.", variant: "destructive" });
              return;
            }
            setPoSaving(true);
            const { error } = await supabase.from("building_campaign_payouts").insert({
              payout_date: poDate,
              amount: parseFloat(poAmount),
              payee: poPayee || null,
              description: poDescription || null,
            });
            setPoSaving(false);
            if (error) {
              toast({ title: "Error", description: error.message, variant: "destructive" });
              return;
            }
            toast({ title: "Saved", description: `Payout of $${poAmount} saved.` });
            queryClient.invalidateQueries({ queryKey: ["building_campaign_payouts"] });
            setPoDate(""); setPoAmount(""); setPoPayee(""); setPoDescription("");
          }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end"
        >
          <div className="space-y-1.5">
            <Label>Payout Date</Label>
            <Input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Amount ($)</Label>
            <Input type="number" step="0.01" value={poAmount} onChange={(e) => setPoAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label>Payee</Label>
            <Input value={poPayee} onChange={(e) => setPoPayee(e.target.value)} placeholder="Builder name (optional)" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={poDescription} onChange={(e) => setPoDescription(e.target.value)} placeholder="Optional" />
          </div>
          <Button type="submit" disabled={poSaving} className="h-10">
            {poSaving ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>

      <BuilderPayoutsRecent
        editingPoId={editingPoId}
        setEditingPoId={setEditingPoId}
        editPoValues={editPoValues}
        setEditPoValues={setEditPoValues}
      />

      {/* Building Expansion Campaign */}
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Building Expansion Campaign
        </h3>
        <form onSubmit={handleExpSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Select value={expMonth} onValueChange={setExpMonth}>
              <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Input type="number" value={expYear} onChange={e => setExpYear(e.target.value)} min={2020} max={2030} />
          </div>
          <div className="space-y-1.5">
            <Label>Monthly Giving Deposits ($)</Label>
            <Input type="number" step="0.01" value={expGiving} onChange={e => setExpGiving(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label>CD-0668 ($)</Label>
            <Input type="number" step="0.01" value={expCd0668} onChange={e => setExpCd0668(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>CD-1941 ($)</Label>
            <Input type="number" step="0.01" value={expCd1941} onChange={e => setExpCd1941(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Money Market ($)</Label>
            <Input type="number" step="0.01" value={expMM} onChange={e => setExpMM(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>CD-2029 ($)</Label>
            <Input type="number" step="0.01" value={expCd2029} onChange={e => setExpCd2029(e.target.value)} placeholder="Optional" />
          </div>
          <Button type="submit" disabled={expSaving} className="h-10">
            {expSaving ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>

      {/* Recent Building Expansion Entries */}
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Recent Building Expansion Entries</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Month</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Giving</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">CD-0668</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">CD-1941</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Money Mkt</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">CD-2029</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {expRows.map((row: any) => (
                <tr key={row.id} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{row.month} {row.year}</td>
                  {editingId === row.id ? (
                    <>
                      <td className="px-1 py-1"><Input className="h-8 text-sm text-right" type="number" step="0.01" value={editValues.monthly_giving_deposits ?? ""} onChange={e => setEditValues({ ...editValues, monthly_giving_deposits: Number(e.target.value) })} /></td>
                      <td className="px-1 py-1"><Input className="h-8 text-sm text-right" type="number" step="0.01" value={editValues.cd_0668 ?? ""} onChange={e => setEditValues({ ...editValues, cd_0668: e.target.value ? Number(e.target.value) : null })} /></td>
                      <td className="px-1 py-1"><Input className="h-8 text-sm text-right" type="number" step="0.01" value={editValues.cd_1941 ?? ""} onChange={e => setEditValues({ ...editValues, cd_1941: e.target.value ? Number(e.target.value) : null })} /></td>
                      <td className="px-1 py-1"><Input className="h-8 text-sm text-right" type="number" step="0.01" value={editValues.money_market ?? ""} onChange={e => setEditValues({ ...editValues, money_market: e.target.value ? Number(e.target.value) : null })} /></td>
                      <td className="px-1 py-1"><Input className="h-8 text-sm text-right" type="number" step="0.01" value={editValues.cd_2029 ?? ""} onChange={e => setEditValues({ ...editValues, cd_2029: e.target.value ? Number(e.target.value) : null })} /></td>
                      <td className="px-1 py-1 flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleExpUpdate(row.id)}><Check className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-right">{fmt(row.monthly_giving_deposits)}</td>
                      <td className="px-3 py-2 text-right">{fmt(row.cd_0668)}</td>
                      <td className="px-3 py-2 text-right">{fmt(row.cd_1941)}</td>
                      <td className="px-3 py-2 text-right">{fmt(row.money_market)}</td>
                      <td className="px-3 py-2 text-right">{fmt(row.cd_2029)}</td>
                      <td className="px-1 py-1 flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(row.id); setEditValues({ monthly_giving_deposits: row.monthly_giving_deposits, cd_0668: row.cd_0668, cd_1941: row.cd_1941, money_market: row.money_market, cd_2029: row.cd_2029 }); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                              <AlertDialogDescription>Remove {row.month} {row.year} from building expansion?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleExpDelete(row.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BuildingEntry;

const BuilderPayoutsRecent = ({
  editingPoId,
  setEditingPoId,
  editPoValues,
  setEditPoValues,
}: {
  editingPoId: string | null;
  setEditingPoId: (id: string | null) => void;
  editPoValues: any;
  setEditPoValues: (v: any) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: ["building_campaign_payouts", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("building_campaign_payouts")
        .select("*")
        .order("payout_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const handleUpdate = async (id: string) => {
    const { error } = await supabase.from("building_campaign_payouts").update(editPoValues).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["building_campaign_payouts"] });
    setEditingPoId(null);
    toast({ title: "Updated" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("building_campaign_payouts").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["building_campaign_payouts"] });
    toast({ title: "Deleted" });
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <h3 className="font-display font-semibold text-foreground mb-4">Recent Builder Payouts</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payouts yet.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Payee</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {(rows as any[]).map((row) => (
                <tr key={row.id} className="border-b border-border/30 hover:bg-muted/30">
                  {editingPoId === row.id ? (
                    <>
                      <td className="px-1 py-1"><Input className="h-8 text-sm" type="date" value={editPoValues.payout_date ?? ""} onChange={(e) => setEditPoValues({ ...editPoValues, payout_date: e.target.value })} /></td>
                      <td className="px-1 py-1"><Input className="h-8 text-sm text-right" type="number" step="0.01" value={editPoValues.amount ?? ""} onChange={(e) => setEditPoValues({ ...editPoValues, amount: Number(e.target.value) })} /></td>
                      <td className="px-1 py-1"><Input className="h-8 text-sm" value={editPoValues.payee ?? ""} onChange={(e) => setEditPoValues({ ...editPoValues, payee: e.target.value })} /></td>
                      <td className="px-1 py-1"><Input className="h-8 text-sm" value={editPoValues.description ?? ""} onChange={(e) => setEditPoValues({ ...editPoValues, description: e.target.value })} /></td>
                      <td className="px-1 py-1 flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUpdate(row.id)}><Check className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingPoId(null)}><X className="h-3.5 w-3.5" /></Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-medium">{row.payout_date}</td>
                      <td className="px-3 py-2 text-right">{fmt(row.amount)}</td>
                      <td className="px-3 py-2">{row.payee || "—"}</td>
                      <td className="px-3 py-2">{row.description || "—"}</td>
                      <td className="px-1 py-1 flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingPoId(row.id); setEditPoValues({ payout_date: row.payout_date, amount: row.amount, payee: row.payee, description: row.description }); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete payout?</AlertDialogTitle>
                              <AlertDialogDescription>Remove the {row.payout_date} payout of {fmt(row.amount)}?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(row.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const BuildingFundRecent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [yearFilter, setYearFilter] = useState<string>("recent");

  const { data: rows = [] } = useQuery({
    queryKey: ["building_fund_accounts", "recent-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("building_fund_accounts" as any)
        .select("*")
        .order("year", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []).sort((a: any, b: any) => {
        if (a.year !== b.year) return b.year - a.year;
        return MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
      });
    },
  });

  const years = Array.from(new Set((rows as any[]).map((r) => r.year))).sort((a: any, b: any) => b - a);
  const filtered = yearFilter === "recent"
    ? (rows as any[]).slice(0, 10)
    : (rows as any[]).filter((r) => String(r.year) === yearFilter);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("building_fund_accounts" as any).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["building_fund_accounts"] });
    toast({ title: "Deleted" });
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Recent Building Fund Entries</h3>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent (10)</SelectItem>
            {years.map((y: any) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Month</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Year</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Account</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Added</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row: any) => (
                <tr key={row.id} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="px-3 py-2">{row.month}</td>
                  <td className="px-3 py-2">{row.year}</td>
                  <td className="px-3 py-2">{ACCOUNT_LABELS[row.account_name] || row.account_name}</td>
                  <td className="px-3 py-2 text-right">{fmt(row.amount)}</td>
                  <td className="px-3 py-2">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="px-1 py-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove {ACCOUNT_LABELS[row.account_name] || row.account_name} entry of {fmt(row.amount)} for {row.month} {row.year}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(row.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
