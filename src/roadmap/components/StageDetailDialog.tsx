import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { type MemberStatus } from "../hooks/useRoadmapData";
import { STAGE_NAMES, STAGE_ORDER, type Stage } from "../types";
import { STAGE_ICONS } from "@/components/icons/StageIcons";
import { Plus, X, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Per-stage engagement chip definitions. Each chip's `count` receives the stage's
// member rows + their group memberships and returns the number of people that fit.
type Chip = {
  key: string;
  label: string;
  count: (members: any[], groupsByMember: Map<string, any[]>) => number;
};

const DAYS = (n: number) => Date.now() - n * 86400000;
const recent = (date: string | null, days: number) => !!date && new Date(date).getTime() >= DAYS(days);

const hasGroup = (groups: any[] | undefined, pred: (name: string, type: string) => boolean) =>
  !!groups?.some((g) => pred(g.group_name, g.group_type));

const STAGE_CHIPS: Record<Stage, Chip[]> = {
  connect: [
    { key: "NEW", label: "First-time visitors",
      count: (m) => m.filter((p) => p.membership_status === "visitor" && recent(p.membership_date, 30)).length },
    { key: "RTN", label: "Recent attendees",
      count: (m) => m.filter((p) => p.membership_status === "visitor").length },
    { key: "INT", label: "Showing interest",
      count: (m, g) => m.filter((p) => (g.get(p.id) || []).length > 0).length },
  ],
  belong: [
    { key: "MEM", label: "Members",
      count: (m) => m.filter((p) => p.membership_status === "active").length },
    { key: "BAP", label: "Recently baptized",
      count: () => 0 },
    { key: "NEW", label: "New members (90d)",
      count: (m) => m.filter((p) => recent(p.membership_date, 90)).length },
  ],
  mature: [
    { key: "LG", label: "Life Groups",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n === "Life Groups")).length },
    { key: "BS", label: "Bible Studies",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n.toLowerCase().includes("bible"))).length },
    { key: "PT", label: "PT Mentorship",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n === "PT Mentorship")).length },
    { key: "DG", label: "Discipleship Groups",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n === "Discipleship Groups")).length },
  ],
  minister: [
    { key: "ANN", label: "Announcement Team",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n === "Announcement Team")).length },
    { key: "COM", label: "Communion",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n === "Communion")).length },
    { key: "CHL", label: "Children's Ministry",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n === "Children's Ministry")).length },
    { key: "TTH", label: "Tithe Counters",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n.startsWith("Tithe"))).length },
    { key: "PRD", label: "Production",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n === "Production" || n === "Band" || n === "Vocals")).length },
    { key: "ENC", label: "Encounter Team",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n === "Encounter Team")).length },
  ],
  multiply: [
    { key: "TIM", label: "Discipling someone",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (n) => n === "PT Mentorship" || n === "Discipleship Groups")).length },
    { key: "LED", label: "Leading group",
      count: (m, g) => m.filter((p) => hasGroup(g.get(p.id), (_n, t) => t === "discipleship")).length },
    { key: "EXT", label: "External mission",
      count: () => 0 },
  ],
};

// What tags appear on the per-person row at this stage
const STAGE_PERSON_TAGS: Record<Stage, Array<{ key: string; match: (g: any) => boolean }>> = {
  connect: [
    { key: "NEW", match: () => false },
  ],
  belong: [
    { key: "MEM", match: () => false }, // populated below from membership_status
  ],
  mature: [
    { key: "LG", match: (g) => g.group_name === "Life Groups" },
    { key: "BS", match: (g) => g.group_name.toLowerCase().includes("bible") },
    { key: "PT", match: (g) => g.group_name === "PT Mentorship" },
    { key: "DG", match: (g) => g.group_name === "Discipleship Groups" },
  ],
  minister: [
    { key: "LG", match: (g) => g.group_name === "Life Groups" },
    { key: "BS", match: (g) => g.group_name.toLowerCase().includes("bible") },
    { key: "SRV", match: (g) => g.group_type === "volunteer" },
  ],
  multiply: [
    { key: "LG", match: (g) => g.group_name === "Life Groups" },
    { key: "BS", match: (g) => g.group_name.toLowerCase().includes("bible") },
    { key: "SRV", match: (g) => g.group_type === "volunteer" },
    { key: "TIM", match: (g) => g.group_name === "PT Mentorship" || g.group_name === "Discipleship Groups" },
  ],
};

