import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useMembers, dbStageToRoadmap } from "../hooks/useRoadmapData";
import { STAGE_NAMES, type Stage } from "../types";
import { STAGE_ICONS } from "@/components/icons/StageIcons";
import { Link } from "react-router-dom";

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
}

export default function StageDetailDialog({ stage, onClose }: Props) {
  const { data: members = [] } = useMembers();
  const { data: groups = [] } = useMemberGroups();

  if (!stage) return null;

  const Icon = STAGE_ICONS[STAGE_KEY_TO_DB[stage]];
  const stageMembers = members.filter((m: any) => dbStageToRoadmap(m.discipleship_stage) === stage);
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
  const visiblePeople = stageMembers.slice(0, 50);

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
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  {here} TOTAL AT THIS STAGE
                </div>
              </div>
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
                    return (
                      <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
                        {m.photo_url ? (
                          <img src={m.photo_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0" style={{ background: `${color}33`, color }}>
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-semibold text-sm text-foreground truncate">{m.first_name} {m.last_name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground truncate">{sub}</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {tags.slice(0, 3).map((t) => (
                            <span key={t} className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-border/60 bg-background/60 text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {here > visiblePeople.length && (
                    <div className="text-center text-xs text-muted-foreground italic pt-3 border-t border-dashed border-border/40">
                      + {here - visiblePeople.length} more synced from PCO ·{" "}
                      <Link to="/members/people" className="text-accent hover:underline" onClick={onClose}>See full list in People tab</Link>
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