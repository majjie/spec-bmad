import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

/** Shared stage padding/rhythm for Overview, Sprint, and document stages. */
export function StageFrame({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        p: "var(--space-6)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
        minHeight: "100%",
        boxSizing: "border-box",
      }}
    >
      {children}
    </Box>
  );
}

export function StageHeader({
  title,
  lede,
  action,
}: {
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "var(--space-4)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="h1"
          variant="h5"
          sx={{ fontWeight: 650, letterSpacing: "-0.02em", textWrap: "balance" }}
        >
          {title}
        </Typography>
        {lede && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, maxWidth: "62ch", textWrap: "pretty" }}
          >
            {lede}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  action,
  flush = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  flush?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: flush ? 0 : "var(--space-5)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--elevation-card)",
        bgcolor: "var(--color-bg-raised)",
        minWidth: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1,
          mb: flush ? 0 : 1.5,
          px: flush ? "var(--space-5)" : 0,
          pt: flush ? "var(--space-4)" : 0,
          pb: flush ? "var(--space-3)" : 0,
          borderBottom: flush ? "1px solid var(--color-border-subtle)" : "none",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{ color: "var(--color-accent)", display: "block", lineHeight: 1.2 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "var(--color-text-subtle)" }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, px: flush ? "var(--space-5)" : 0, pb: flush ? "var(--space-4)" : 0 }}>
        {children}
      </Box>
    </Paper>
  );
}

export function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box sx={{ minWidth: 0, px: "var(--space-5)", py: "var(--space-3)" }}>
      <Typography variant="caption" component="dt" sx={{ color: "var(--color-label)" }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        component="dd"
        noWrap
        title={value}
        sx={{
          m: 0,
          color: "var(--color-value)",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          fontFamily: mono ? "var(--font-mono)" : "inherit",
          fontSize: mono ? "0.8125rem" : undefined,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function StatStrip({ children }: { children: ReactNode }) {
  return (
    <Paper
      variant="outlined"
      component="dl"
      sx={{
        m: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        bgcolor: "var(--color-bg-raised)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--elevation-card)",
        overflow: "hidden",
        "& > *:not(:last-child)": {
          borderRight: "1px solid var(--color-border-subtle)",
        },
      }}
    >
      {children}
    </Paper>
  );
}

export function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: "var(--color-label)", display: "block" }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "var(--color-value)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

/** Hairline list row used across Overview leaves, sprint steps, action items. */
export function ListRow({
  children,
  onClick,
  selected = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
}) {
  const interactive = Boolean(onClick);
  return (
    <Box
      component={interactive ? "button" : "div"}
      type={interactive ? "button" : undefined}
      onClick={onClick}
      sx={{
        all: interactive ? "unset" : undefined,
        cursor: interactive ? "pointer" : "default",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        width: "100%",
        boxSizing: "border-box",
        py: "var(--space-3)",
        borderBottom: "1px solid var(--color-border-subtle)",
        bgcolor: selected ? "var(--color-bg-subtle)" : "transparent",
        "&:hover": interactive ? { bgcolor: "var(--color-bg-hover)" } : undefined,
        "&:focus-visible": interactive
          ? {
              outline: "2px solid var(--color-focus-ring)",
              outlineOffset: 2,
            }
          : undefined,
        "&:last-child": { borderBottom: "none" },
      }}
    >
      {children}
    </Box>
  );
}
