import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend,
} from "recharts";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

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

interface PayoutRow {
  id: string;
  payout_date: string;
  amount: number;
  description: string | null;
  payee: string | null;
}

const BuildingCampaignTracker = () => {
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

  const { data: pledgeData, isLoading: pledgeLoading } = useQuery({
    queryKey: ["pco_pledges"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-pco-pledges");
      if (error) throw error;
      return data?.campaigns?.[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["building_campaign_payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("building_campaign_payouts")
        .select("*")
        .order("payout_date", { ascending: false });
      if (error) throw error;
      return data as PayoutRow[];
    },
  });

  const totalPaidOut = payouts.reduce((s, p) => s + Number(p.amount), 0);

  const { chartData, cumulativeGiving, totalFundsAvailable, latestRow } = useMemo(() => {
    let cumulative = 0;
    const chartData = rows.map((r) => {
      cumulative += Number(r.monthly_giving_deposits);
      const accountFunds = (Number(r.money_market) || 0) + (Number(r.cd_0668) || 0) + (Number(r.cd_1941) || 0) + (Number(r.cd_2029) || 0);
      return {
        label: `${r.month.slice(0, 3)} ${r.year}`,
        cumulativeGiving: cumulative,
        accountFunds,
      };
    });
    const last = rows[rows.length - 1];
    const totalFundsAvailable = last
      ? (Number(last.money_market) || 0) + (Number(last.cd_0668) || 0) + (Number(last.cd_1941) || 0) + (Number(last.cd_2029) || 0)
      : 0;
    return { chartData, cumulativeGiving: cumulative, totalFundsAvailable, latestRow: last };
  }, [rows]);

  const gap = CAMPAIGN_GOAL - totalFundsAvailable;


  return (
    <div className="mt-8 pb-8">
      <h2 className="text-xl font-bold text-foreground mb-4 font-heading">Building Expansion Campaign</h2>
      <div className="flex flex-col gap-6">
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
                    <Area type="monotone" dataKey="accountFunds" name="Account Funds (MM + CDs)" stroke="hsl(140 50% 38%)" fill="url(#gradTotalFunds)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cumulativeGiving" name="Cumulative Pledged Giving" stroke="hsl(205 79% 20%)" fill="url(#gradCumGiving)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Funds Available + Campaign Details side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funds Available */}
            <div className="rounded-2xl border border-border bg-card/40 p-4 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Funds Available</p>
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-accent/10 border-accent/30 col-span-2 ring-2 ring-[hsl(205_79%_40%)]/60 ring-offset-1">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="h-2 w-2 rounded-full bg-[hsl(205_79%_40%)]" aria-hidden />
                      <p className="text-xs text-muted-foreground">Total Funds Available</p>
                    </div>
                    <p className="text-lg font-bold text-accent-foreground">{fmt(totalFundsAvailable)}</p>
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
              </div>
            </div>

            {/* Campaign Details */}
            <div className="rounded-2xl border border-border bg-card/40 p-4 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Campaign Details</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Left: Starting Balance + Non-Pledge Giving */}
                <div className="flex flex-col gap-3 h-full">
                  <Card className="bg-muted/30 border-muted-foreground/20 flex-1">
                    <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground mb-1">Starting Balance Before Campaign</p>
                      <p className="text-lg font-bold text-foreground">{fmt(408510.58)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-accent/10 border-accent/30 flex-1">
                    <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground mb-1">One Time Non-Pledge Gifts</p>
                      {pledgeLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mt-1" />
                      ) : (
                        <p className="text-lg font-bold text-accent-foreground">
                          {pledgeData ? fmt((pledgeData.received_outside_pledges_cents || 0) / 100) : "—"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Total Campaign Giving bracket */}
                <div className="flex flex-col gap-2 h-full">
                  <div className="text-center rounded-t-lg border border-primary/20 bg-primary/5 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Total Campaign Giving
                    </p>
                    {pledgeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mt-1" />
                    ) : (
                      <p className="text-base font-bold text-primary">
                        {pledgeData ? fmt(((pledgeData.received_from_pledges_cents || 0) + (pledgeData.not_yet_received_cents || 0)) / 100) : fmt(cumulativeGiving)}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-x border-b border-primary/20 rounded-b-lg p-2 bg-primary/[0.02] flex-1">
                    <Card className="bg-accent/10 border-accent/30 shadow-none">
                      <CardContent className="p-3 text-center flex flex-col items-center justify-center h-full">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Pledges Received
                        </p>
                        {pledgeLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mt-1" />
                        ) : (
                          <p className="text-sm font-bold text-accent-foreground">
                            {pledgeData ? fmt((pledgeData.received_from_pledges_cents || 0) / 100) : "—"}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="bg-destructive/5 border-destructive/20 shadow-none ring-2 ring-[hsl(205_79%_40%)]/60 ring-offset-1">
                      <CardContent className="p-3 text-center flex flex-col items-center justify-center h-full">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <span className="h-2 w-2 rounded-full bg-[hsl(205_79%_40%)]" aria-hidden />
                          <p className="text-[10px] text-muted-foreground">Pledges Not Yet Received</p>
                        </div>
                        {pledgeLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mt-1" />
                        ) : (
                          <p className="text-sm font-bold text-destructive">
                            {pledgeData ? fmt(Math.max(0, (pledgeData.not_yet_received_cents || 0) / 100)) : "—"}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Builder Payouts (moved up — sits with Campaign Details) */}
          <Card className="mt-2">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Builder Payouts</CardTitle>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">Total Paid Out</p>
                <p className="text-base font-bold text-primary">{fmt(totalPaidOut)}</p>
              </div>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payouts recorded yet.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Payee</th>
                        <th className="px-3 py-2 font-medium">Description</th>
                        <th className="px-3 py-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-3 py-2">
                            {new Date(p.payout_date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </td>
                          <td className="px-3 py-2">{p.payee || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{p.description || "—"}</td>
                          <td className="px-3 py-2 text-right font-semibold">{fmt(Number(p.amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Full-width Campaign Gap Summary */}
          {(() => {
            const pledgesNotYet = pledgeData ? Math.max(0, (pledgeData.not_yet_received_cents || 0) / 100) : 0;
            const remaining = Math.max(0, CAMPAIGN_GOAL - totalFundsAvailable - pledgesNotYet - totalPaidOut);
            const progressPct = Math.min(100, ((totalFundsAvailable + pledgesNotYet + totalPaidOut) / CAMPAIGN_GOAL) * 100);

            return (
              <Card className="mt-4 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campaign Progress</p>
                    <p className="text-xs text-muted-foreground">Goal: {fmt(CAMPAIGN_GOAL)}</p>
                  </div>
                  <Progress value={progressPct} className="h-3 mb-3" />
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center items-stretch">
                    {/* What we have */}
                    <div className="rounded-md p-3 bg-background/40 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Total Funds Available</p>
                      <p className="text-lg font-bold text-primary">{fmt(totalFundsAvailable)}</p>
                    </div>
                    <div className="rounded-md p-3 bg-background/40 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Total Paid Out</p>
                      <p className="text-lg font-bold text-foreground">{fmt(totalPaidOut)}</p>
                    </div>
                    <div className="rounded-md p-3 bg-background/40 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Project Cost</p>
                      <p className="text-lg font-bold text-foreground">{fmt(CAMPAIGN_GOAL)}</p>
                    </div>
                    {/* Divider */}
                    <div className="hidden md:block md:col-span-2">
                      <div className="rounded-md p-3 bg-destructive/5 border border-destructive/20 h-full">
                        <p className="text-[10px] text-destructive/80 uppercase tracking-wide mb-2 font-semibold">Still Outstanding</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Pledges Not Yet Received</p>
                            <p className="text-lg font-bold text-destructive">{fmt(pledgesNotYet)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Remaining Gap to Fundraise</p>
                            <p className="text-lg font-bold text-destructive">{fmt(remaining)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Mobile fallback for outstanding cards */}
                    <div className="md:hidden rounded-md p-3 bg-destructive/5 border border-destructive/20">
                      <p className="text-[10px] text-muted-foreground uppercase">Pledges Not Yet Received</p>
                      <p className="text-lg font-bold text-destructive">{fmt(pledgesNotYet)}</p>
                    </div>
                    <div className="md:hidden rounded-md p-3 bg-destructive/5 border border-destructive/20">
                      <p className="text-[10px] text-muted-foreground uppercase">Remaining Gap to Fundraise</p>
                      <p className="text-lg font-bold text-destructive">{fmt(remaining)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

        </div>
      </div>
    </div>
  );
};

export default BuildingCampaignTracker;
