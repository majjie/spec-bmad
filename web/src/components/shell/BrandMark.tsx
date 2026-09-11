import { useId } from "react";

interface BrandMarkProps {
  size?: number;
}

/**
 * Spec-browser mark: a rounded window with amber chrome, not a flat accent square.
 */
export default function BrandMark({ size = 28 }: BrandMarkProps) {
  const clipId = useId();

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
          <rect x="2.25" y="3.25" width="27.5" height="25.5" rx="8" />
        </clipPath>
      </defs>
      <rect
        x="2.25"
        y="3.25"
        width="27.5"
        height="25.5"
        rx="8"
        fill="var(--color-bg-subtle)"
        stroke="var(--color-border-default)"
        strokeWidth="1.5"
      />
      <g clipPath={`url(#${clipId})`}>
        <rect x="2.25" y="3.25" width="27.5" height="8.75" fill="var(--color-accent)" />
      </g>
      <circle cx="8.5" cy="7.5" r="1.35" fill="var(--color-bg-canvas)" />
      <circle cx="13" cy="7.5" r="1.35" fill="var(--color-bg-canvas)" opacity="0.55" />
      <circle cx="17.5" cy="7.5" r="1.35" fill="var(--color-bg-canvas)" opacity="0.32" />
      <rect x="7" y="16" width="11" height="2" rx="1" fill="var(--color-text-muted)" />
      <rect x="7" y="21.25" width="17" height="2" rx="1" fill="var(--color-text-subtle)" />
    </svg>
  );
}
