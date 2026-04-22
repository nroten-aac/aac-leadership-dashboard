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
    {/* soft halo behind the cross */}
    <circle cx="24" cy="24" r="17" opacity="0.25" strokeDasharray="2 3" />
    {/* cross — vertical beam */}
    <path
      d="M21 8h6v10h10v6H27v16h-6V24H11v-6h10z"
      fill="currentColor"
      fillOpacity="0.35"
      strokeLinejoin="round"
    />
    {/* highlight along the cross for depth */}
    <path d="M24 9v30" opacity="0.9" />
    <path d="M12 21h24" opacity="0.9" />
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
    {/* book spine shadow */}
    <path d="M24 16v26" opacity="0.5" />
    {/* left page — curved like an open book */}
    <path
      d="M24 16c-4-3-10-4-16-3v23c6-1 12 0 16 3z"
      fill="currentColor"
      fillOpacity="0.18"
    />
    {/* right page */}
    <path
      d="M24 16c4-3 10-4 16-3v23c-6-1-12 0-16 3z"
      fill="currentColor"
      fillOpacity="0.18"
    />
    {/* page lines (text) */}
    <path d="M11 22c3-0.5 6-0.5 9 0" opacity="0.55" strokeWidth="1.3" />
    <path d="M11 27c3-0.5 6-0.5 9 0" opacity="0.45" strokeWidth="1.3" />
    <path d="M11 32c3-0.5 6-0.5 9 0" opacity="0.35" strokeWidth="1.3" />
    <path d="M28 22c3-0.5 6-0.5 9 0" opacity="0.55" strokeWidth="1.3" />
    <path d="M28 27c3-0.5 6-0.5 9 0" opacity="0.45" strokeWidth="1.3" />
    <path d="M28 32c3-0.5 6-0.5 9 0" opacity="0.35" strokeWidth="1.3" />
    {/* bookmark ribbon */}
    <path d="M24 16v6l2-1.5L28 22v-6" fill="currentColor" fillOpacity="0.6" />
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
    {/* small spark trails from center to side flames */}
    <path d="M17 26c-2 1-4 2-5 4" opacity="0.55" strokeDasharray="1.5 2" />
    <path d="M31 26c2 1 4 2 5 4" opacity="0.55" strokeDasharray="1.5 2" />
    {/* left flame — tall, flickering */}
    <path
      d="M9 44c3 0 6-2 6-6 0-3-2-4-3-7-1 2-2 3-3 5-0.5-1-1-2-2-2-1 2-2 4-2 6 0 3 2 4 4 4z"
      fill="currentColor"
      fillOpacity="0.75"
    />
    {/* left inner highlight */}
    <path
      d="M10 42c1.5 0 3-1 3-3 0-1.5-1-2-1.5-3.5-0.5 1-1.5 2-1.5 3.5 0 1 0 2.5 0 3z"
      fill="currentColor"
      fillOpacity="0.4"
      stroke="none"
    />
    {/* right flame — tall, flickering */}
    <path
      d="M39 44c-3 0-6-2-6-6 0-3 2-4 3-7 1 2 2 3 3 5 0.5-1 1-2 2-2 1 2 2 4 2 6 0 3-2 4-4 4z"
      fill="currentColor"
      fillOpacity="0.75"
    />
    {/* right inner highlight */}
    <path
      d="M38 42c-1.5 0-3-1-3-3 0-1.5 1-2 1.5-3.5 0.5 1 1.5 2 1.5 3.5 0 1 0 2.5 0 3z"
      fill="currentColor"
      fillOpacity="0.4"
      stroke="none"
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
