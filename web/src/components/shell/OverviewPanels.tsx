import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ActionItem } from "../../api.js";
import type { ProjectCoverageRow, ProjectNavGroup, ProjectNavLeaf } from "../../shell.js";

export function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: "var(--space-5)",
        borderRadius: "2px",
        bgcolor: "var(--color-bg-raised)",
        minWidth: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: "var(--color-accent)", display: "block", lineHeight: 1.2 }}>
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
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Paper>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
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
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function LeafList({
  projects,
  kind,
  empty,
  onOpen,
}: {
  projects: ProjectNavGroup[];
  kind: "requirements" | "architecture";
  empty: string;
  onOpen: (leaf: ProjectNavLeaf) => void;
}) {
  const rows = projects.filter((project) => project[kind].length > 0);
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {empty}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {rows.map((project) => (
        <Box key={`${kind}-${project.key}`}>
          <Typography variant="caption" sx={{ color: "var(--color-text-subtle)", fontWeight: 600 }}>
            {project.title}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", mt: 0.5 }}>
            {project[kind].map((leaf) => (
              <Box
                key={leaf.path}
                component="button"
                type="button"
                onClick={() => onOpen(leaf)}
                sx={{
                  all: "unset",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                  py: 0.75,
                  px: 0.5,
                  mx: -0.5,
                  borderBottom: "1px solid var(--color-border-subtle)",
                  "&:hover": { bgcolor: "var(--color-bg-hover)" },
                  "&:focus-visible": {
                    outline: "2px solid var(--color-focus-ring)",
                    outlineOffset: 2,
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  {leaf.date || leaf.folderName}
                </Typography>
                {leaf.isLatest && (
                  <Typography variant="caption" sx={{ color: "var(--color-accent)" }}>
                    Latest
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function OpenItems({ items, onOpenFile }: { items: ActionItem[]; onOpenFile: (path: string) => void }) {
  const open = items.filter((item) => item.status !== "done");
  if (open.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No open action items.
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {open.slice(0, 6).map((item) => (
        <Box
          key={item.id}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            py: 0.75,
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <Typography variant="body2">{item.action ?? item.id}</Typography>
          {item.resolvedPath && (
            <Button size="small" onClick={() => onOpenFile(item.resolvedPath!)}>
              Open file
            </Button>
          )}
        </Box>
      ))}
    </Box>
  );
}

function coverageLabel(count: number, date: string): string {
  if (count === 0) {
    return "—";
  }
  const runs = `${count} run${count === 1 ? "" : "s"}`;
  return date ? `${runs} · ${date}` : runs;
}

export function CoverageTable({ rows }: { rows: ProjectCoverageRow[] }) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <Paper
      variant="outlined"
      sx={{ p: 0, borderRadius: "2px", bgcolor: "var(--color-bg-raised)", overflow: "auto", position: "relative" }}
    >
      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          "& th, & td": {
            textAlign: "left",
            px: "var(--space-5)",
            py: "var(--space-3)",
            borderBottom: "1px solid var(--color-border-subtle)",
            whiteSpace: "nowrap",
          },
          "& thead th": {
            color: "var(--color-label)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          },
          "& tbody th": {
            fontWeight: 600,
            fontSize: "0.875rem",
            textTransform: "none",
            letterSpacing: 0,
            color: "var(--color-text-default)",
          },
          "& tbody tr:last-of-type th, & tbody tr:last-of-type td": { borderBottom: "none" },
        }}
      >
        <Box
          component="caption"
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
          }}
        >
          Artifact coverage by product
        </Box>
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Requirements</th>
            <th scope="col">Architecture</th>
            <th scope="col">Sprint</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.title}</th>
              <td>
                <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  {coverageLabel(row.requirementsCount, row.latestRequirementDate)}
                </Typography>
              </td>
              <td>
                <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  {coverageLabel(row.architectureCount, row.latestArchitectureDate)}
                </Typography>
              </td>
              <td>
                <Typography variant="body2">{row.hasSprint ? "Tracking" : "—"}</Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Paper>
  );
}
