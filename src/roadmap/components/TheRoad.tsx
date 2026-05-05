import { Stage, STAGE_NAMES } from "../types";
import {
  ConnectingIcon,
  BelongingIcon,
  MaturingIcon,
  MinisteringIcon,
  MultiplyingIcon,
} from "@/components/icons/StageIcons";
import type { ComponentType, SVGProps } from "react";

interface RoadProps {
  counts: Record<Stage, number>;
  total: number;
  onStageClick?: (stage: Stage) => void;
}

// Each stage is a milestone pin along a curved path that climbs valley → summit.
const STAGES: Array<{ key: Stage; x: number; y: number; color: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = [
  { key: "connect",  x: 90,  y: 320, color: "hsl(var(--stage-connect))",  Icon: ConnectingIcon },
  { key: "belong",   x: 290, y: 270, color: "hsl(var(--stage-belong))",   Icon: BelongingIcon },
  { key: "mature",   x: 490, y: 200, color: "hsl(var(--stage-mature))",   Icon: MaturingIcon },
  { key: "minister", x: 690, y: 130, color: "hsl(var(--stage-minister))", Icon: MinisteringIcon },
  { key: "multiply", x: 890, y: 70,  color: "hsl(var(--stage-multiply))", Icon: MultiplyingIcon },
];

const PATH_D = "M 30 360 C 150 360, 200 320, 290 290 S 430 220, 490 200 S 630 150, 690 130 S 830 90, 920 50";

export default function TheRoad({ counts, total, onStageClick }: RoadProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-background p-6 shadow-card">
      <div className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-1">The Road · Live</div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Every soul's road — from <em className="font-serif-italic text-secondary">Connecting</em> to <em className="font-serif-italic text-accent">Multiplying</em>.
          </h3>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full border border-border bg-card/80 px-3 py-1 font-mono text-xs text-muted-foreground">{total} total</span>
        </div>
      </div>

      <svg viewBox="0 0 950 400" className="w-full h-auto" role="img" aria-label="The discipleship road from Connecting to Multiplying">
        {/* Subtle valley → summit ground */}
        <defs>
          <linearGradient id="road-glow" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--stage-connect))" stopOpacity="0.05" />
            <stop offset="100%" stopColor="hsl(var(--stage-multiply))" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="road-base" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(var(--prussian))" />
            <stop offset="100%" stopColor="hsl(var(--sky))" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="950" height="400" fill="url(#road-glow)" />

        {/* Star above summit */}
        <path d="M895 25 l4 8 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 l9 -1 z"
          fill="hsl(var(--accent))" opacity="0.95" />

        {/* The road */}
        <path d={PATH_D} stroke="url(#road-base)" strokeWidth="22" fill="none" strokeLinecap="round" opacity="0.55" />
        <path d={PATH_D} stroke="hsl(var(--accent))" strokeWidth="2.4" fill="none" strokeLinecap="round"
          strokeDasharray="10 14" className="road-dashed" opacity="0.85" />

        {STAGES.map((s) => {
          const count = counts[s.key] || 0;
          const pct = total ? ((count / total) * 100).toFixed(1) : "0.0";
          const isMultiply = s.key === "multiply";
          const Icon = s.Icon;
          return (
            <g key={s.key} className="cursor-pointer" onClick={() => onStageClick?.(s.key)}>
              <circle cx={s.x} cy={s.y} r="32" fill="hsl(var(--background))" stroke={s.color} strokeWidth="2.5"
                className={isMultiply ? "drop-shadow-[0_0_18px_hsl(var(--accent)/0.6)]" : ""} />
              <g transform={`translate(${s.x - 18}, ${s.y - 18})`} style={{ color: s.color }}>
                <Icon width={36} height={36} />
              </g>
              {/* count badge */}
              <circle cx={s.x + 24} cy={s.y - 24} r="11" fill={isMultiply ? "hsl(var(--accent))" : "hsl(var(--card))"} stroke={s.color} strokeWidth="1.5" />
              <text x={s.x + 24} y={s.y - 21} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10"
                fill={isMultiply ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))"} fontWeight="700">{count}</text>
              {/* label card */}
              <rect x={s.x - 48} y={s.y + 44} width="96" height="34" rx="6"
                fill="hsl(var(--card))" stroke="hsl(var(--border))" />
              <text x={s.x} y={s.y + 58} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9"
                letterSpacing="2" fill={s.color} fontWeight="700">{STAGE_NAMES[s.key].toUpperCase()}</text>
              <text x={s.x} y={s.y + 71} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9"
                fill="hsl(var(--muted-foreground))">{pct}% · {count} here</text>
            </g>
          );
        })}
      </svg>

      <p className="mt-4 text-sm text-muted-foreground">
        <span className="text-accent font-medium">Click any milestone</span> to see who's there and how they're engaging.
      </p>
    </div>
  );
}
