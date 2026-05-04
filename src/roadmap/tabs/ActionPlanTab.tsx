import { useState } from "react";
import { PHASES } from "../seed";
import { useActionCompletions, useAllActions } from "../hooks/useRoadmapData";
import StatBlock from "../components/StatBlock";
import { Checkbox } from "@/components/ui/checkbox";

const SOURCE_STYLE: Record<string, string> = {
  chip: "bg-secondary/15 text-secondary border-secondary/30",
  jim: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  impl: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};
const SOURCE_LABEL: Record<string, string> = { chip: "CHIP · TEACHING", jim: "JIM · COACHING", impl: "IMPLEMENTATION" };

export default function ActionPlanTab() {
  const allActions = useAllActions();
  const { completions, toggle } = useActionCompletions();
  const [phaseFilter, setPhaseFilter] = useState<number | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<string | "all">("all");

  const filtered = allActions.filter((a) =>
    (phaseFilter === "all" || a.phase === phaseFilter) &&
    (sourceFilter === "all" || a.source === sourceFilter));

  const total = allActions.length;
  const done = allActions.filter((a) => completions[a.id]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const phase1 = allActions.filter((a) => a.phase === 1);
  const phase1Done = phase1.filter((a) => completions[a.id]).length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-10">
      <section>
        <div className="eyebrow mb-3">— Action Plan</div>
        <h1 className="font-display text-5xl md:text-6xl font-black text-foreground">
          From insight <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">to obedience.</em>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-3xl">
          Every law produces action. Every action has a phase and a source. <span className="text-accent font-medium">Phase 1 starts this week.</span> Phase 4 ends with summer harvest.
        </p>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <StatBlock value={done} label="Actions complete" />
        <StatBlock value={`${pct}%`} label="Total progress" />
        <StatBlock value={`${phase1Done}/${phase1.length}`} label="Phase 1 · this week" gold={phase1Done === phase1.length} />
        <StatBlock value={filtered.length} label="Currently filtered" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
        <FilterRow label="Phase" current={phaseFilter} onChange={setPhaseFilter as any}
          options={[["all", "All"], ...PHASES.map((p) => [p.n, `${p.n} · ${p.title}`] as const)]} />
        <FilterRow label="Source" current={sourceFilter} onChange={setSourceFilter as any}
          options={[["all", "All"], ["chip", "Chip · Teaching"], ["jim", "Jim · Coaching"], ["impl", "Implementation"]]} />
      </div>

      {PHASES.map((phase) => {
        const phaseActions = filtered.filter((a) => a.phase === phase.n);
        if (phaseActions.length === 0) return null;
        const phaseDone = phaseActions.filter((a) => completions[a.id]).length;
        return (
          <section key={phase.n}>
            <div className="flex items-end justify-between gap-4 mb-2">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-5xl font-black gradient-gold-text">0{phase.n}</span>
                  <div className="eyebrow">— Phase {phase.n} · {phase.when}</div>
                </div>
                <h2 className="font-display text-3xl font-bold mt-1">{phase.title}</h2>
                <p className="font-serif-italic text-muted-foreground mt-2 max-w-3xl">{phase.blurb}</p>
              </div>
              <div className="font-mono text-sm text-muted-foreground">{phaseDone} / {phaseActions.length} done</div>
            </div>
            <div className="space-y-2 mt-6">
              {phaseActions.map((a) => {
                const isDone = !!completions[a.id];
                return (
                  <div key={a.id} className={`rounded-xl border p-4 ${isDone ? "bg-card/30 border-border/40 opacity-60" : "bg-card border-border/70"}`}>
                    <div className="flex items-start gap-4">
                      <Checkbox checked={isDone} onCheckedChange={(v) => toggle({ actionId: a.id, isDone: !!v, lawN: a.law, title: a.title })} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-wider ${SOURCE_STYLE[a.source]}`}>{SOURCE_LABEL[a.source]}</span>
                          <span className="rounded border border-accent/40 bg-accent/10 text-accent px-2 py-0.5 font-mono text-[10px] tracking-wider">LAW {a.law}</span>
                          <span className={`font-display font-semibold ${isDone ? "line-through" : ""}`}>{a.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{a.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FilterRow<T extends string | number>({ label, current, onChange, options }:
  { label: string; current: T; onChange: (v: T) => void; options: ReadonlyArray<readonly [T, string]> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow w-20">{label}</span>
      {options.map(([v, l]) => (
        <button key={String(v)} onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            current === v ? "bg-accent text-accent-foreground" : "border border-border/60 text-muted-foreground hover:text-foreground"
          }`}>
          {l}
        </button>
      ))}
    </div>
  );
}
