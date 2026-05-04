import { useMemo } from "react";
import VisionBanner from "../components/VisionBanner";
import StatBlock from "../components/StatBlock";
import { useActionCompletions, useAllActions, useActivityEvents, useMembers, dbStageToRoadmap } from "../hooks/useRoadmapData";
import { LAWS } from "../seed";
import { STAGE_NAMES, type Stage } from "../types";
import { Checkbox } from "@/components/ui/checkbox";

const SCRIPTURES = [
  { ref: "Matthew 28:19–20", text: "Therefore, go and make disciples of all nations, baptizing them … and teaching them to obey everything I have commanded you." },
  { ref: "Ephesians 4:11–12", text: "He gave the apostles, the prophets … to equip the saints for the work of ministry, for building up the body of Christ." },
  { ref: "Acts 2:47", text: "And the Lord added to their number day by day those who were being saved." },
  { ref: "John 15:5", text: "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit." },
  { ref: "1 Peter 2:9", text: "But you are a chosen race, a royal priesthood, a holy nation, a people for his own possession." },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const SOURCE_STYLE: Record<string, string> = {
  chip: "bg-secondary/15 text-secondary border-secondary/30",
  jim: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  impl: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};
const SOURCE_LABEL: Record<string, string> = { chip: "CHIP · TEACHING", jim: "JIM · COACHING", impl: "IMPLEMENTATION" };

export default function TodayTab() {
  const { data: members = [] } = useMembers();
  const { data: events = [] } = useActivityEvents(20);
  const { completions, toggle } = useActionCompletions();
  const allActions = useAllActions();

  const phase1 = allActions.filter((a) => a.phase === 1);
  const phase1Done = phase1.filter((a) => completions[a.id]).length;

  const stageCounts = useMemo(() => {
    const c: Record<Stage, number> = { connect: 0, belong: 0, mature: 0, minister: 0, multiply: 0 };
    members.forEach((m: any) => { c[dbStageToRoadmap(m.discipleship_stage)]++; });
    return c;
  }, [members]);

  const stageMoves7d = events.filter((e) => e.type === "stage-move" && Date.now() - e.ts < 7 * 86400000).length;

  // Follow-ups: members not touched in 14 days (using stage_updated_at as a proxy)
  const followUps = useMemo(() => {
    const cutoff = Date.now() - 14 * 86400000;
    return members
      .filter((m: any) => new Date(m.stage_updated_at).getTime() < cutoff)
      .slice(0, 5);
  }, [members]);

  const recentMoves = events.filter((e) => e.type === "stage-move").slice(0, 6);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase();
  const verse = SCRIPTURES[today.getDate() % SCRIPTURES.length];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
      {/* Hero */}
      <section>
        <div className="eyebrow mb-3">{dateStr}</div>
        <h1 className="font-display text-6xl md:text-7xl font-black leading-[1.05] text-foreground">
          Good <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">{greeting()}</em>, Pastor.
        </h1>
      </section>

      <VisionBanner />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <StatBlock value={`${phase1Done} / ${phase1.length}`} label="Phase 1 done · this week" />
        <StatBlock value={followUps.length} label="People overdue follow-up" />
        <StatBlock value={stageMoves7d} label="Stage moves · last 7 days" gold={stageMoves7d > 0} />
        <StatBlock value={stageCounts.multiply} label="Multiplying disciples" gold />
      </div>

      {/* Phase 1 focus */}
      <section>
        <div className="eyebrow mb-3">— Focus this week</div>
        <h2 className="font-display text-4xl font-bold text-foreground mb-2">
          Phase 1 — <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">this week.</em>
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          The four moves Chip and Jim ranked as foundational. Don't open Phase 2 until these are done.
        </p>
        <div className="space-y-3">
          {phase1.map((a) => {
            const done = !!completions[a.id];
            return (
              <div key={a.id} className={`rounded-xl border p-4 transition ${done ? "bg-card/40 border-border/40 opacity-60" : "bg-card border-border/70"}`}>
                <div className="flex items-start gap-4">
                  <Checkbox checked={done} onCheckedChange={(v) => toggle({ actionId: a.id, isDone: !!v, lawN: a.law, title: a.title })} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-wider ${SOURCE_STYLE[a.source]}`}>
                        {SOURCE_LABEL[a.source]}
                      </span>
                      <span className="rounded border border-accent/40 bg-accent/10 text-accent px-2 py-0.5 font-mono text-[10px] tracking-wider">
                        LAW {a.law}
                      </span>
                      <span className={`font-display font-semibold text-foreground ${done ? "line-through" : ""}`}>{a.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-column: Follow-ups + Recent moves */}
      <section className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="eyebrow mb-3">— Reach out</div>
          <h3 className="font-display text-3xl font-bold mb-2">People needing <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">follow-up</em></h3>
          <p className="text-sm text-muted-foreground mb-6">No pastoral note or stage update in the last 14 days.</p>
          <div className="space-y-2">
            {followUps.length === 0 && <p className="text-sm text-muted-foreground italic">Everyone has been touched recently. 🙌</p>}
            {followUps.map((m: any) => {
              const initials = `${m.first_name?.[0] || ""}${m.last_name?.[0] || ""}`;
              const stage = dbStageToRoadmap(m.discipleship_stage);
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/30 font-mono text-xs font-bold text-secondary">{initials}</div>
                  <div className="flex-1">
                    <div className="font-display font-semibold text-sm">{m.first_name} {m.last_name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      Last touched {timeAgo(new Date(m.stage_updated_at).getTime())}
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wider`}
                    style={{ color: `hsl(var(--stage-${stage}))`, borderColor: `hsl(var(--stage-${stage}) / 0.4)` }}>
                    {STAGE_NAMES[stage].toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-3">— The Road</div>
          <h3 className="font-display text-3xl font-bold mb-2">Recent <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">stage moves</em></h3>
          <p className="text-sm text-muted-foreground mb-6">What the church family has done this week.</p>
          <div className="space-y-3">
            {recentMoves.length === 0 && <p className="text-sm text-muted-foreground italic">No stage moves logged yet. They'll appear here as people progress.</p>}
            {recentMoves.map((e, i) => {
              const p = (e as any).payload;
              return (
                <div key={i} className="flex items-start gap-3 border-b border-dashed border-border/40 pb-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full" style={{ background: `hsl(var(--stage-${p.to}))` }} />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-semibold">Person</span> moved to{" "}
                      <span className="font-semibold text-accent">{STAGE_NAMES[p.to as Stage]}</span>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">from {STAGE_NAMES[p.from as Stage]}</div>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{timeAgo(e.ts)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Scripture footer */}
      <footer className="text-center py-12 border-t border-border/40">
        <p className="font-serif-italic text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">"{verse.text}"</p>
        <div className="eyebrow mt-4 text-[10px]">{verse.ref}</div>
      </footer>
    </div>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
