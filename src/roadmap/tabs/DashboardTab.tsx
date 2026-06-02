import { useMemo, useState } from "react";
import TheRoad from "../components/TheRoad";
import StatBlock from "../components/StatBlock";
import EngagementMatrix from "../components/EngagementMatrix";
import StageDetailDialog from "../components/StageDetailDialog";
import { useMembers, useActivityEvents, dbStageToRoadmap } from "../hooks/useRoadmapData";
import { useTaggedMemberIds } from "../hooks/useTaggedMembers";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { Stage } from "../types";

export default function DashboardTab() {
  const { data: members = [] } = useMembers();
  const { data: events = [] } = useActivityEvents(200);
  const { pcoListCounts } = useDashboardData();
  const { data: taggedIds } = useTaggedMemberIds();
  const [openStage, setOpenStage] = useState<Stage | null>(null);

  const scopedMembers = useMemo(
    () => (taggedIds ? members.filter((m: any) => taggedIds.has(m.id)) : members),
    [members, taggedIds]
  );

  const counts = useMemo(() => {
    const c: Record<Stage, number> = { connect: 0, belong: 0, mature: 0, minister: 0, multiply: 0 };
    scopedMembers.forEach((m: any) => {
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
  }, [scopedMembers]);

  // From the PCO source-of-truth lists (synced via fetch-pco-list-counts)
  const family = pcoListCounts
    ? (pcoListCounts["Member Adults"] || 0)
      + (pcoListCounts["Member Children"] || 0)
      + (pcoListCounts["Regular Attender Adults"] || 0)
      + (pcoListCounts["Regular Attender Children"] || 0)
    : null;
  // "Exploring connection" = PCO Visitors list (source of truth)
  const exploring = pcoListCounts ? (pcoListCounts["Visitors"] || 0) : null;
  const total = scopedMembers.length;
  const stillOnRoad = total - counts.multiply;
  const moves30d = events.filter((e) => e.type === "stage-move" && Date.now() - e.ts < 30 * 86400000).length;
  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-12">
      <section>
        <div className="eyebrow mb-3">— Snapshot · {month}</div>
        <h1 className="font-display text-5xl md:text-6xl font-black leading-[1.05] text-foreground max-w-4xl">
          A church <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">on the road</em><br />
          from Connecting to Multiplying.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-2xl">
          Every disciple at Ashe Alliance is somewhere on this road. The point isn't where they are today — it's whether they're moving.
        </p>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        <StatBlock value={exploring ?? "—"} label="People exploring connection" />
        <StatBlock value={family ?? "—"} label="Members + regular attenders" />
        <StatBlock value={moves30d} label="Stage changes · last 30 days" />
        <StatBlock value={counts.multiply} label="Multiplying disciples" gold />
        <StatBlock value={stillOnRoad} label="Still on the road" />
      </div>

      <section>
        <div className="eyebrow mb-3">— The Journey</div>
        <h2 className="font-display text-4xl font-bold text-foreground mb-2">
          Five stages, <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">one direction.</em>
        </h2>
        <p className="text-muted-foreground mb-8 max-w-3xl">
          The pipeline isn't a funnel — it's a road. Connecting → Belonging → Maturing → Ministering → Multiplying. Track movement, not attendance.
        </p>
        <TheRoad counts={counts} total={total} onStageClick={setOpenStage} />
      </section>

      <section>
        <EngagementMatrix />
      </section>

      <StageDetailDialog stage={openStage} onClose={() => setOpenStage(null)} />
    </div>
  );
}
