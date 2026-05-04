import { useState, useMemo } from "react";
import { useMembers, dbStageToRoadmap } from "../hooks/useRoadmapData";
import { STAGE_NAMES, type Stage } from "../types";
import { Input } from "@/components/ui/input";

export default function PeopleTab() {
  const { data: members = [] } = useMembers();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return members.filter((m: any) => `${m.first_name} ${m.last_name}`.toLowerCase().includes(ql));
  }, [members, q]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-10">
      <section>
        <div className="eyebrow mb-3">— The Family</div>
        <h1 className="font-display text-5xl md:text-6xl font-black text-foreground">
          Every name. <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">Every stage.</em>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-3xl">
          Synced from Planning Center. Click a tile to open the person drawer with stage history and pastoral notes.
        </p>
      </section>

      <Input placeholder="Search people…" value={q} onChange={(e) => setQ(e.target.value)}
        className="max-w-md bg-card border-border" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((m: any) => {
          const stage = dbStageToRoadmap(m.discipleship_stage);
          const initials = `${m.first_name?.[0] || ""}${m.last_name?.[0] || ""}`;
          return (
            <div key={m.id} className="group rounded-xl border border-border/60 bg-card p-4 hover:border-accent/40 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full font-mono text-xs font-bold"
                  style={{ background: `hsl(var(--stage-${stage}) / 0.2)`, color: `hsl(var(--stage-${stage}))` }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold truncate">{m.first_name} {m.last_name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: `hsl(var(--stage-${stage}))` }}>
                    {STAGE_NAMES[stage]}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground italic py-12">No matches.</p>}
      </div>
    </div>
  );
}
