import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import RecentEntries from "./RecentEntries";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ACCOUNTS = ["money_market", "cd_0668", "cd_2029", "cd_1941"];
const ACCOUNT_LABELS: Record<string, string> = {
  money_market: "Money Market Account",
  cd_0668: "CD-0668",
  cd_2029: "CD-2029",
  cd_1941: "CD-1941",
};

const BuildingEntry = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-6">
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

      <RecentEntries
        table={"building_fund_accounts" as any}
        title="Recent Building Fund Entries"
        orderBy={[
          { column: "year", ascending: false },
          { column: "month", ascending: false },
          { column: "created_at", ascending: false },
        ]}
        columns={[
          { key: "month", label: "Month" },
          { key: "year", label: "Year" },
          { key: "account_name", label: "Account", render: (v) => ACCOUNT_LABELS[v] || v },
          { key: "amount", label: "Amount", render: (v) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          { key: "created_at", label: "Added", render: (v) => new Date(v).toLocaleDateString() },
        ]}
      />
    </div>
  );
};

export default BuildingEntry;
