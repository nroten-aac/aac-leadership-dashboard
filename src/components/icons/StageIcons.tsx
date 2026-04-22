import { SVGProps } from "react";

/**
 * Stage icons for the discipleship pipeline. Each is designed to read at 28-40px,
 * uses currentColor for stroke + accent fill, and tells a small story:
 *
 *  1. Connecting   — a hand reaching toward a spark (in orbit, not yet committed)
 *  2. Belonging    — a dove over water (faith, baptism, joining the family)
 *  3. Maturing     — a sapling growing from an open book (Scripture, growth)
 *  4. Ministering  — interlocking hands (serving with gifts inside the church)
 *  5. Multiplying  — a flame igniting two more flames (sending, reproducing)
 */

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

const baseProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ConnectingIcon = ({ title, ...props }: IconProps) => (
  <svg {...baseProps} {...props}>
    {title && <title>{title}</title>}
    {/* outer orbit */}
    <ellipse cx="24" cy="24" rx="18" ry="9" opacity="0.35" strokeDasharray="2 3" />
    {/* hand reaching */}
    <path d="M14 30v-5a2 2 0 0 1 4 0v3" />
    <path d="M18 28v-7a2 2 0 0 1 4 0v6" />
    <path d="M22 27v-5a2 2 0 0 1 4 0v6" />
    <path d="M26 28v-3a2 2 0 0 1 4 0v6c0 3-2 5-5 5h-3c-2 0-4-1-5-3l-3-5" />
    {/* spark / star they're reaching toward */}
    <path d="M34 14l1.2 2.8L38 18l-2.8 1.2L34 22l-1.2-2.8L30 18l2.8-1.2z" fill="currentColor" stroke="none" opacity="0.85" />
  </svg>
);

export const BelongingIcon = ({ title, ...props }: IconProps) => (
  <svg {...baseProps} {...props}>
    {title && <title>{title}</title>}
    {/* baptism water ripples */}
    <path d="M6 36c2-1 4-1 6 0s4 1 6 0 4-1 6 0 4 1 6 0 4-1 6 0" />
    <path d="M6 40c2-1 4-1 6 0s4 1 6 0 4-1 6 0 4 1 6 0 4-1 6 0" opacity="0.5" />
    {/* dove */}
    <path d="M30 16c-3 0-6 2-7 5l-7-1 5 4-3 5 7-2c1 3 4 5 7 5 4 0 8-3 8-8s-4-8-10-8z" fill="currentColor" fillOpacity="0.18" />
    <circle cx="36" cy="20" r="0.9" fill="currentColor" stroke="none" />
    {/* light beam from above */}
    <path d="M28 4l-2 6M34 4l0 6M40 4l2 6" opacity="0.55" />
  </svg>
);

export const MaturingIcon = ({ title, ...props }: IconProps) => (
  <svg {...baseProps} {...props}>
    {title && <title>{title}</title>}
    {/* open book */}
    <path d="M6 34c4-2 9-2 12 0V18c-3-2-8-2-12 0z" fill="currentColor" fillOpacity="0.15" />
    <path d="M30 34c3-2 8-2 12 0V18c-4-2-9-2-12 0z" fill="currentColor" fillOpacity="0.15" />
    <path d="M18 18c3-2 9-2 12 0v16c-3-2-9-2-12 0z" fill="currentColor" fillOpacity="0.06" />
    {/* sapling growing up out of the book */}
    <path d="M24 18V8" />
    <path d="M24 12c-3 0-5-2-5-4 3 0 5 2 5 4z" fill="currentColor" fillOpacity="0.5" />
    <path d="M24 14c3 0 5-2 5-4-3 0-5 2-5 4z" fill="currentColor" fillOpacity="0.5" />
  </svg>
);

export const MinisteringIcon = ({ title, ...props }: IconProps) => (
  <svg {...baseProps} {...props}>
    {title && <title>{title}</title>}
    {/* heart (gift / love) above */}
    <path d="M24 14c-2-3-7-3-7 1 0 3 4 6 7 8 3-2 7-5 7-8 0-4-5-4-7-1z" fill="currentColor" fillOpacity="0.25" />
    {/* two interlocking hands */}
    <path d="M8 36l4-6c1-2 3-2 4 0l3 4" />
    <path d="M19 34l-3-3c-1-1-1-3 1-3l5 1" />
    <path d="M40 36l-4-6c-1-2-3-2-4 0l-3 4" />
    <path d="M29 34l3-3c1-1 1-3-1-3l-5 1" />
    {/* clasp point */}
    <circle cx="24" cy="32" r="2.5" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

export const MultiplyingIcon = ({ title, ...props }: IconProps) => (
  <svg {...baseProps} {...props}>
    {title && <title>{title}</title>}
    {/* center flame (large) */}
    <path
      d="M24 6c2 5 7 7 7 13a7 7 0 0 1-14 0c0-3 2-5 3-8 1 2 3 3 4 5 0-4-1-7 0-10z"
      fill="currentColor"
      fillOpacity="0.4"
    />
    {/* arrows to two side flames (sending) */}
    <path d="M16 28l-6 4M32 28l6 4" opacity="0.7" />
    <path d="M10 32l3-1M10 32l1-3" opacity="0.7" />
    <path d="M38 32l-3-1M38 32l-1-3" opacity="0.7" />
    {/* two smaller side flames */}
    <path
      d="M8 42c1-2 3-3 3-6a3 3 0 0 0-6 0c0 3 2 4 3 6z"
      fill="currentColor"
      fillOpacity="0.7"
    />
    <path
      d="M40 42c1-2 3-3 3-6a3 3 0 0 0-6 0c0 3 2 4 3 6z"
      fill="currentColor"
      fillOpacity="0.7"
    />
  </svg>
);

export const STAGE_ICONS = {
  connecting: ConnectingIcon,
  belonging: BelongingIcon,
  maturing: MaturingIcon,
  ministering: MinisteringIcon,
  multiplying: MultiplyingIcon,
} as const;

export type StageIconKey = keyof typeof STAGE_ICONS;
