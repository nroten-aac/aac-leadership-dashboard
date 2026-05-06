import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import RecentEntries from "./RecentEntries";
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
