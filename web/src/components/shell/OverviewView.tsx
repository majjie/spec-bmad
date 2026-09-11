import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ActionItem, NavigatorTree, SprintStatusResult } from "../../api.js";
import { humanizeProjectSlug } from "../../shell.js";
import type { ShellSection } from "../../shell.js";

interface OverviewViewProps {
  tree: NavigatorTree | null;
  sprintStatus: SprintStatusResult | null;
  sprintStatusError: string | null;
  onOpenSection: (section: ShellSection, itemId?: string) => void;
  onOpenFile: (path: string) => void;
}

function latestLeaf(tree: NavigatorTree | null, kind: "prd" | "architecture") {
  const grouping = tree?.[kind] ?? null;
  if (!grouping) {
    return null;
  }
  for (const project of grouping.projects) {
    const first = project.dates[0];
    if (first) {
      return { project: project.project, entry: first };
    }
  }
  const non = grouping.nonConforming[0];
  if (non) {
    return { project: non.folderName, entry: { path: non.path, date: "", folderName: non.folderName } };
  }
  return null;
}

function Card({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: "var(--radius-md)",
        bgcolor: "var(--color-bg-raised)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box>
          <Typography variant="overline" sx={{ color: "var(--color-accent)" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

function OpenItems({ items, onOpenFile }: { items: ActionItem[]; onOpenFile: (path: string) => void }) {
  const open = items.filter((i) => i.status !== "done");
  if (open.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No open action items.
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {open.slice(0, 5).map((item) => (
        <Box
          key={item.id}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            py: 0.75,
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <Typography variant="body2">{item.action ?? item.id}</Typography>
          {item.resolvedPath && (
            <Button size="small" onClick={() => onOpenFile(item.resolvedPath!)}>
              Open
            </Button>
          )}
        </Box>
      ))}
    </Box>
  );
}

export default function OverviewView({
  tree,
  sprintStatus,
  sprintStatusError,
  onOpenSection,
  onOpenFile,
}: OverviewViewProps) {
  const latestPrd = latestLeaf(tree, "prd");
  const latestArch = latestLeaf(tree, "architecture");
  const hasSprint = tree?.sprintStatusAvailable === true;

  return (
    <Box sx={{ p: 3, maxWidth: 960, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 650, letterSpacing: "-0.02em", mb: 0.5, textWrap: "balance" }}>
          Project overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "60ch", textWrap: "pretty" }}>
          A read-only map of this project&apos;s BMAD artifacts — what was decided, the technical
          spine, and what is in progress.
        </Typography>
      </Box>

      {hasSprint ? (
        <Card
          title="Sprint"
          subtitle="What engineering is tracking right now"
          action={
            <Button size="small" variant="outlined" onClick={() => onOpenSection("sprint")}>
              Open Sprint
            </Button>
          }
        >
          {sprintStatusError && (
            <Typography variant="body2" color="error">
              {sprintStatusError}
            </Typography>
          )}
          {!sprintStatusError && sprintStatus === null && (
            <Typography variant="body2" color="text.secondary">
              Loading sprint status…
            </Typography>
          )}
          {sprintStatus && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--color-label)" }}>
                  Active epic
                </Typography>
                <Typography variant="h6" sx={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
                  {sprintStatus.summary.activeEpic}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Open action items
                </Typography>
                <OpenItems items={sprintStatus.actionItems} onOpenFile={onOpenFile} />
              </Box>
            </Box>
          )}
        </Card>
      ) : (
        <Card title="Sprint">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            No sprint-status.yaml in this project — open Requirements to read the latest PRD.
          </Typography>
          <Button size="small" variant="contained" onClick={() => onOpenSection("requirements")}>
            Open Requirements
          </Button>
        </Card>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Card
          title="Requirements"
          subtitle="Product decisions (PRD)"
          action={
            latestPrd ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onOpenSection("requirements", latestPrd.entry.path)}
              >
                Open latest
              </Button>
            ) : undefined
          }
        >
          {latestPrd ? (
            <Typography variant="body2">
              <Box component="span" sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                {humanizeProjectSlug(latestPrd.project)}
              </Box>
              {latestPrd.entry.date ? ` · ${latestPrd.entry.date}` : ""}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No PRD folders found under planning-artifacts/prds.
            </Typography>
          )}
        </Card>
        <Card
          title="Architecture"
          subtitle="Technical spine"
          action={
            latestArch ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onOpenSection("architecture", latestArch.entry.path)}
              >
                Open latest
              </Button>
            ) : undefined
          }
        >
          {latestArch ? (
            <Typography variant="body2">
              <Box component="span" sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                {humanizeProjectSlug(latestArch.project)}
              </Box>
              {latestArch.entry.date ? ` · ${latestArch.entry.date}` : ""}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No architecture folders found yet.
            </Typography>
          )}
        </Card>
      </Box>
    </Box>
  );
}
