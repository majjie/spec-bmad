import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ActionItem, NavigatorTree, SprintStatusResult } from "../../api.js";
import { buildProjectNav, titleCaseProject, type ShellSelection } from "../../shell.js";

interface OverviewViewProps {
  tree: NavigatorTree | null;
  sprintStatus: SprintStatusResult | null;
  sprintStatusError: string | null;
  onOpenSelection: (selection: ShellSelection) => void;
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
  action?: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: "2px",
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
  onOpenSelection,
  onOpenFile,
}: OverviewViewProps) {
  const latestPrd = latestLeaf(tree, "prd");
  const latestArch = latestLeaf(tree, "architecture");
  const hasSprint = tree?.sprintStatusAvailable === true;
  const projects = buildProjectNav(tree, sprintStatus?.summary.project ?? null);

  return (
    <Box sx={{ p: 3, maxWidth: 960, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 650, letterSpacing: "-0.02em", mb: 0.5, textWrap: "balance" }}>
          Workspace overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "62ch", textWrap: "pretty" }}>
          Projects in the left nav are BMAD product lineages from your folders (names like{" "}
          <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "0.85em" }}>
            Harbor
          </Box>{" "}
          come from <code>prd-harbor-…</code> / sprint metadata — not this app&apos;s brand). Expand a
          project to open its Requirements, Architecture, and Sprint.
        </Typography>
        {projects.length > 0 && (
          <Typography variant="body2" sx={{ mt: 1.25, color: "var(--color-text-muted)" }}>
            In this workspace:{" "}
            {projects
              .filter((p) => p.key !== "_other")
              .map((p) => p.title)
              .join(", ") || "unsorted folders only"}
            .
          </Typography>
        )}
      </Box>

      {hasSprint ? (
        <Card
          title="Sprint"
          subtitle="What engineering is tracking right now"
          action={
            <Button size="small" variant="outlined" onClick={() => onOpenSelection({ kind: "sprint" })}>
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
            No sprint-status.yaml in this workspace — open a project&apos;s latest Requirements run
            from the left nav.
          </Typography>
        </Card>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Card
          title="Latest requirements"
          subtitle="Most recent PRD run"
          action={
            latestPrd ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onOpenSelection({ kind: "prd", path: latestPrd.entry.path })}
              >
                Open latest
              </Button>
            ) : undefined
          }
        >
          {latestPrd ? (
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {titleCaseProject(latestPrd.project)}
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
          title="Latest architecture"
          subtitle="Most recent spine"
          action={
            latestArch ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onOpenSelection({ kind: "architecture", path: latestArch.entry.path })}
              >
                Open latest
              </Button>
            ) : undefined
          }
        >
          {latestArch ? (
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {titleCaseProject(latestArch.project)}
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
