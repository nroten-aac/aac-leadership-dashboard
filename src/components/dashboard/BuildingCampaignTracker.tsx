import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend,
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAMPAIGN_GOAL = 925000;

interface CampaignRow {
  id: string;
  month: string;
  year: number;
  monthly_giving_deposits: number;
  cd_0668: number | null;
  cd_1941: number | null;
  money_market: number | null;
  cd_2029: number | null;
}

const fmt = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

const fmtShort = (v: number) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const BuildingCampaignTracker = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CampaignRow>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [newRow, setNewRow] = useState({ month: "January", year: new Date().getFullYear(), monthly_giving_deposits: 0, cd_0668: "", cd_1941: "", money_market: "", cd_2029: "" });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["building_campaign"],
    queryFn: async () => {
      const { data, error } = await supabase.from("building_campaign").select("*").order("year").order("month");
      if (error) throw error;
      return (data as CampaignRow[]).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month);
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<CampaignRow> & { id: string }) => {
      const { error } = await supabase.from("building_campaign").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["building_campaign"] }); toast.success("Updated"); setEditingId(null); },
  });

  const addMutation = useMutation({
    mutationFn: async (row: any) => {
      const { error } = await supabase.from("building_campaign").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["building_campaign"] }); toast.success("Added"); setAddOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("building_campaign").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["building_campaign"] }); toast.success("Deleted"); },
  });

  // Compute cumulative giving + chart data
  const { chartData, cumulativeGiving, totalFundsAvailable, latestRow } = useMemo(() => {
    let cumulative = 0;
    const chartData = rows.map((r) => {
      cumulative += Number(r.monthly_giving_deposits);
      return {
        label: `${r.month.slice(0, 3)} ${r.year}`,
        cumulativeGiving: cumulative,
        totalFunds: cumulative + (Number(r.money_market) || 0) + (Number(r.cd_0668) || 0) + (Number(r.cd_1941) || 0) + (Number(r.cd_2029) || 0),
      };
    });
    const last = rows[rows.length - 1];
    const totalFundsAvailable = last
      ? cumulative + (Number(last.money_market) || 0) + (Number(last.cd_0668) || 0) + (Number(last.cd_1941) || 0) + (Number(last.cd_2029) || 0)
      : 0;
    return { chartData, cumulativeGiving: cumulative, totalFundsAvailable, latestRow: last };
  }, [rows]);

  const gap = CAMPAIGN_GOAL - totalFundsAvailable;

  const startEdit = (row: CampaignRow) => {
    setEditingId(row.id);
    setEditValues({ monthly_giving_deposits: row.monthly_giving_deposits, cd_0668: row.cd_0668, cd_1941: row.cd_1941, money_market: row.money_market, cd_2029: row.cd_2029 });
  };

  const handleAdd = () => {
    addMutation.mutate({
      month: newRow.month,
      year: newRow.year,
      monthly_giving_deposits: Number(newRow.monthly_giving_deposits) || 0,
      cd_0668: newRow.cd_0668 ? Number(newRow.cd_0668) : null,
      cd_1941: newRow.cd_1941 ? Number(newRow.cd_1941) : null,
      money_market: newRow.money_market ? Number(newRow.money_market) : null,
      cd_2029: newRow.cd_2029 ? Number(newRow.cd_2029) : null,
    });
  };

  // Compute cumulative for each row
  const rowsWithCumulative = useMemo(() => {
    let cum = 0;
    return rows.map((r) => {
      cum += Number(r.monthly_giving_deposits);
      return { ...r, cumulative: cum };
    });
  }, [rows]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-4 font-heading">Building Expansion Campaign</h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT: Grid */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Giving Tracker</CardTitle>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1"><Plus className="h-4 w-4" /> Add Month</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Month</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Month</label>
                    <Select value={newRow.month} onValueChange={(v) => setNewRow({ ...newRow, month: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTH_ORDER.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Year</label>
                    <Input type="number" value={newRow.year} onChange={(e) => setNewRow({ ...newRow, year: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Monthly Giving Deposits</label>
                    <Input type="number" step="0.01" value={newRow.monthly_giving_deposits} onChange={(e) => setNewRow({ ...newRow, monthly_giving_deposits: Number(e.target.value) })} />
                  </div>
                  {[
                    { key: "cd_0668", label: "CD-0668" },
                    { key: "cd_1941", label: "CD-1941" },
                    { key: "money_market", label: "Money Market" },
                    { key: "cd_2029", label: "CD-2029" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground">{label}</label>
                      <Input type="number" step="0.01" placeholder="—" value={(newRow as any)[key]} onChange={(e) => setNewRow({ ...newRow, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <DialogFooter><Button onClick={handleAdd} disabled={addMutation.isPending}>Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-2 py-2 font-medium text-muted-foreground">Month</th>
                    <th className="text-right px-2 py-2 font-medium text-muted-foreground">Giving</th>
                    <th className="text-right px-2 py-2 font-medium text-muted-foreground">Cumulative</th>
                    <th className="text-right px-2 py-2 font-medium text-muted-foreground">CD-0668</th>
                    <th className="text-right px-2 py-2 font-medium text-muted-foreground">CD-1941</th>
                    <th className="text-right px-2 py-2 font-medium text-muted-foreground">Money Mkt</th>
                    <th className="text-right px-2 py-2 font-medium text-muted-foreground">CD-2029</th>
                    <th className="px-2 py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...rowsWithCumulative].reverse().map((row) => (
                    <tr key={row.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="px-2 py-1.5 font-medium whitespace-nowrap">{row.month.slice(0, 3)} {row.year}</td>
                      {editingId === row.id ? (
                        <>
                          <td className="px-1 py-1"><Input className="h-7 text-xs text-right" type="number" step="0.01" value={editValues.monthly_giving_deposits ?? ""} onChange={(e) => setEditValues({ ...editValues, monthly_giving_deposits: Number(e.target.value) })} /></td>
                          <td className="px-2 py-1.5 text-right text-muted-foreground">{fmt(row.cumulative)}</td>
                          <td className="px-1 py-1"><Input className="h-7 text-xs text-right" type="number" step="0.01" value={editValues.cd_0668 ?? ""} onChange={(e) => setEditValues({ ...editValues, cd_0668: e.target.value ? Number(e.target.value) : null })} /></td>
                          <td className="px-1 py-1"><Input className="h-7 text-xs text-right" type="number" step="0.01" value={editValues.cd_1941 ?? ""} onChange={(e) => setEditValues({ ...editValues, cd_1941: e.target.value ? Number(e.target.value) : null })} /></td>
                          <td className="px-1 py-1"><Input className="h-7 text-xs text-right" type="number" step="0.01" value={editValues.money_market ?? ""} onChange={(e) => setEditValues({ ...editValues, money_market: e.target.value ? Number(e.target.value) : null })} /></td>
                          <td className="px-1 py-1"><Input className="h-7 text-xs text-right" type="number" step="0.01" value={editValues.cd_2029 ?? ""} onChange={(e) => setEditValues({ ...editValues, cd_2029: e.target.value ? Number(e.target.value) : null })} /></td>
                          <td className="px-1 py-1 flex gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateMutation.mutate({ id: row.id, ...editValues })}><Check className="h-3 w-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-1.5 text-right">{fmt(row.monthly_giving_deposits)}</td>
                          <td className="px-2 py-1.5 text-right font-semibold text-primary">{fmt(row.cumulative)}</td>
                          <td className="px-2 py-1.5 text-right">{fmt(row.cd_0668)}</td>
                          <td className="px-2 py-1.5 text-right">{fmt(row.cd_1941)}</td>
                          <td className="px-2 py-1.5 text-right">{fmt(row.money_market)}</td>
                          <td className="px-2 py-1.5 text-right">{fmt(row.cd_2029)}</td>
                          <td className="px-1 py-1 flex gap-0.5">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(row)}><Pencil className="h-3 w-3" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                                  <AlertDialogDescription>Remove {row.month} {row.year} from the campaign tracker?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(row.id)}>Delete</AlertDialogAction>
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
          </CardContent>
        </Card>

        {/* RIGHT: Chart + Summary */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Campaign Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCumGiving" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(205 79% 20%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(205 79% 20%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradTotalFunds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(140 50% 38%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(140 50% 38%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 80%)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val: number) => fmt(val)} />
                    <Legend />
                    <ReferenceLine y={CAMPAIGN_GOAL} stroke="hsl(0 70% 50%)" strokeDasharray="6 3" label={{ value: `Goal: ${fmtShort(CAMPAIGN_GOAL)}`, position: "right", fontSize: 11, fill: "hsl(0 70% 50%)" }} />
                    <Area type="monotone" dataKey="totalFunds" name="Total Funds Available" stroke="hsl(140 50% 38%)" fill="url(#gradTotalFunds)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cumulativeGiving" name="Cumulative Giving" stroke="hsl(205 79% 20%)" fill="url(#gradCumGiving)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Pledged Giving Received</p>
                <p className="text-lg font-bold text-primary">{fmt(cumulativeGiving)}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Funds Available</p>
                <p className="text-lg font-bold text-green-700">{fmt(totalFundsAvailable)}</p>
              </CardContent>
            </Card>
            {latestRow && (
              <>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Money Market</p>
                    <p className="text-sm font-semibold">{fmt(latestRow.money_market)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">CD-0668</p>
                    <p className="text-sm font-semibold">{fmt(latestRow.cd_0668)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">CD-1941</p>
                    <p className="text-sm font-semibold">{fmt(latestRow.cd_1941)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">CD-2029</p>
                    <p className="text-sm font-semibold">{fmt(latestRow.cd_2029)}</p>
                  </CardContent>
                </Card>
              </>
            )}
            <Card className={`col-span-2 ${gap > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Gap to {fmtShort(CAMPAIGN_GOAL)} Goal</p>
                <p className={`text-lg font-bold ${gap > 0 ? "text-amber-700" : "text-green-700"}`}>
                  {gap > 0 ? fmt(gap) : "Goal Reached! 🎉"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingCampaignTracker;
