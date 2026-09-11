import { useId } from "react";

interface BrandMarkProps {
  size?: number;
}

/**
 * Spec-browser mark: a bound document with an amber spine, not a flat accent square.
 */
export default function BrandMark({ size = 32 }: BrandMarkProps) {
  const clipId = `brand-mark-${useId().replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="3" y="3" width="26" height="26" rx="8" />
        </clipPath>
      </defs>
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="8"
        fill="var(--color-bg-subtle)"
        stroke="var(--color-border-default)"
        strokeWidth="1.5"
      />
      <g clipPath={`url(#${clipId})`}>
        <rect x="3" y="3" width="7" height="26" fill="var(--color-accent)" />
      </g>
      <rect x="14" y="11" width="10" height="2.25" rx="1.125" fill="var(--color-text-muted)" />
      <rect x="14" y="16.25" width="13" height="2.25" rx="1.125" fill="var(--color-text-muted)" />
      <rect x="14" y="21.5" width="8" height="2.25" rx="1.125" fill="var(--color-text-subtle)" />
    </svg>
  );
}
