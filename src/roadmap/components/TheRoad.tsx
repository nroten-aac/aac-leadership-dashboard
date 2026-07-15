import { Stage, STAGE_NAMES } from "../types";
import {
  ConnectingIcon,
  BelongingIcon,
  MaturingIcon,
  MinisteringIcon,
  MultiplyingIcon,
} from "@/components/icons/StageIcons";

interface RoadProps {
  counts: Record<Stage, number>;
  total: number;
  onStageClick?: (stage: Stage) => void;
  belongingBuckets?: { memberCount: number; regularCount: number };
  onBelongingBucketClick?: (bucket: "member" | "regular") => void;
}

const MEMBER_COLOR = "hsl(199 89% 60%)";
const REGULAR_COLOR = "hsl(210 80% 40%)";

export default function TheRoad({
  counts,
  total,
  onStageClick,
  belongingBuckets,
  onBelongingBucketClick,
}: RoadProps) {
  // Doorway milestones (linear, crossed once) — Belonging is rendered separately as two interlocking circles.
  const thresholds = [
    { key: "connect" as Stage, x: 200, y: 240, color: "hsl(var(--stage-connect))", Icon: ConnectingIcon, num: "01", sub: "Outside Christ → in Christ → baptized" },
  ];

  // Belonging — two vertically interlocking circles: Members (top) + Regular Attenders (bottom)
  const belCx = 560;
  const belCy = 240;
  const belR = 44;
  const memY = belCy - 30;
  const regY = belCy + 30;
  const memCount = belongingBuckets?.memberCount ?? counts.belong ?? 0;
  const regCount = belongingBuckets?.regularCount ?? 0;

  // Venn rhythms (simultaneous, lifelong) — centered around (920, 260)
  const vcx = 920, vcy = 260, vr = 78;
  // Icons are pushed outward from the venn center by `iconOffset` so they
  // don't crowd the shared center where the cross lives.
  const iconOffset = 34;
  const offset = (cx: number, cy: number) => {
    const dx = cx - vcx, dy = cy - vcy;
    const len = Math.hypot(dx, dy) || 1;
    return { ix: cx + (dx / len) * iconOffset, iy: cy + (dy / len) * iconOffset };
  };
  const rhythms = [
    { key: "minister" as Stage, cx: vcx,      cy: vcy - 44, color: "hsl(var(--stage-minister))", Icon: MinisteringIcon, label: "Ministering", sub: "Serving using spiritual gifts.",  labelY: vcy - 150 },
    { key: "mature"   as Stage, cx: vcx - 56, cy: vcy + 30, color: "hsl(var(--stage-mature))",   Icon: MaturingIcon,    label: "Maturing",    sub: "Growing in Christ.", labelY: vcy + 160, labelX: vcx - 90 },
    { key: "multiply" as Stage, cx: vcx + 56, cy: vcy + 30, color: "hsl(var(--stage-multiply))", Icon: MultiplyingIcon, label: "Multiplying", sub: "Making disciples.",  labelY: vcy + 160, labelX: vcx + 90 },
  ].map((r) => ({ ...r, ...offset(r.cx, r.cy) }));

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-background p-6 shadow-card">
      <div className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-1">The Pathway · Live</div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Two doorways, crossed once. <em className="font-serif-italic text-accent">Three rhythms, lived forever.</em>
          </h3>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full border border-border bg-card/80 px-3 py-1 font-mono text-xs text-muted-foreground">{total} total</span>
        </div>
      </div>

      <svg viewBox="0 0 1180 520" className="w-full h-auto" role="img" aria-label="Two doorways and three rhythms of discipleship">
        <defs>
          <marker id="arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--accent))" />
          </marker>
        </defs>

        {/* Section headers */}
        <text x="320" y="50" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" letterSpacing="3" fontWeight="700" fill="hsl(var(--accent))">TWO DOORWAYS — CROSSED ONCE</text>
        <text x="920" y="50" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" letterSpacing="3" fontWeight="700" fill="hsl(var(--accent))">THREE RHYTHMS — LIFELONG</text>

        {/* Dashed connector across thresholds, arrow into rhythms */}
        <path d="M 90 240 L 760 240" stroke="hsl(var(--accent))" strokeWidth="1.8" strokeDasharray="6 8" fill="none" opacity="0.7" markerEnd="url(#arrow-end)" />

        {/* Two threshold dividers */}
        <line x1="380" y1="90" x2="380" y2="430" stroke="hsl(var(--accent))" strokeWidth="1" strokeDasharray="3 7" opacity="0.45" />
        <line x1="720" y1="90" x2="720" y2="430" stroke="hsl(var(--accent))" strokeWidth="1" strokeDasharray="3 7" opacity="0.45" />

        {/* Thresholds */}
        {thresholds.map((s) => {
          const count = counts[s.key] || 0;
          const Icon = s.Icon;
          return (
            <g key={s.key} className="cursor-pointer" onClick={() => onStageClick?.(s.key)}>
              <circle cx={s.x} cy={s.y} r="44" fill="hsl(var(--background))" stroke={s.color} strokeWidth="2" />
              <g transform={`translate(${s.x - 22}, ${s.y - 22})`} style={{ color: s.color }}>
                <Icon width={44} height={44} />
              </g>
              {/* count badge */}
              <circle cx={s.x - 34} cy={s.y - 34} r="13" fill="hsl(var(--card))" stroke={s.color} strokeWidth="1.5" />
              <text x={s.x - 34} y={s.y - 30} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="700" fill="hsl(var(--foreground))">{count}</text>
              {/* label */}
              <text x={s.x} y={s.y + 78} textAnchor="middle" fontFamily="Outfit, sans-serif" fontSize="20" fontWeight="700" fill="hsl(var(--foreground))">{STAGE_NAMES[s.key]}</text>
              <text x={s.x} y={s.y + 100} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="12" fill="hsl(var(--accent))">{s.sub}</text>
            </g>
          );
        })}

        {/* Belonging — two vertically interlocking circles */}
        <g>
          {/* Members circle (top) — solid outline */}
          <g className="cursor-pointer" onClick={() => onBelongingBucketClick?.("member")}>
            <title>Members — click to see who's here</title>
            <circle cx={belCx} cy={memY} r={belR}
              fill="hsl(var(--background))" fillOpacity="0.9"
              stroke={MEMBER_COLOR} strokeWidth="2.5" />
            <text x={belCx} y={memY - 8} textAnchor="middle"
              fontFamily="JetBrains Mono, monospace" fontSize="16" fontWeight="800" fill={MEMBER_COLOR}>
              {memCount}
            </text>
            <text x={belCx + belR + 12} y={memY + 4} textAnchor="start"
              fontFamily="Outfit, sans-serif" fontSize="12" fontWeight="700" fill="hsl(var(--foreground))">
              Members
            </text>
          </g>
          {/* Regulars circle (bottom) — dashed outline signals not-yet-committed */}
          <g className="cursor-pointer" onClick={() => onBelongingBucketClick?.("regular")}>
            <title>Regular Attenders — click to see who's here</title>
            <circle cx={belCx} cy={regY} r={belR}
              fill="hsl(var(--background))" fillOpacity="0.9"
              stroke={REGULAR_COLOR} strokeWidth="2.5" strokeDasharray="5 4" />
            <text x={belCx} y={regY + 20} textAnchor="middle"
              fontFamily="JetBrains Mono, monospace" fontSize="16" fontWeight="800" fill={REGULAR_COLOR}>
              {regCount}
            </text>
            <text x={belCx + belR + 12} y={regY + 4} textAnchor="start"
              fontFamily="Outfit, sans-serif" fontSize="12" fontWeight="700" fill="hsl(var(--foreground))">
              Regulars
            </text>
          </g>
          {/* Shared belonging icon in the overlap */}
          <g transform={`translate(${belCx - 12}, ${belCy - 12})`} style={{ color: "hsl(var(--stage-belong))" }} pointerEvents="none">
            <BelongingIcon width={24} height={24} />
          </g>
          {/* number badge (02) — top-right of the pair */}
          <circle cx={belCx + belR + 22} cy={memY - belR + 6} r="14" fill="hsl(var(--accent))" />
          <text x={belCx + belR + 22} y={memY - belR + 10} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="800" fill="hsl(var(--accent-foreground))">02</text>
          {/* main label + subtitle */}
          <text x={belCx} y={belCy + 104} textAnchor="middle" fontFamily="Outfit, sans-serif" fontSize="20" fontWeight="700" fill="hsl(var(--foreground))">Belonging</text>
          <text x={belCx} y={belCy + 126} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="12" fill="hsl(var(--accent))">A two-way commitment — member ↔ church</text>
        </g>

        {/* Venn circles (rhythms) */}
        {rhythms.map((r) => (
          <circle key={`v-${r.key}`} cx={r.cx} cy={r.cy} r={vr}
            fill={r.color} fillOpacity="0.08"
            stroke={r.color} strokeWidth="1.6" opacity="0.95" />
        ))}

        {/* Rhythms — icons, counts, labels */}
        {rhythms.map((r) => {
          const count = counts[r.key] || 0;
          const Icon = r.Icon;
          const isMultiply = r.key === "multiply";
          const labelX = (r as any).labelX ?? r.cx;
          return (
            <g key={r.key} className="cursor-pointer" onClick={() => onStageClick?.(r.key)}>
              <g transform={`translate(${r.ix - 16}, ${r.iy - 16})`} style={{ color: r.color }}>
                <Icon width={32} height={32} />
              </g>
              {/* count badge */}
              <circle cx={r.ix + 18} cy={r.iy - 18} r="10"
                fill={isMultiply ? "hsl(var(--accent))" : "hsl(var(--card))"}
                stroke={r.color} strokeWidth="1.5" />
              <text x={r.ix + 18} y={r.iy - 14} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700"
                fill={isMultiply ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))"}>{count}</text>
              {/* label */}
              <text x={labelX} y={r.labelY} textAnchor="middle" fontFamily="Outfit, sans-serif" fontSize="18" fontWeight="700" fill="hsl(var(--foreground))">{r.label}</text>
              <text x={labelX} y={r.labelY + 20} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="12" fill="hsl(var(--accent))">{r.sub}</text>
            </g>
          );
        })}

        {/* Christ at the center — where all three rhythms meet */}
        <g transform={`translate(${vcx}, ${vcy})`}>
          <circle r="22" fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth="1.5"
            className="drop-shadow-[0_0_14px_hsl(var(--accent)/0.55)]" />
          {/* cross */}
          <path d="M-2.5 -13 h5 v9 h9 v5 h-9 v12 h-5 v-12 h-9 v-5 h9 z"
            fill="hsl(var(--accent))" />
        </g>
      </svg>

      <p className="mt-4 text-sm text-muted-foreground">
        <span className="text-accent font-medium">Click any stage</span> to see who's there and how they're engaging.
      </p>
    </div>
  );
}
