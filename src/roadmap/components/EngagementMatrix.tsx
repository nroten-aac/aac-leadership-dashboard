import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMembers, dbStageToRoadmap } from "../hooks/useRoadmapData";
import { STAGE_NAMES, STAGE_ORDER, type Stage } from "../types";

const ENG_COLS: Array<{ key: string; label: string; match: (g: string) => boolean }> = [
  { key: "LG", label: "Life Groups",          match: (g) => g === "Life Groups" },
  { key: "BS", label: "Bible Studies",        match: (g) => g.toLowerCase().includes("bible") },
  { key: "PT", label: "PT Mentorship",        match: (g) => g === "PT Mentorship" },
  { key: "DG", label: "Discipleship Groups",  match: (g) => g === "Discipleship Groups" },
  { key: "SRV", label: "Serving",             match: () => false }, // handled by group_type
];

function useMemberGroups() {
  return useQuery({
    queryKey: ["roadmap", "member-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("member_groups").select("member_id, group_name, group_type");
      return data || [];
    },
  });
}

export default function EngagementMatrix() {
  const { data: members = [] } = useMembers();
  const { data: groups = [] } = useMemberGroups();

  // Build stage x engagement matrix
  const stageOf = new Map<string, Stage>();
  members.forEach((m: any) => stageOf.set(m.id, dbStageToRoadmap(m.discipleship_stage)));

  const counts: Record<Stage, Record<string, Set<string>>> = {} as any;
  STAGE_ORDER.forEach((s) => {
    counts[s] = {};
    ENG_COLS.forEach((c) => (counts[s][c.key] = new Set()));
  });

  groups.forEach((g: any) => {
    const stage = stageOf.get(g.member_id);
    if (!stage) return;
    if (g.group_type === "volunteer") {
      counts[stage]["SRV"].add(g.member_id);
      return;
    }
    for (const col of ENG_COLS) {
      if (col.match(g.group_name)) counts[stage][col.key].add(g.member_id);
    }
  });

  const stageTotals: Record<Stage, number> = { connect: 0, belong: 0, mature: 0, minister: 0, multiply: 0 };
  members.forEach((m: any) => stageTotals[dbStageToRoadmap(m.discipleship_stage)]++);
  const total = members.length;

  // Find max cell for highlight
  let maxCell = 0;
  STAGE_ORDER.forEach((s) => ENG_COLS.forEach((c) => { maxCell = Math.max(maxCell, counts[s][c.key].size); }));

  const stageBarColor = (s: Stage) => `hsl(var(--stage-${s}))`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Engagement Matrix */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <div className="eyebrow mb-2">— Engagement</div>
        <h3 className="font-display text-xl font-semibold text-foreground">Maturing &amp; Ministering — Stage × Engagement</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Where on the journey people are forming and serving — synced from PCO.</p>

        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-normal pb-3"></th>
                {ENG_COLS.map((c) => (
                  <th key={c.key} className="font-normal tracking-widest pb-3 px-2 text-center">{c.key}</th>
                ))}
                <th className="font-normal tracking-widest pb-3 px-2 text-center bg-background/40 rounded">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {STAGE_ORDER.map((s, idx) => {
                const rowTotal = ENG_COLS.reduce((acc, c) => acc + counts[s][c.key].size, 0);
                return (
                  <tr key={s}>
                    <td className="py-2 pr-3 tracking-widest" style={{ color: stageBarColor(s) }}>
                      {idx + 1}. {STAGE_NAMES[s].toUpperCase()}
                    </td>
                    {ENG_COLS.map((c) => {
                      const v = counts[s][c.key].size;
                      const isMax = v > 0 && v === maxCell;
                      return (
                        <td key={c.key} className="px-1 py-1">
                          <div className={`h-10 rounded-md flex items-center justify-center text-foreground ${isMax ? "bg-accent/20 ring-1 ring-accent/50" : "bg-background/40 border border-border/40"}`}>
                            {v || <span className="text-muted-foreground/40">·</span>}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-1 py-1">
                      <div className="h-10 rounded-md flex items-center justify-center font-semibold bg-background/60 border border-border/60">
                        {rowTotal}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t border-dashed border-border/40 font-mono text-[11px] text-muted-foreground space-y-1">
          <div><span className="text-accent font-semibold">LG</span> = Life Groups &nbsp;&nbsp; <span className="text-accent font-semibold">BS</span> = Bible Studies &nbsp;&nbsp; <span className="text-accent font-semibold">PT</span> = PT Mentorship &nbsp;&nbsp; <span className="text-accent font-semibold">DG</span> = Discipleship Groups</div>
          <div><span className="text-accent font-semibold">SRV</span> = Serving</div>
        </div>
      </div>

      {/* Stage Distribution */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <div className="eyebrow mb-2">— Distribution</div>
        <h3 className="font-display text-xl font-semibold text-foreground">Stage Distribution</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-6">How the church family is spread across the journey.</p>

        <div className="space-y-4">
          {STAGE_ORDER.map((s, idx) => {
            const v = stageTotals[s];
            const pct = total ? (v / total) * 100 : 0;
            return (
              <div key={s} className="grid grid-cols-[140px_1fr_90px] items-center gap-3 font-mono text-xs">
                <div className="tracking-widest" style={{ color: stageBarColor(s) }}>
                  {idx + 1}. {STAGE_NAMES[s].toUpperCase()}
                </div>
                <div className="h-2 rounded-full bg-background/60 border border-border/40 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: stageBarColor(s) }} />
                </div>
                <div className="text-right text-foreground">
                  <span className="font-semibold">{v}</span> <span className="text-muted-foreground">· {pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-dashed border-border/40 font-mono text-[11px] text-muted-foreground">
          <span className="gradient-gold-text font-display text-2xl font-bold align-middle">{total}</span> people total · click any stage on the road for details
        </div>
      </div>
    </div>
  );
}