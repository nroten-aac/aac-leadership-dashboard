import { useMemo, useState } from "react";
import TheRoad from "../components/TheRoad";
import StatBlock from "../components/StatBlock";
import EngagementMatrix from "../components/EngagementMatrix";
import StageDetailDialog from "../components/StageDetailDialog";
import BelongingBreakdown from "../components/BelongingBreakdown";
import {
  useMembers,
  useActivityEvents,
  useMemberStatuses,
  type MemberStatus,
} from "../hooks/useRoadmapData";
import { useTaggedMemberIds } from "../hooks/useTaggedMembers";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { Stage } from "../types";

const STATUS_FILTERS: { key: MemberStatus; label: string; color: string }[] = [
  { key: "member",  label: "Members",           color: "hsl(199 89% 60%)" },
  { key: "regular", label: "Regular Attenders", color: "hsl(258 80% 72%)" },
  { key: "visitor", label: "Visitors",          color: "hsl(38 92% 60%)"  },
];

export default function DashboardTab() {
  const { data: members = [] } = useMembers();
  const { data: events = [] } = useActivityEvents(200);
  const { pcoListCounts } = useDashboardData();
  const { data: taggedIds } = useTaggedMemberIds();
  const { data: statusByMember } = useMemberStatuses();
  const [openStage, setOpenStage] = useState<Stage | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<MemberStatus>>(
    () => new Set(["member", "regular", "visitor"])
  );

  const scopedMembers = useMemo(
    () => (taggedIds ? members.filter((m: any) => taggedIds.has(m.id)) : members),
    [members, taggedIds]
  );

  // Only count people categorized as Member / Regular Attender / Visitor — and
  // honor whichever statuses the user has enabled at the top of the page.
  const familyMembers = useMemo(() => {
    if (!statusByMember) return [] as any[];
    return scopedMembers.filter((m: any) => {
      const s = statusByMember.get(m.id);
      return !!s && statusFilter.has(s);
    });
  }, [scopedMembers, statusByMember, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<Stage, number> = { connect: 0, belong: 0, mature: 0, minister: 0, multiply: 0 };
    familyMembers.forEach((m: any) => {
      const phase = (m.phase || "connecting") as string;
      if (phase === "connecting") c.connect++;
      else if (phase === "belonging") c.belong++;
      else {
        const rs: string[] = Array.isArray(m.rhythms) ? m.rhythms : [];
        if (rs.includes("maturing")) c.mature++;
        if (rs.includes("ministering")) c.minister++;
        if (rs.includes("multiplying")) c.multiply++;
      }
    });
    return c;
  }, [familyMembers]);

  // From the PCO source-of-truth lists (synced via fetch-pco-list-counts)
  const family = pcoListCounts
    ? (pcoListCounts["Member Adults"] || 0)
      + (pcoListCounts["Member Children"] || 0)
      + (pcoListCounts["Regular Attender Adults"] || 0)
      + (pcoListCounts["Regular Attender Children"] || 0)
    : null;
  // "Exploring connection" = PCO Visitors list (source of truth)
  const exploring = pcoListCounts ? (pcoListCounts["Visitors"] || 0) : null;
  const total = familyMembers.length;
  const stillOnRoad = total - counts.multiply;
  const moves30d = events.filter((e) => e.type === "stage-move" && Date.now() - e.ts < 30 * 86400000).length;
  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();

  const toggleStatus = (key: MemberStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-12">
      <section>
        <div className="eyebrow mb-3">— Snapshot · {month}</div>
        <h1 className="font-display text-5xl md:text-6xl font-black leading-[1.05] text-foreground max-w-4xl">
          A church <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">on the pathway</em><br />
          from Connecting to Multiplying.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-2xl">
          Every disciple at Ashe Alliance is somewhere on this pathway to becoming a fully formed disciple. The point isn't where they are today — it's whether they're moving.
        </p>
      </section>

      {/* Family filter — restricts every count, milestone, and popup below. */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
        <span className="eyebrow text-[10px] mr-1">Include</span>
        {STATUS_FILTERS.map((s) => {
          const on = statusFilter.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleStatus(s.key)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                on ? "border-transparent text-background" : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
              }`}
              style={on ? { background: s.color, color: "hsl(var(--background))" } : { color: s.color }}
            >
              {s.label}
            </button>
          );
        })}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {familyMembers.length} people in view
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        <StatBlock value={exploring ?? "—"} label="People exploring connection" />
        <StatBlock value={family ?? "—"} label="Members + regular attenders" />
        <StatBlock value={moves30d} label="Stage changes · last 30 days" />
        <StatBlock value={counts.multiply} label="Multiplying disciples" gold />
        <StatBlock value={stillOnRoad} label="Still on the pathway" />
      </div>

      <section>
        <div className="eyebrow mb-3">— The Journey</div>
        <h2 className="font-display text-4xl font-bold text-foreground mb-2">
          Five stages, <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">one direction.</em>
        </h2>
        <p className="text-muted-foreground mb-8 max-w-3xl">
          The pipeline isn't a funnel — it's a pathway to becoming a fully formed disciple. Connecting → Belonging → Maturing → Ministering → Multiplying. Track movement, not attendance.
        </p>
        <TheRoad counts={counts} total={total} onStageClick={setOpenStage} />
      </section>

      <section>
        <BelongingBreakdown
          familyMembers={familyMembers}
          statusByMember={statusByMember ?? new Map()}
        />
      </section>

      <section>
        <EngagementMatrix />
      </section>

      <StageDetailDialog
        stage={openStage}
        onClose={() => setOpenStage(null)}
        members={familyMembers}
        statusByMember={statusByMember ?? new Map()}
      />
    </div>
  );
}
