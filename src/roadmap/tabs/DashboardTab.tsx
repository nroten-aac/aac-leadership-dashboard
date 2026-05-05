import { useMemo } from "react";
import TheRoad from "../components/TheRoad";
import StatBlock from "../components/StatBlock";
import EngagementMatrix from "../components/EngagementMatrix";
import { useMembers, useActivityEvents, dbStageToRoadmap } from "../hooks/useRoadmapData";
import type { Stage } from "../types";

export default function DashboardTab() {
  const { data: members = [] } = useMembers();
  const { data: events = [] } = useActivityEvents(200);

  const counts = useMemo(() => {
    const c: Record<Stage, number> = { connect: 0, belong: 0, mature: 0, minister: 0, multiply: 0 };
    members.forEach((m: any) => { c[dbStageToRoadmap(m.discipleship_stage)]++; });
    return c;
  }, [members]);

  const total = members.length;
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <StatBlock value={total} label="Souls in the family" />
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
        <TheRoad counts={counts} total={total} />
      </section>

      <section>
        <EngagementMatrix />
      </section>
    </div>
  );
}
