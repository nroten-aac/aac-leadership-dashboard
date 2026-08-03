import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMembers, dbStageToRoadmap } from "../hooks/useRoadmapData";
import { STAGE_NAMES, type Stage } from "../types";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Home, Sparkles, BadgeCheck } from "lucide-react";
import PersonDrawer from "../components/PersonDrawer";

const STAGES: Stage[] = ["connect", "belong", "mature", "minister", "multiply"];

const STATUS_DEFS = [
  { key: "member", label: "Members", lists: ["Member Adults", "Member Children"] },
  { key: "regular", label: "Regular Attenders", lists: ["Regular Attender Adults", "Regular Attender Children"] },
  { key: "visitor", label: "Visitors", lists: ["Visitors"] },
] as const;
type StatusKey = typeof STATUS_DEFS[number]["key"];

const AGE_DEFS = [
  { key: "adult", label: "Adults" },
  { key: "dependent", label: "Dependents" },
] as const;
type AgeKey = typeof AGE_DEFS[number]["key"];

const GENDER_DEFS = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
  { key: "other", label: "Other" },
] as const;
type GenderKey = typeof GENDER_DEFS[number]["key"];

const DISCIPLESHIP_DEFS = [
  { key: "LG", label: "Life Groups", match: (g: string) => g === "Life Groups" },
  { key: "BS", label: "Bible Studies", match: (g: string) => g.toLowerCase().includes("bible") },
  { key: "PT", label: "PT Mentorship", match: (g: string) => g === "PT Mentorship" },
  { key: "DG", label: "Discipleship Groups", match: (g: string) => g === "Discipleship Groups" },
] as const;
type DiscKey = typeof DISCIPLESHIP_DEFS[number]["key"];

export const STATUS_STYLE: Record<StatusKey, { label: string; dot: string; bg: string; text: string; border: string }> = {
  member:  { label: "Member",   dot: "bg-sky-400",     bg: "bg-sky-500/10",     text: "text-sky-300",     border: "border-sky-500/40" },
  regular: { label: "Regular",  dot: "bg-violet-400",  bg: "bg-violet-500/10",  text: "text-violet-300",  border: "border-violet-500/40" },
  visitor: { label: "Visitor",  dot: "bg-amber-400",   bg: "bg-amber-500/10",   text: "text-amber-300",   border: "border-amber-500/40" },
};

