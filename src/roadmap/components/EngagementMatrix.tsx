import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMembers, dbStageToRoadmap } from "../hooks/useRoadmapData";
import { useTaggedMemberIds } from "../hooks/useTaggedMembers";
import { STAGE_NAMES, STAGE_ORDER, type Stage } from "../types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface Props {
  onSelectPerson?: (m: any) => void;
  onStageClick?: (stage: Stage) => void;
}

export default function EngagementMatrix({ onSelectPerson, onStageClick }: Props) {
  const { data: members = [] } = useMembers();
  const { data: groups = [] } = useMemberGroups();
  const { data: taggedIds } = useTaggedMemberIds();
  const scoped = taggedIds ? members.filter((m: any) => taggedIds.has(m.id)) : members;
  const [selectedCell, setSelectedCell] = useState<{ stage: Stage; col: string; label: string } | null>(null);

  // Build stage x engagement matrix
  const stageOf = new Map<string, Stage>();
  scoped.forEach((m: any) => stageOf.set(m.id, dbStageToRoadmap(m.discipleship_stage)));

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
  scoped.forEach((m: any) => stageTotals[dbStageToRoadmap(m.discipleship_stage)]++);
  const total = scoped.length;

  // Find max cell for highlight
  let maxCell = 0;
  STAGE_ORDER.forEach((s) => ENG_COLS.forEach((c) => { maxCell = Math.max(maxCell, counts[s][c.key].size); }));

  const stageBarColor = (s: Stage) => `hsl(var(--stage-${s}))`;

  const cellPeople = selectedCell
    ? scoped.filter((m: any) => counts[selectedCell.stage][selectedCell.col].has(m.id))
    : [];
  const cellColor = selectedCell ? stageBarColor(selectedCell.stage) : "";

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
                      const clickable = v > 0;
                      return (
                        <td key={c.key} className="px-1 py-1">
                          <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => setSelectedCell({ stage: s, col: c.key, label: c.label })}
                            className={`h-10 w-full rounded-md flex items-center justify-center text-foreground transition ${
                              clickable
                                ? "hover:brightness-110 cursor-pointer"
                                : "cursor-default"
                            } ${isMax ? "bg-accent/20 ring-1 ring-accent/50" : "bg-background/40 border border-border/40"}`}
                            style={clickable ? { borderColor: `${stageBarColor(s)}66` } : {}}
                          >
                            {v || <span className="text-muted-foreground/40">·</span>}
                          </button>
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
              <button
                key={s}
                type="button"
                onClick={() => onStageClick?.(s)}
                className="grid grid-cols-[140px_1fr_90px] items-center gap-3 font-mono text-xs w-full text-left rounded-lg hover:bg-background/40 transition p-2 -m-2"
              >
                <div className="tracking-widest" style={{ color: stageBarColor(s) }}>
                  {idx + 1}. {STAGE_NAMES[s].toUpperCase()}
                </div>
                <div className="h-2 rounded-full bg-background/60 border border-border/40 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: stageBarColor(s) }} />
                </div>
                <div className="text-right text-foreground">
                  <span className="font-semibold">{v}</span> <span className="text-muted-foreground">· {pct.toFixed(1)}%</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-dashed border-border/40 font-mono text-[11px] text-muted-foreground">
          <span className="gradient-gold-text font-display text-2xl font-bold align-middle">{total}</span> people total · click any stage on the road for details
        </div>
      </div>

      {/* Engagement cell detail dialog */}
      <Dialog open={!!selectedCell} onOpenChange={(o) => !o && setSelectedCell(null)}>
        <DialogContent className="max-w-3xl p-0 bg-card border-border max-h-[85vh] overflow-hidden">
          {selectedCell && (
            <>
              <div className="p-6 border-b border-border/60">
                <div className="eyebrow">— Engagement · {STAGE_NAMES[selectedCell.stage]}</div>
                <h2 className="font-display text-3xl font-bold mt-1" style={{ color: cellColor }}>
                  {selectedCell.label}{" "}
                  <span className="text-muted-foreground/70 font-mono text-lg">· {cellPeople.length}</span>
                </h2>
              </div>
              <ScrollArea className="max-h-[65vh]">
                <div className="p-6">
                  {cellPeople.length === 0 ? (
                    <p className="text-center font-serif-italic text-sm text-muted-foreground">No one here.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 rounded-xl border border-border/60 bg-background/40 p-3">
                      {cellPeople.map((m: any) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            onSelectPerson?.(m);
                            setSelectedCell(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] text-foreground hover:brightness-125 hover:-translate-y-px transition"
                          style={{
                            border: `1.5px solid ${cellColor}`,
                            background: "hsl(var(--background) / 0.4)",
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: cellColor, border: `1.5px solid ${cellColor}` }}
                          />
                          {m.first_name} {m.last_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}