const STAGE_QUOTE: Record<Stage, string> = {
  connect: "In orbit — attending but not yet committed to Christ. The mission field that walks through your doors.",
  belong: "Came to faith, baptized, joined the church family. The decisive turn from outside to inside.",
  mature: "Growing through Scripture, small group, and prayer. The deep work of formation — where most of AAC currently lives.",
  minister: "Using spiritual gifts in ministry within the church. The leap from learner to giver — where formation becomes function.",
  multiply: "On mission, discipling others, reproducing disciples. The summit of the road — where the gospel goes beyond them and starts working through them.",
};

const STAGE_EMPTY: Record<Stage, string> = {
  connect: "No one tracked here yet — and that is the gap. The mission begins with naming visitors and following up before Sunday becomes a memory.",
  belong: "No one is at this stage right now.",
  mature: "No one is at this stage right now.",
  minister: "No one is at this stage right now.",
  multiply: "No one is at this stage right now.",
};

const STAGE_COACHING: Record<Stage, { label: string; body: string }> = {
  connect: {
    label: "Move them forward",
    body: "Open this stage by tracking visitors and follow-up conversations from Sunday services. Add anyone showing interest who hasn't yet committed.",
  },
  belong: {
    label: "Move them forward",
    body: "Assign a shepherd · connect to a Life Group · begin a Bible reading plan · schedule the membership conversation with Pastor Nate.",
  },
  mature: {
    label: "Move them forward",
    body: "PPP Conversation — discover Passion / Pain / Proficiency for each. Connect every soul to a serve team that matches their design. Easter goal: 100% have had a PPP conversation.",
  },
  minister: {
    label: "Move them forward",
    body: 'Assign each a Timothy — someone they begin discipling. Recruit as a "sniper" for outreach pairings. Deploy at the Farmers Market and community events this summer.',
  },
  multiply: {
    label: "Move them forward",
    body: "Keep investing. They are reproducing the gospel — protect their soul, unleash their gifts, and let them lead the next wave at AAC.",
  },
};

const STAGE_KEY_TO_DB: Record<Stage, keyof typeof STAGE_ICONS> = {
  connect: "connecting",
  belong: "belonging",
  mature: "maturing",
  minister: "ministering",
  multiply: "multiplying",
};

// Single-letter shorthand for the per-person milestone pill row.
const STAGE_SHORT: Record<Stage, string> = {
  connect: "C",
  belong:  "B",
  mature:  "M",
  minister: "Mi",
  multiply: "Mu",
};

const STATUS_STYLE: Record<MemberStatus, { label: string; color: string }> = {
  member:  { label: "Member",  color: "hsl(199 89% 60%)" },
  regular: { label: "Regular", color: "hsl(258 80% 72%)" },
  visitor: { label: "Visitor", color: "hsl(38 92% 60%)"  },
};

// Compute the set of milestones a person is currently in given their phase/rhythms.
function activeStages(m: any): Set<Stage> {
  const set = new Set<Stage>();
  const phase = (m.phase || "connecting") as string;
  if (phase === "connecting") set.add("connect");
  else if (phase === "belonging") set.add("belong");
  else {
    const rs: string[] = Array.isArray(m.rhythms) ? m.rhythms : [];
    if (rs.includes("maturing")) set.add("mature");
    if (rs.includes("ministering")) set.add("minister");
    if (rs.includes("multiplying")) set.add("multiply");
  }
  return set;
}

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
  stage: Stage | null;
  onClose: () => void;
  members: any[];
  statusByMember: Map<string, MemberStatus>;
  onSelectPerson?: (m: any) => void;
}

