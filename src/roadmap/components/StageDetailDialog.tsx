import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useMembers, dbStageToRoadmap } from "../hooks/useRoadmapData";
import { STAGE_NAMES, STAGE_DESC, type Stage } from "../types";
import { STAGE_ICONS } from "@/components/icons/StageIcons";
import { Link } from "react-router-dom";

const ENG_TYPES: Array<{ key: string; label: string; match: (g: string, t: string) => boolean }> = [
  { key: "LG", label: "Life Groups",         match: (g) => g === "Life Groups" },
  { key: "BS", label: "Bible Studies",       match: (g) => g.toLowerCase().includes("bible") },
  { key: "PT", label: "PT Mentorship",       match: (g) => g === "PT Mentorship" },
  { key: "DG", label: "Discipleship Groups", match: (g) => g === "Discipleship Groups" },
  { key: "SRV", label: "Serving",            match: (_g, t) => t === "volunteer" },
];

const STAGE_COACHING: Record<Stage, { label: string; body: string }> = {
  connect: {
    label: "Welcome them in",
    body: "Personal follow-up within 48 hours. Invite to a Life Group or first-step gathering. Goal: every guest is known by name within 3 visits.",
  },
  belong: {
    label: "Root them deep",
    body: "Pair with a Life Group leader. Walk through baptism + membership pathway. Goal: every belonger is in a weekly group within 60 days.",
  },
  mature: {
    label: "Move them forward",
    body: "PPP Conversation — discover Passion / Pain / Proficiency for each. Connect every soul to a serve team that matches their design. Goal: 100% have had a PPP conversation.",
  },
  minister: {
    label: "Multiply their impact",
    body: "Identify their disciple-making capacity. Pair with a PT mentor. Goal: every minister is intentionally pouring into 1–3 others.",
  },
  multiply: {
    label: "Send them out",
    body: "Champion their reproduction stories. Resource them for church planting, missions, or multi-generational discipleship. Celebrate publicly.",
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

  // Engagement counts for this stage
  const stageMemberIds = new Set(stageMembers.map((m: any) => m.id));
  const engCounts: Record<string, Set<string>> = {};
  ENG_TYPES.forEach((t) => (engCounts[t.key] = new Set()));
  groups.forEach((g: any) => {
    if (!stageMemberIds.has(g.member_id)) return;
    for (const t of ENG_TYPES) {
      if (t.match(g.group_name, g.group_type)) engCounts[t.key].add(g.member_id);
    }
  });

  // Per-member tags
  const tagsByMember = new Map<string, string[]>();
  groups.forEach((g: any) => {
    if (!stageMemberIds.has(g.member_id)) return;
    for (const t of ENG_TYPES) {
      if (t.match(g.group_name, g.group_type)) {
        const arr = tagsByMember.get(g.member_id) || [];
        if (!arr.includes(t.key)) arr.push(t.key);
        tagsByMember.set(g.member_id, arr);
      }
    }
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
            "{STAGE_DESC[stage]}."
          </p>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Engagement */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="eyebrow">— Engagement <span className="text-muted-foreground/70 normal-case tracking-normal italic ml-2">— synced from PCO</span></div>
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  {ENG_TYPES.filter((t) => engCounts[t.key].size > 0).length} TYPES TRACKED
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ENG_TYPES.map((t) => {
                  const v = engCounts[t.key].size;
                  if (v === 0) return null;
                  return (
                    <div key={t.key} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center font-mono text-[11px] font-bold" style={{ background: `${color}33`, color }}>
                        {t.key}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-semibold text-sm text-foreground truncate">{t.label}</div>
                        <div className="font-mono text-[11px] text-muted-foreground"><span className="text-foreground font-semibold">{v}</span> people</div>
                      </div>
                    </div>
                  );
                })}
                {ENG_TYPES.every((t) => engCounts[t.key].size === 0) && (
                  <div className="col-span-full text-center text-sm text-muted-foreground italic py-4">
                    No engagement data tracked at this stage yet.
                  </div>
                )}
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
                <p className="text-center text-sm text-muted-foreground italic py-6">No one is at this stage right now.</p>
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