export default function PeopleTab() {
  const { data: members = [] } = useMembers();
  const [selected, setSelected] = useState<any | null>(null);
  // Keep the drawer in sync with the latest member data after mutations.
  const liveSelected = useMemo(
    () => (selected ? (members as any[]).find((m) => m.id === selected.id) ?? selected : null),
    [selected, members]
  );
  const { data: groups = [] } = useQuery({
    queryKey: ["member_groups", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_groups")
        .select("member_id, group_name, group_type");
      if (error) throw error;
      return data;
    },
  });

  // member_id -> status key, discipleship keys, volunteer team names
  const { statusByMember, ageByMember, discByMember, volunteerByMember, allVolunteerTeams } = useMemo(() => {
    const map = new Map<string, StatusKey>();
    const priority: Record<StatusKey, number> = { member: 3, regular: 2, visitor: 1 };
    const age = new Map<string, AgeKey>();
    const disc = new Map<string, Set<DiscKey>>();
    const vol = new Map<string, Set<string>>();
    const teams = new Set<string>();
    (groups as any[]).forEach((g) => {
      if (g.group_type === "membership") {
        const def = STATUS_DEFS.find((s) => (s.lists as readonly string[]).includes(g.group_name));
        if (def) {
          const existing = map.get(g.member_id);
          if (!existing || priority[def.key] > priority[existing]) map.set(g.member_id, def.key);
          // Children list → dependent; Adults list → adult; otherwise default to adult
          if (/Children/i.test(g.group_name)) age.set(g.member_id, "dependent");
          else if (!age.has(g.member_id)) age.set(g.member_id, "adult");
        }
      } else if (g.group_type === "discipleship") {
        const d = DISCIPLESHIP_DEFS.find((x) => x.match(g.group_name));
        if (d) {
          if (!disc.has(g.member_id)) disc.set(g.member_id, new Set());
          disc.get(g.member_id)!.add(d.key);
        }
      } else if (g.group_type === "volunteer") {
        teams.add(g.group_name);
        if (!vol.has(g.member_id)) vol.set(g.member_id, new Set());
        vol.get(g.member_id)!.add(g.group_name);
      }
    });
    return { statusByMember: map, ageByMember: age, discByMember: disc, volunteerByMember: vol, allVolunteerTeams: Array.from(teams).sort() };
  }, [groups]);

  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<Set<Stage>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<StatusKey>>(new Set());
  const [discFilter, setDiscFilter] = useState<Set<DiscKey>>(new Set());
  const [volFilter, setVolFilter] = useState<Set<string>>(new Set());
  const [ageFilter, setAgeFilter] = useState<Set<AgeKey>>(new Set());
  const [genderFilter, setGenderFilter] = useState<Set<GenderKey>>(new Set());
  const [householdFilter, setHouseholdFilter] = useState<string>("");
  const [groupByHousehold, setGroupByHousehold] = useState(false);

  const toggle = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return members.filter((m: any) => {
      // Only show people categorized as Member, Regular, or Visitor
      if (!statusByMember.has(m.id)) return false;
      if (!`${m.first_name} ${m.last_name}`.toLowerCase().includes(ql)) return false;
      if (stageFilter.size) {
        const phase = (m.phase || "connecting") as string;
        const rhythms: string[] = Array.isArray(m.rhythms) ? m.rhythms : [];
        const matches = [...stageFilter].some((s) => {
          if (s === "connect")  return phase === "connecting";
          if (s === "belong")   return phase === "belonging";
          if (s === "mature")   return phase === "rhythms" && rhythms.includes("maturing");
          if (s === "minister") return phase === "rhythms" && rhythms.includes("ministering");
          if (s === "multiply") return phase === "rhythms" && rhythms.includes("multiplying");
          return false;
        });
        if (!matches) return false;
      }
      if (statusFilter.size) {
        const s = statusByMember.get(m.id);
        if (!s || !statusFilter.has(s)) return false;
      }
      if (discFilter.size) {
        const ds = discByMember.get(m.id);
        if (!ds || ![...discFilter].some((k) => ds.has(k))) return false;
      }
      if (volFilter.size) {
        const vs = volunteerByMember.get(m.id);
        if (!vs || ![...volFilter].some((k) => vs.has(k))) return false;
      }
      if (ageFilter.size) {
        const a = ageByMember.get(m.id) ?? "adult";
        if (!ageFilter.has(a)) return false;
      }
      if (genderFilter.size) {
        const g = (m.gender || "").toLowerCase();
        const key: GenderKey = g === "male" ? "male" : g === "female" ? "female" : "other";
        if (!genderFilter.has(key)) return false;
      }
      if (householdFilter) {
        if ((m.household_name || "") !== householdFilter) return false;
      }
      return true;
    });
  }, [members, q, stageFilter, statusFilter, discFilter, volFilter, ageFilter, genderFilter, householdFilter, statusByMember, ageByMember, discByMember, volunteerByMember]);

  // All households present among categorized people (for the filter dropdown)
  const allHouseholds = useMemo(() => {
    const s = new Set<string>();
    (members as any[]).forEach((m) => {
      if (statusByMember.has(m.id) && m.household_name) s.add(m.household_name);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [members, statusByMember]);

  // Flat list, or grouped into household sections when "View by household" is on
  const displayItems = useMemo(() => {
    if (!groupByHousehold) return (filtered as any[]).map((m) => ({ type: "person" as const, m }));
    const groups = new Map<string, any[]>();
    (filtered as any[]).forEach((m) => {
      const key = m.household_name || "No household";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    });
    const sorted = Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === "No household") return 1;
      if (b[0] === "No household") return -1;
      return a[0].localeCompare(b[0]);
    });
    const items: any[] = [];
    sorted.forEach(([name, people]) => {
      items.push({ type: "header" as const, name, count: people.length });
      people
        .sort((x, y) => (x.last_name || "").localeCompare(y.last_name || ""))
        .forEach((m) => items.push({ type: "person" as const, m }));
    });
    return items;
  }, [filtered, groupByHousehold]);

  const exportCsv = () => {
    const headers = ["First Name","Last Name","Email","Phone","Gender","Household","Status","Age","Stage","Discipleship","Serving"];
    const rows = filtered.map((m: any) => {
      const status = statusByMember.get(m.id);
      const age = ageByMember.get(m.id) ?? "adult";
      const stage = dbStageToRoadmap(m.discipleship_stage);
      const disc = Array.from(discByMember.get(m.id) || []).join("; ");
      const vol = Array.from(volunteerByMember.get(m.id) || []).join("; ");
      return [m.first_name||"", m.last_name||"", m.email||"", m.phone||"", m.gender||"", m.household_name||"", status||"", age, STAGE_NAMES[stage], disc, vol];
    });
    const esc = (v: string) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `people_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

      <div className="space-y-4">
        <Input placeholder="Search people…" value={q} onChange={(e) => setQ(e.target.value)}
          className="max-w-md bg-card border-border" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow text-[10px] mr-1">Stage</span>
          {STAGES.map((s) => {
            const on = stageFilter.has(s);
            return (
              <button
                key={s}
                onClick={() => toggle(stageFilter, s, setStageFilter)}
                className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                  on ? "border-transparent text-background" : "border-border bg-card hover:border-accent/40"
                }`}
                style={on ? { background: `hsl(var(--stage-${s}))`, color: "hsl(var(--background))" } : { color: `hsl(var(--stage-${s}))` }}
              >
                {STAGE_NAMES[s]}
              </button>
            );
          })}
          {stageFilter.size > 0 && (
            <button onClick={() => setStageFilter(new Set())} className="text-[10px] text-muted-foreground underline ml-1">clear</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow text-[10px] mr-1">Status</span>
          {STATUS_DEFS.map((def) => {
            const on = statusFilter.has(def.key);
            return (
              <button
                key={def.key}
                onClick={() => toggle(statusFilter, def.key, setStatusFilter)}
                className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                  on ? "border-accent bg-accent/15 text-accent" : "border-border bg-card text-muted-foreground hover:border-accent/40"
                }`}
              >
                {def.label}
              </button>
            );
          })}
          {statusFilter.size > 0 && (
            <button onClick={() => setStatusFilter(new Set())} className="text-[10px] text-muted-foreground underline ml-1">clear</button>
          )}
        </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow text-[10px] mr-1">Discipleship</span>
        {DISCIPLESHIP_DEFS.map((def) => {
          const on = discFilter.has(def.key);
          return (
            <button
              key={def.key}
              onClick={() => toggle(discFilter, def.key, setDiscFilter)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                on ? "border-accent bg-accent/15 text-accent" : "border-border bg-card text-muted-foreground hover:border-accent/40"
              }`}
              title={def.label}
            >
              {def.key} · {def.label}
            </button>
          );
        })}
        {discFilter.size > 0 && (
          <button onClick={() => setDiscFilter(new Set())} className="text-[10px] text-muted-foreground underline ml-1">clear</button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow text-[10px] mr-1">Serving</span>
        {allVolunteerTeams.map((team) => {
          const on = volFilter.has(team);
          return (
            <button
              key={team}
              onClick={() => toggle(volFilter, team, setVolFilter)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                on ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border bg-card text-muted-foreground hover:border-emerald-500/40"
              }`}
            >
              {team}
            </button>
          );
        })}
        {volFilter.size > 0 && (
          <button onClick={() => setVolFilter(new Set())} className="text-[10px] text-muted-foreground underline ml-1">clear</button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow text-[10px] mr-1">Age</span>
        {AGE_DEFS.map((def) => {
          const on = ageFilter.has(def.key);
          return (
            <button
              key={def.key}
              onClick={() => toggle(ageFilter, def.key, setAgeFilter)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                on ? "border-accent bg-accent/15 text-accent" : "border-border bg-card text-muted-foreground hover:border-accent/40"
              }`}
            >
              {def.label}
            </button>
          );
        })}
        {ageFilter.size > 0 && (
          <button onClick={() => setAgeFilter(new Set())} className="text-[10px] text-muted-foreground underline ml-1">clear</button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow text-[10px] mr-1">Gender</span>
        {GENDER_DEFS.map((def) => {
          const on = genderFilter.has(def.key);
          return (
            <button
              key={def.key}
              onClick={() => toggle(genderFilter, def.key, setGenderFilter)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                on ? "border-accent bg-accent/15 text-accent" : "border-border bg-card text-muted-foreground hover:border-accent/40"
              }`}
            >
              {def.label}
            </button>
          );
        })}
        {genderFilter.size > 0 && (
          <button onClick={() => setGenderFilter(new Set())} className="text-[10px] text-muted-foreground underline ml-1">clear</button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow text-[10px] mr-1">Household</span>
        <select
          value={householdFilter}
          onChange={(e) => setHouseholdFilter(e.target.value)}
          className="rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-accent/40 transition max-w-[260px]"
        >
          <option value="">All households ({allHouseholds.length})</option>
          {allHouseholds.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <button
          onClick={() => setGroupByHousehold((v) => !v)}
          className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
            groupByHousehold ? "border-accent bg-accent/15 text-accent" : "border-border bg-card text-muted-foreground hover:border-accent/40"
          }`}
        >
          View by household
        </button>
        {householdFilter && (
          <button onClick={() => setHouseholdFilter("")} className="text-[10px] text-muted-foreground underline ml-1">clear</button>
        )}
      </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-mono text-foreground">{filtered.length}</span> of {statusByMember.size}
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="rounded-full border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {displayItems.map((item: any, idx: number) => {
          if (item.type === "header") {
            return (
              <div key={`h-${item.name}-${idx}`} className="col-span-full flex items-center gap-3 pt-4 first:pt-0">
                <Home className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="font-display font-semibold text-sm text-foreground">{item.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{item.count}</span>
                <span className="h-px flex-1 bg-border/60" />
              </div>
            );
          }
          const m: any = item.m;
          const stage = dbStageToRoadmap(m.discipleship_stage);
          const initials = `${m.first_name?.[0] || ""}${m.last_name?.[0] || ""}`;
          const stageDays = m.stage_updated_at
            ? Math.floor((Date.now() - new Date(m.stage_updated_at).getTime()) / 86400000)
            : null;
          const discKeys = Array.from(discByMember.get(m.id) || []);
          const volTeams = Array.from(volunteerByMember.get(m.id) || []);
          const status = statusByMember.get(m.id);
          const statusStyle = status ? STATUS_STYLE[status] : null;
          const rhythmsArr: string[] = Array.isArray(m.rhythms) ? m.rhythms : [];
          const allRhythms = m.phase === "rhythms" && ["maturing","ministering","multiplying"].every((r) => rhythmsArr.includes(r));
          const inRhythms = m.phase === "rhythms";
          // Only surface the member marker for those who haven't yet stepped into a rhythm —
          // members already active in rhythms don't need the extra tag.
          const isMember = status === "member" && !inRhythms;
          // For people in the rhythms phase, split the stage ring into three arcs —
          // one per rhythm — lighting up only the rhythms they are actually in.
          const rhythmArcs = inRhythms
            ? ([
                { key: "maturing",    start: 3,   end: 117, color: "hsl(var(--stage-mature))" },
                { key: "ministering", start: 123, end: 237, color: "hsl(var(--stage-minister))" },
                { key: "multiplying", start: 243, end: 357, color: "hsl(var(--stage-multiply))" },
              ] as const)
            : null;
          const polar = (deg: number, r: number) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            return { x: 26 + r * Math.cos(rad), y: 26 + r * Math.sin(rad) };
          };
          const arcPath = (start: number, end: number, r = 24) => {
            const s = polar(start, r);
            const e = polar(end, r);
            const large = end - start > 180 ? 1 : 0;
            return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
          };
          return (
            <div key={m.id} onClick={() => setSelected(m)} className="group relative rounded-xl border border-border/60 bg-card p-4 hover:border-accent/40 transition cursor-pointer flex flex-col gap-3">
              {allRhythms && (
                <Sparkles
                  className="absolute top-2 left-2 h-4 w-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                  aria-label="Active in all three rhythms"
                />
              )}
              {statusStyle && (
                <span
                  className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-full border ${statusStyle.border} ${statusStyle.bg} ${statusStyle.text} px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider`}
                  title={statusStyle.label}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                  {statusStyle.label}
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={`${m.first_name} ${m.last_name}`}
                      className={`h-12 w-12 rounded-full object-cover ${isMember ? "ring-2 ring-amber-400" : rhythmArcs ? "" : "ring-2"}`}
                      style={isMember || rhythmArcs ? undefined : { ['--tw-ring-color' as any]: `hsl(var(--stage-${stage}) / 0.5)` }} />
                  ) : (
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full font-mono text-xs font-bold ${isMember ? "ring-2 ring-amber-400" : ""}`}
                      style={{ background: `hsl(var(--stage-${stage}) / 0.2)`, color: `hsl(var(--stage-${stage}))` }}>
                      {initials}
                    </div>
                  )}
                  {rhythmArcs && !isMember && (
                    <svg
                      viewBox="0 0 52 52"
                      className="pointer-events-none absolute -inset-0.5 h-[52px] w-[52px]"
                      aria-label="Active rhythms"
                    >
                      {rhythmArcs.map((a) => {
                        const on = rhythmsArr.includes(a.key);
                        return (
                          <path
                            key={a.key}
                            d={arcPath(a.start, a.end)}
                            fill="none"
                            stroke={on ? a.color : "hsl(var(--border))"}
                            strokeOpacity={on ? 1 : 0.35}
                            strokeWidth={2.5}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </svg>
                  )}
                  {isMember && (
                    <BadgeCheck
                      className="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-amber-400 fill-background"
                      strokeWidth={2.5}
                      aria-label="Covenant member"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold truncate pr-16">{m.first_name} {m.last_name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: `hsl(var(--stage-${stage}))` }}>
                    {STAGE_NAMES[stage]}
                    {isMember && <span className="ml-1.5 text-amber-400">✦ MEMBER</span>}
                    {stageDays !== null && <span className="text-muted-foreground ml-2 normal-case tracking-normal">· {stageDays}d</span>}
                  </div>
                  {m.household_name && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 truncate">
                      <Home className="h-3 w-3 shrink-0" /> <span className="truncate">{m.household_name}</span>
                    </div>
                  )}
                </div>
              </div>
              {(discKeys.length > 0 || volTeams.length > 0) && (
                <div className="flex flex-wrap gap-1 -mt-1">
                  {discKeys.map((k) => (
                    <span key={k} className="rounded-full border border-accent/40 bg-accent/10 text-accent px-1.5 py-0.5 font-mono text-[9px] tracking-wider"
                      title={DISCIPLESHIP_DEFS.find((d) => d.key === k)?.label}>
                      {k}
                    </span>
                  ))}
                  {volTeams.map((t) => (
                    <span key={t} className="rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 font-mono text-[9px] tracking-wider truncate max-w-[110px]"
                      title={t}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {(m.email || m.phone) && (
                <div className="border-t border-border/40 pt-2 space-y-1 text-[11px] text-muted-foreground">
                  {m.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{m.email}</span>
                    </div>
                  )}
                  {m.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" /> <span>{m.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground italic py-12">No matches.</p>}
      </div>

      <PersonDrawer
        member={liveSelected}
        onOpenChange={(open) => !open && setSelected(null)}
        discKeys={liveSelected ? Array.from(discByMember.get(liveSelected.id) || []) : []}
        volTeams={liveSelected ? Array.from(volunteerByMember.get(liveSelected.id) || []) : []}
        discLabel={(k) => DISCIPLESHIP_DEFS.find((d) => d.key === k)?.label ?? k}
        status={selected ? statusByMember.get(selected.id) ?? null : null}
      />
    </div>
  );
}