export default function StageDetailDialog({ stage, onClose, members, statusByMember, onSelectPerson }: Props) {
  const { data: groups = [] } = useMemberGroups();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  // Mutation: assign or remove a person from a given milestone.
  // The DB trigger sync_discipleship_phase keeps discipleship_stage in sync.
  const updateMilestone = useMutation({
    mutationFn: async ({
      memberId,
      target,
      action,
      current,
    }: {
      memberId: string;
      target: Stage;
      action: "add" | "remove";
      current: any;
    }) => {
      const curRhythms: string[] = Array.isArray(current.rhythms) ? current.rhythms : [];
      let phase: "connecting" | "belonging" | "rhythms";
      let rhythms: string[] = [];

      if (action === "add") {
        if (target === "connect") { phase = "connecting"; }
        else if (target === "belong") { phase = "belonging"; }
        else {
          phase = "rhythms";
          const key = target === "mature" ? "maturing" : target === "minister" ? "ministering" : "multiplying";
          const base = (current.phase === "rhythms") ? curRhythms : [];
          rhythms = Array.from(new Set([...base, key]));
        }
      } else {
        // remove
        if (target === "connect") { phase = "belonging"; } // advance off connecting
        else if (target === "belong") { phase = "connecting"; } // step back
        else {
          const key = target === "mature" ? "maturing" : target === "minister" ? "ministering" : "multiplying";
          const next = curRhythms.filter((r) => r !== key);
          if (next.length === 0) { phase = "belonging"; rhythms = []; }
          else { phase = "rhythms"; rhythms = next; }
        }
      }

      const { error } = await supabase
        .from("members")
        .update({ phase, rhythms, stage_updated_at: new Date().toISOString() } as any)
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["roadmap", "members"] });
      qc.invalidateQueries({ queryKey: ["shepherding-members"] });
      toast({
        title:
          vars.action === "add"
            ? `Added to ${STAGE_NAMES[vars.target]}`
            : `Removed from ${STAGE_NAMES[vars.target]}`,
      });
    },
    onError: (e: any) =>
      toast({ title: "Could not update", description: e?.message ?? String(e), variant: "destructive" }),
  });

  if (!stage) return null;

  const Icon = STAGE_ICONS[STAGE_KEY_TO_DB[stage]];
  // Use the live phase/rhythms model so people who are in *multiple* rhythm
  // milestones appear in each one.
  const stageMembers = members.filter((m: any) => activeStages(m).has(stage));
  const otherMembers = members.filter((m: any) => !activeStages(m).has(stage));
  const total = members.length;
  const here = stageMembers.length;
  const pct = total ? ((here / total) * 100).toFixed(1) : "0.0";
  const color = `hsl(var(--stage-${stage}))`;

  // Group memberships keyed by member id (only this stage's members)
  const stageMemberIds = new Set(stageMembers.map((m: any) => m.id));
  const groupsByMember = new Map<string, any[]>();
  groups.forEach((g: any) => {
    if (!stageMemberIds.has(g.member_id)) return;
    const arr = groupsByMember.get(g.member_id) || [];
    arr.push(g);
    groupsByMember.set(g.member_id, arr);
  });

  const chips = STAGE_CHIPS[stage];
  const tagDefs = STAGE_PERSON_TAGS[stage];
  const tagsByMember = new Map<string, string[]>();
  stageMembers.forEach((m: any) => {
    const memberGroups = groupsByMember.get(m.id) || [];
    const tags: string[] = [];
    if (stage === "belong" && m.membership_status === "active") tags.push("MEM");
    tagDefs.forEach((td) => {
      if (memberGroups.some(td.match) && !tags.includes(td.key)) tags.push(td.key);
    });
    if (tags.length) tagsByMember.set(m.id, tags);
  });

  const coaching = STAGE_COACHING[stage];
  const visiblePeople = stageMembers.slice(0, 100);

  const ql = search.trim().toLowerCase();
  const addCandidates = otherMembers
    .filter((m: any) =>
      !ql || `${m.first_name ?? ""} ${m.last_name ?? ""}`.toLowerCase().includes(ql)
    )
    .slice(0, 50);

  return (
    <Dialog open={!!stage} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 bg-card border-border max-h-[90vh] overflow-hidden">
        {/* Hero */}
        <div className="p-6 border-b border-border/60">
          <div className="flex items-start gap-4">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center shrink-0 border-2"
              style={{ borderColor: color, background: "hsl(var(--background))", color }}
            >
              <Icon width={44} height={44} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="font-display text-4xl font-bold" style={{ color }}>{STAGE_NAMES[stage]}</h2>
              <div className="font-mono text-xs text-muted-foreground mt-2">
                <span className="text-foreground font-semibold text-base">{here}</span> here ·{" "}
                <span className="text-foreground">{pct}%</span> of the family
              </div>
            </div>
          </div>
          <p className="font-serif-italic text-muted-foreground mt-4 text-base">
            "{STAGE_QUOTE[stage]}"
          </p>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Engagement */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="eyebrow">— Engagement <span className="text-muted-foreground/70 normal-case tracking-normal italic ml-2">— synced from PCO</span></div>
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  {chips.length} TYPES TRACKED
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {chips.map((c) => {
                  const v = c.count(stageMembers, groupsByMember);
                  return (
                    <div key={c.key} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center font-mono text-[11px] font-bold" style={{ background: `${color}33`, color }}>
                        {c.key}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-semibold text-sm text-foreground truncate">{c.label}</div>
                        <div className="font-mono text-[11px] text-muted-foreground"><span className="text-foreground font-semibold">{v}</span> {v === 1 ? "person" : "people"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* People */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="eyebrow">— People at this stage</div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                    {here} AT THIS STAGE
                  </div>
                  <button
                    onClick={() => { setAdding((v) => !v); setSearch(""); }}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/10 text-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider hover:bg-accent/20 transition"
                  >
                    {adding ? (<><X className="h-3 w-3" /> Close</>) : (<><Plus className="h-3 w-3" /> Add</>)}
                  </button>
                </div>
              </div>

              {/* Add panel — search across all filtered family members not in this milestone */}
              {adding && (
                <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-3">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Find someone to add to ${STAGE_NAMES[stage]}…`}
                      className="pl-8 bg-background/60 border-border h-9"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {addCandidates.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground italic py-4">
                        {ql ? "No matches." : "Start typing to find someone…"}
                      </div>
                    )}
                    {addCandidates.map((m: any) => {
                      const status = statusByMember.get(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() =>
                            updateMilestone.mutate({ memberId: m.id, target: stage, action: "add", current: m })
                          }
                          disabled={updateMilestone.isPending}
                          className="flex w-full items-center gap-2 rounded-lg border border-border/40 bg-background/60 px-2 py-1.5 hover:border-accent/60 transition text-left"
                        >
                          <Plus className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="font-display text-sm text-foreground truncate flex-1">
                            {m.first_name} {m.last_name}
                          </span>
                          {status && (
                            <span
                              className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                              style={{ color: STATUS_STYLE[status].color, borderColor: STATUS_STYLE[status].color + "66" }}
                            >
                              {STATUS_STYLE[status].label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {here === 0 ? (
                <div className="rounded-xl border border-border/60 bg-background/40 p-6">
                  <p className="text-center font-serif-italic text-sm text-muted-foreground">{STAGE_EMPTY[stage]}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visiblePeople.map((m: any) => {
                    const initials = `${m.first_name?.[0] || ""}${m.last_name?.[0] || ""}`;
                    const tags = tagsByMember.get(m.id) || [];
                    const sub = m.household_name
                      ? `${m.household_name}${tags.length ? " · " + tags.join(" + ") : ""}`
                      : tags.length ? tags.join(" + ") : "—";
                    const active = activeStages(m);
                    const status = statusByMember.get(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => onSelectPerson?.(m)}
                        className={`flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 ${onSelectPerson ? "cursor-pointer hover:border-accent/60 transition" : ""}`}
                      >
                        {m.photo_url ? (
                          <img src={m.photo_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0" style={{ background: `${color}33`, color }}>
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-display font-semibold text-sm text-foreground truncate">{m.first_name} {m.last_name}</div>
                            {status && (
                              <span
                                className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0"
                                style={{ color: STATUS_STYLE[status].color, borderColor: STATUS_STYLE[status].color + "66" }}
                              >
                                {STATUS_STYLE[status].label}
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground truncate">{sub}</div>
                          {/* Milestone indicators — click to toggle membership in any milestone */}
                          <div className="flex items-center gap-1 mt-1.5">
                             {STAGE_ORDER.filter((s) => active.has(s)).map((s) => {
                              const on = true;
                              const isThis = s === stage;
                              return (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateMilestone.mutate({
                                      memberId: m.id,
                                      target: s,
                                      action: on ? "remove" : "add",
                                      current: m,
                                    });
                                  }}
                                  disabled={updateMilestone.isPending}
                                  title={`Currently in ${STAGE_NAMES[s]} — click to remove`}
                                  className={`h-5 min-w-[20px] px-1 rounded-md font-mono text-[9px] font-bold border transition ${
                                    isThis ? "ring-1 ring-offset-1 ring-offset-background" : ""
                                  }`}
                                  style={{
                                          background: `hsl(var(--stage-${s}))`,
                                          borderColor: `hsl(var(--stage-${s}))`,
                                          color: "hsl(var(--background))",
                                          ...(isThis ? { ['--tw-ring-color' as any]: `hsl(var(--stage-${s}))` } : {}),
                                        }}
                                >
                                  {STAGE_SHORT[s]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateMilestone.mutate({ memberId: m.id, target: stage, action: "remove", current: m });
                          }}
                          disabled={updateMilestone.isPending}
                          title={`Remove from ${STAGE_NAMES[stage]}`}
                          className="shrink-0 h-7 w-7 rounded-full border border-border/60 bg-background/60 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/60 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {here > visiblePeople.length && (
                    <div className="text-center text-xs text-muted-foreground italic pt-3 border-t border-dashed border-border/40">
                      + {here - visiblePeople.length} more · refine the filter at the top of the dashboard to narrow this list.
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Coaching */}
            <section className="rounded-xl border-l-4 border-accent bg-accent/5 p-4">
              <div className="font-mono text-[10px] tracking-widest text-accent font-bold mb-2">→ {coaching.label.toUpperCase()}</div>
              <p className="text-sm text-foreground leading-relaxed">{coaching.body}</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}