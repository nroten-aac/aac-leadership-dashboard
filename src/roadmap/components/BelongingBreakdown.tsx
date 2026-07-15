import { useMemo, useState } from "react";
import { type MemberStatus } from "../hooks/useRoadmapData";
import BelongingMatrixDialog from "./BelongingMatrixDialog";

const MEMBER_COLOR = "hsl(199 89% 60%)";
const REGULAR_COLOR = "hsl(258 80% 72%)";
const RING = "hsl(280 85% 68%)";

function isInRhythm(m: any) {
  const rs = Array.isArray(m.rhythms) ? m.rhythms : [];
  return rs.length > 0 || m.phase === "rhythms";
}

function Dot({
  color,
  dashed,
  ring,
}: {
  color: string;
  dashed?: boolean;
  ring?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="inline-block h-3 w-3 rounded-full shrink-0"
      style={{
        background: dashed ? "transparent" : color,
        border: dashed ? `1.5px dashed ${color}` : `1.5px solid ${color}`,
        boxShadow: ring
          ? `0 0 0 2px hsl(var(--background)), 0 0 0 3.5px ${RING}`
          : undefined,
      }}
    />
  );
}

export default function BelongingBreakdown({
  familyMembers,
  statusByMember,
}: {
  familyMembers: any[];
  statusByMember: Map<string, MemberStatus>;
}) {
  const [openMatrix, setOpenMatrix] = useState(false);

  const buckets = useMemo(() => {
    const members: any[] = [];
    const regulars: any[] = [];
    familyMembers.forEach((m) => {
      const s = statusByMember.get(m.id);
      if (s === "member") members.push(m);
      else if (s === "regular") regulars.push(m);
    });
    return {
      membersInRhythm: members.filter(isInRhythm),
      membersNoRhythm: members.filter((m) => !isInRhythm(m)),
      regularsInRhythm: regulars.filter(isInRhythm),
      regularsNoRhythm: regulars.filter((m) => !isInRhythm(m)),
    };
  }, [familyMembers, statusByMember]);

  const Lane = ({
    label,
    color,
    inRhythm,
    noRhythm,
    ringForInRhythm,
    moveHint,
  }: {
    label: string;
    color: string;
    inRhythm: any[];
    noRhythm: any[];
    ringForInRhythm?: boolean;
    moveHint: string;
  }) => {
    const total = inRhythm.length + noRhythm.length;
    return (
      <div className="rounded-xl border border-border/50 bg-background/40 p-3">
        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {label}{" "}
            <span className="text-foreground/80">· {total}</span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">{moveHint}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {inRhythm.map((m) => (
            <Dot key={m.id} color={color} ring={ringForInRhythm} />
          ))}
          {noRhythm.map((m) => (
            <Dot key={`d-${m.id}`} color={color} dashed />
          ))}
          {total === 0 && (
            <span className="font-mono text-[10px] text-muted-foreground/70">
              No one here yet.
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-card to-background p-6 shadow-card">
      <div className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-1">Belonging · Who's here</div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Two lanes, <em className="font-serif-italic text-accent">one doorway away.</em>
          </h3>
        </div>
        <button
          onClick={() => setOpenMatrix(true)}
          className="rounded-full border border-accent/50 bg-accent/10 text-accent px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:bg-accent/20 transition"
        >
          Open Belonging matrix →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Lane
          label="Members"
          color={MEMBER_COLOR}
          inRhythm={buckets.membersInRhythm}
          noRhythm={buckets.membersNoRhythm}
          moveHint="Dashed = activate into a rhythm"
        />
        <Lane
          label="Regular Attenders"
          color={REGULAR_COLOR}
          inRhythm={buckets.regularsInRhythm}
          noRhythm={buckets.regularsNoRhythm}
          ringForInRhythm
          moveHint="Ring = invite to membership · Dashed = deepen connection"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Dot color={MEMBER_COLOR} /> Member · in a rhythm
        </span>
        <span className="inline-flex items-center gap-2">
          <Dot color={MEMBER_COLOR} dashed /> Member · needs a rhythm
        </span>
        <span className="inline-flex items-center gap-2">
          <Dot color={REGULAR_COLOR} ring /> Regular · in a rhythm (invite to membership)
        </span>
        <span className="inline-flex items-center gap-2">
          <Dot color={REGULAR_COLOR} dashed /> Regular · no rhythm yet
        </span>
      </div>

      <BelongingMatrixDialog
        open={openMatrix}
        onClose={() => setOpenMatrix(false)}
        buckets={buckets}
      />
    </div>
  );
}