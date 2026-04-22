import { SVGProps } from "react";

/**
 * Simple sheep glyph for the Shepherding tab.
 * Stroked + filled head with a fluffy body, designed to read at 20px.
 */
const SheepIcon = ({
  className,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* fluffy body */}
    <path d="M5.5 14.5a2.5 2.5 0 0 1 1.2-4.7 3 3 0 0 1 5.6-1.4 3 3 0 0 1 5.4 1.6 2.5 2.5 0 0 1 .8 4.7" />
    {/* belly line */}
    <path d="M6.5 14.5h11.5" />
    {/* legs */}
    <path d="M8 15v3" />
    <path d="M11 15v3" />
    <path d="M14 15v3" />
    <path d="M17 15v3" />
    {/* head */}
    <ellipse cx="6.2" cy="11.8" rx="2" ry="2.4" />
    {/* ear */}
    <path d="M5 10.2c-.5-.2-1-.1-1.3.3" />
    {/* eye */}
    <circle cx="5.7" cy="11.6" r="0.4" fill="currentColor" stroke="none" />
  </svg>
);

export default SheepIcon;