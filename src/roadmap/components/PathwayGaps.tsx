import { useMemo, useState } from "react";
import type { MemberStatus } from "../hooks/useRoadmapData";

const STATUS_OPTIONS: { key: MemberStatus; label: string; color: string }[] = [
  { key: "member", label: "Members", color: "hsl(199 89% 60%)" },
  { key: "regular", label: "Regular Attenders", color: "hsl(210 80% 40%)" },
  { key: "visitor", label: "Visitors", color: "hsl(38 92% 60%)" },
];

const AUDIENCE_OPTIONS: { key: Audience; label: string; color: string }[] = [
  { key: "adults", label: "Adults", color: "hsl(var(--stage-minister))" },
  { key: "children", label: "Children", color: "hsl(var(--stage-mature))" },
];

const displayName = (m: any) => `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Unnamed";

const rhythmsOf = (m: any): string[] => (Array.isArray(m.rhythms) ? m.rhythms : []);
const inRhythm = (m: any) => rhythmsOf(m).length > 0 || m.phase === "rhythms";

interface Props {
  members: any[];
  statusByMember: Map<string, MemberStatus>;
  discByMember: Map<string, Set<string>>;
  volunteerByMember: Map<string, Set<string>>;
  isChildByMember?: Map<string, boolean>;
  onSelectPerson?: (m: any) => void;
}

type Audience = "adults" | "children";


export default function PathwayGaps({
  members,
  statusByMember,
  discByMember,
  volunteerByMember,
  isChildByMember,
  onSelectPerson,
}: Props) {
  // Defaults to Members only — the group leadership reviews most often.
  const [statuses, setStatuses] = useState<Set<MemberStatus>>(() => new Set<MemberStatus>(["member"]));
  // Default both adults and children so nothing is hidden at first glance.
  const [audiences, setAudiences] = useState<Set<Audience>>(() => new Set<Audience>(["adults", "children"]));

  const scoped = useMemo(
    () => members.filter((m) => {
      const s = statusByMember.get(m.id);
      if (!s || !statuses.has(s)) return false;
      const isChild = !!isChildByMember?.get(m.id);
      const audience = isChild ? "children" : "adults";
      return audiences.has(audience);
    }),
    [members, statusByMember, statuses, audiences, isChildByMember]
  );

  const buckets = useMemo(() => {
    const noRhythm: any[] = [];
    const noGroup: any[] = [];
    const notServing: any[] = [];
    const notMultiplying: any[] = [];
    scoped.forEach((m) => {
      if (!inRhythm(m)) noRhythm.push(m);
      if ((discByMember.get(m.id)?.size ?? 0) === 0) noGroup.push(m);
      if ((volunteerByMember.get(m.id)?.size ?? 0) === 0) notServing.push(m);
      if (!rhythmsOf(m).includes("multiplying")) notMultiplying.push(m);
    });
    return [
      {
        key: "rhythm",
        label: "Not in any rhythm",
        hint: "No Maturing, Ministering, or Multiplying marked — the pathway has stalled.",
        color: "hsl(var(--stage-belong))",
        people: noRhythm,
      },
      {
        key: "group",
        label: "Not in a discipleship group",
        hint: "No Life Group, Bible Study, PT Mentorship, or Discipleship Group.",
        color: "hsl(var(--stage-mature))",
        people: noGroup,
      },
      {
        key: "serve",
        label: "Not serving anywhere",
        hint: "No volunteer team — start with a PPP conversation.",
        color: "hsl(var(--stage-minister))",
        people: notServing,
      },
      {
        key: "multiply",
        label: "Not yet multiplying",
        hint: "Nobody they are actively discipling.",
        color: "hsl(var(--stage-multiply))",
        people: notMultiplying,
      },
    ];
  }, [scoped, discByMember, volunteerByMember]);

  const toggle = (key: MemberStatus) =>
    setStatuses((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next.size ? next : prev;
    });

  const toggleAudience = (key: Audience) =>
    setAudiences((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next.size ? next : prev;
    });


  return (
    <section>
      <div className="eyebrow mb-3">— Review our people</div>
      <h2 className="font-display text-4xl font-bold text-foreground mb-2">
        Who isn't <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">plugged in</em> yet?
      </h2>
      <p className="text-muted-foreground mb-6 max-w-3xl">
        Each list below is a gap on the pathway. Click any name to open their profile and take the next step.
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 mb-6">
        <span className="eyebrow text-[10px] mr-1">Status</span>
        {STATUS_OPTIONS.map((s) => {
          const on = statuses.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                on ? "border-transparent" : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
              }`}
              style={on ? { background: s.color, color: "hsl(var(--background))" } : { color: s.color }}
            >
              {s.label}
            </button>
          );
        })}
        <div className="mx-2 h-4 w-px bg-border/60" />
        <span className="eyebrow text-[10px] mr-1">Age</span>
        {AUDIENCE_OPTIONS.map((a) => {
          const on = audiences.has(a.key);
          return (
            <button
              key={a.key}
              onClick={() => toggleAudience(a.key)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                on ? "border-transparent" : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
              }`}
              style={on ? { background: a.color, color: "hsl(var(--background))" } : { color: a.color }}
            >
              {a.label}
            </button>
          );
        })}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{scoped.length} people in view</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {buckets.map((b) => (
          <div key={b.key} className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-card">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg font-semibold" style={{ color: b.color }}>
                {b.label}
              </h3>
              <span className="font-mono text-sm font-bold text-foreground">{b.people.length}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 mb-3">{b.hint}</p>
            <div className="flex flex-wrap gap-2 rounded-xl border border-border/60 bg-background/40 p-3 max-h-56 overflow-y-auto">
              {b.people.length === 0 && (
                <span className="text-[11px] text-muted-foreground/70">Nobody here — well shepherded.</span>
              )}
              {b.people.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectPerson?.(m)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] text-foreground hover:brightness-125 hover:-translate-y-px transition"
                  style={{ border: `1.5px solid ${b.color}`, background: "hsl(var(--background) / 0.4)" }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                  {displayName(m)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}