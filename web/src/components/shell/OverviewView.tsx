import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { NavigatorTree, SprintStatusResult } from "../../api.js";
import {
  buildProjectCoverage,
  buildProjectNav,
  countOpenActionItems,
  titleCaseProject,
  type ShellSelection,
} from "../../shell.js";
import { CoverageTable, LeafList, OpenItems, Panel, Stat } from "./OverviewPanels.js";

interface OverviewViewProps {
  tree: NavigatorTree | null;
  sprintStatus: SprintStatusResult | null;
  sprintStatusError: string | null;
  onOpenSelection: (selection: ShellSelection) => void;
  onOpenFile: (path: string) => void;
}

const OVERVIEW_LEDE =
  "A read-only map of this project's BMAD artifacts - what was decided, the technical spine, and what is in progress.";

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
  const namedProjects = projects.filter((project) => project.key !== "_other");
  const coverage = buildProjectCoverage(projects);
  const openCount = countOpenActionItems(sprintStatus?.actionItems ?? []);
  const dash = "-";

  return (
    <Box
      sx={{
        p: "var(--space-6)",
        width: "100%",
        maxWidth: "none",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
      }}
    >
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 650, letterSpacing: "-0.02em", mb: 0.5 }}>
          Workspace overview
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          title={OVERVIEW_LEDE}
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {OVERVIEW_LEDE}
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        component="dl"
        sx={{
          m: 0,
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          bgcolor: "var(--color-bg-raised)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--elevation-card)",
          overflow: "hidden",
          "& > *:not(:last-child)": {
            borderRight: "1px solid var(--color-border-subtle)",
          },
          "@media (max-width: 1100px)": {
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          },
          "@media (max-width: 720px)": {
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        <Stat
          label="Products"
          value={namedProjects.length > 0 ? namedProjects.map((p) => p.title).join(", ") : dash}
        />
        <Stat
          label="Latest requirements"
          value={
            latestPrd
              ? `${titleCaseProject(latestPrd.project)}${latestPrd.entry.date ? ` · ${latestPrd.entry.date}` : ""}`
              : dash
          }
        />
        <Stat
          label="Latest architecture"
          value={
            latestArch
              ? `${titleCaseProject(latestArch.project)}${latestArch.entry.date ? ` · ${latestArch.entry.date}` : ""}`
              : dash
          }
        />
        <Stat label="Active epic" value={hasSprint && sprintStatus ? sprintStatus.summary.activeEpic : dash} />
        <Stat label="Open action items" value={hasSprint && sprintStatus ? String(openCount) : dash} />
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(280px, 1.25fr)",
          gap: "var(--space-4)",
          alignItems: "stretch",
          "@media (max-width: 1100px)": {
            gridTemplateColumns: "1fr 1fr",
          },
          "@media (max-width: 720px)": {
            gridTemplateColumns: "1fr",
          },
        }}
      >
        <Panel
          title="Requirements"
          subtitle="What was decided"
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
          <LeafList
            projects={namedProjects}
            kind="requirements"
            empty="No PRD folders found under planning-artifacts/prds."
            onOpen={(leaf) => onOpenSelection({ kind: "prd", path: leaf.path })}
          />
        </Panel>
        <Panel
          title="Architecture"
          subtitle="The technical spine"
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
          <LeafList
            projects={namedProjects}
            kind="architecture"
            empty="No architecture folders found yet."
            onOpen={(leaf) => onOpenSelection({ kind: "architecture", path: leaf.path })}
          />
        </Panel>
        <Panel
          title="Sprint"
          subtitle="What is in progress"
          action={
            hasSprint ? (
              <Button size="small" variant="outlined" onClick={() => onOpenSelection({ kind: "sprint" })}>
                Open sprint
              </Button>
            ) : undefined
          }
        >
          {hasSprint ? (
            <>
              {sprintStatusError && (
                <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
                  {sprintStatusError}
                </Typography>
              )}
              {!sprintStatusError && sprintStatus === null && (
                <Typography variant="body2" color="text.secondary">
                  Loading sprint status…
                </Typography>
              )}
              {sprintStatus && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "var(--color-label)" }}>
                      Active epic
                    </Typography>
                    <Typography variant="h6" sx={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
                      {sprintStatus.summary.activeEpic}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                      Open action items
                    </Typography>
                    <OpenItems items={sprintStatus.actionItems} onOpenFile={onOpenFile} />
                  </Box>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No sprint-status.yaml in this workspace - open a product&apos;s latest Requirements run from the left
              nav.
            </Typography>
          )}
        </Panel>
      </Box>

      <CoverageTable rows={coverage} />
    </Box>
  );
}
