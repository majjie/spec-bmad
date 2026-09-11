import type { ReactNode } from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import ExpandMore from "@mui/icons-material/ExpandMore";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: "block",
        px: 2,
        pt: 1.75,
        pb: 0.5,
        color: "var(--color-text-subtle)",
        letterSpacing: "0.14em",
        fontSize: "0.625rem",
      }}
    >
      {children}
    </Typography>
  );
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        px: 2,
        pl: 3.5,
        pt: 1.25,
        pb: 0.25,
        color: "var(--color-text-subtle)",
        fontWeight: 650,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontSize: "0.625rem",
        lineHeight: 1.3,
      }}
    >
      {children}
    </Typography>
  );
}

interface NavRowProps {
  label: string;
  secondary?: string;
  selected: boolean;
  onClick: () => void;
  depth?: 0 | 1 | 2;
  tourId?: string;
  icon?: ReactNode;
  ariaExpanded?: boolean;
  ariaControls?: string;
  id?: string;
}

const DEPTH_PL: Record<0 | 1 | 2, number> = { 0: 2, 1: 3.5, 2: 5 };

/** Full-bleed square nav row - no inset pills or curved side gaps. */
export function NavRow({
  label,
  secondary,
  selected,
  onClick,
  depth = 0,
  tourId,
  icon,
  ariaExpanded,
  ariaControls,
  id,
}: NavRowProps) {
  const isAccordion = ariaExpanded !== undefined;
  const open = ariaExpanded === true;

  return (
    <ListItemButton
      id={id}
      selected={selected}
      onClick={onClick}
      data-tour={tourId}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      sx={{
        mx: 0,
        mb: 0,
        py: isAccordion && depth === 0 ? 1 : 0.65,
        px: 2,
        pl: DEPTH_PL[depth],
        minHeight: isAccordion && depth === 0 ? 44 : 40,
        borderRadius: 0,
        alignItems: secondary ? "flex-start" : "center",
        color: selected ? "var(--color-text-default)" : "var(--color-text-muted)",
        "&:hover": {
          bgcolor: "var(--color-bg-hover)",
          color: "var(--color-text-default)",
        },
        "&.Mui-selected": {
          bgcolor: "var(--color-bg-subtle)",
          color: "var(--color-text-default)",
          boxShadow: "none",
          borderRadius: 0,
        },
        "&.Mui-selected:hover": {
          bgcolor: "var(--color-bg-hover)",
        },
      }}
    >
      {isAccordion && (
        <ExpandMore
          fontSize="small"
          aria-hidden
          sx={{
            mr: 0.75,
            mt: secondary ? 0.35 : 0,
            color: "var(--color-text-subtle)",
            flexShrink: 0,
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform var(--duration-fast) var(--ease-out)",
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          }}
        />
      )}
      {icon && (
        <ListItemIcon
          sx={{
            minWidth: 28,
            mt: secondary ? 0.25 : 0,
            color: selected ? "var(--color-accent)" : "var(--color-text-subtle)",
          }}
        >
          {icon}
        </ListItemIcon>
      )}
      <ListItemText
        primary={label}
        secondary={secondary}
        primaryTypographyProps={{
          fontWeight: isAccordion && depth === 0 ? 650 : selected ? 650 : 500,
          fontSize: isAccordion && depth === 0 ? "0.9375rem" : depth === 0 ? "0.875rem" : "0.8125rem",
          letterSpacing: isAccordion && depth === 0 ? "-0.015em" : 0,
          color: isAccordion && depth === 0 ? "var(--color-text-default)" : "inherit",
        }}
        secondaryTypographyProps={{
          fontSize: "0.7rem",
          sx: { color: "var(--color-text-subtle)", mt: 0.15 },
        }}
      />
    </ListItemButton>
  );
}
