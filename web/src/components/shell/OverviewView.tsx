import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { NavigatorTree, SprintStatusResult } from "../../api.js";
import {
  buildProjectNav,
  countOpenActionItems,
  formatRunDate,
  hasMultipleNamedSlugs,
  namedSlugGroups,
  titleCaseProject,
  workspaceProjectName,
  type ShellSelection,
} from "../../shell.js";
import { StageFrame, StageHeader, Stat, StatStrip } from "../stage/Stage.js";
import { ArtifactList, OpenItems, Panel } from "./OverviewPanels.js";

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

function latestLabel(
  tree: NavigatorTree | null,
  kind: "prd" | "architecture",
  dash: string,
): string {
  const latest = latestLeaf(tree, kind);
  if (!latest) {
    return dash;
  }
  const date = latest.entry.date ? formatRunDate(latest.entry.date) : "";
  const multi = hasMultipleNamedSlugs(buildProjectNav(tree));
  const prefix = multi ? `${titleCaseProject(latest.project)} · ` : "";
  return `${prefix}${date || latest.entry.folderName}`;
}

export default function OverviewView({
  tree,
  sprintStatus,
  sprintStatusError,
  onOpenSelection,
  onOpenFile,
}: OverviewViewProps) {
  const hasSprint = tree?.sprintStatusAvailable === true;
  const groups = buildProjectNav(tree);
  const named = namedSlugGroups(groups);
  const multi = hasMultipleNamedSlugs(groups);
  const projectName = workspaceProjectName(tree, sprintStatus?.summary.project ?? null);
  const openCount = countOpenActionItems(sprintStatus?.actionItems ?? []);
  const dash = "—";

  const allRequirements = named.flatMap((g) => g.requirements);
  const allArchitecture = named.flatMap((g) => g.architecture);
  const other = groups.find((g) => g.key === "_other");

  const title = projectName ? `${projectName} overview` : "Workspace overview";
  const lede = projectName
    ? `A read-only map of ${projectName}'s BMAD planning artifacts and delivery status for this folder.`
    : "A read-only map of this folder's BMAD planning artifacts and delivery status.";

  return (
    <StageFrame>
      <StageHeader title={title} lede={lede} />

      <StatStrip>
        <Stat label="Project" value={projectName ?? (multi ? named.map((p) => p.title).join(", ") : dash)} />
        <Stat label="Latest requirements" value={latestLabel(tree, "prd", dash)} />
        <Stat label="Latest architecture" value={latestLabel(tree, "architecture", dash)} />
        <Stat
          label="Active epic"
          value={hasSprint && sprintStatus ? sprintStatus.summary.activeEpic : dash}
          mono
        />
        <Stat label="Open action items" value={hasSprint && sprintStatus ? String(openCount) : dash} />
      </StatStrip>

      {hasSprint && (
        <Panel
          title="Sprint status"
          subtitle="Workspace delivery"
          action={
            <Button size="small" variant="outlined" onClick={() => onOpenSelection({ kind: "sprint" })}>
              Open sprint
            </Button>
          }
        >
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(160px, 220px) minmax(0, 1fr)",
                gap: "var(--space-5)",
                "@media (max-width: 720px)": { gridTemplateColumns: "1fr" },
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: "var(--color-label)" }}>
                  Active epic
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "var(--font-mono)", fontWeight: 650, letterSpacing: "-0.01em" }}
                >
                  {sprintStatus.summary.activeEpic}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--color-label)", display: "block", mb: 0.5 }}>
                  Open action items
                </Typography>
                <OpenItems items={sprintStatus.actionItems} onOpenFile={onOpenFile} />
              </Box>
            </Box>
          )}
        </Panel>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-4)",
          alignItems: "stretch",
        }}
      >
        <Panel
          title="Requirements"
          {...(multi
            ? { subtitle: `${named.length} lineages` }
            : allRequirements.length > 0
              ? { subtitle: "PRD runs" }
              : {})}
          {...(allRequirements[0]
            ? {
                action: (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onOpenSelection({ kind: "prd", path: allRequirements[0]!.path })}
                  >
                    Open latest
                  </Button>
                ),
              }
            : {})}
        >
          {multi ? (
            named.map((group) =>
              group.requirements.length > 0 ? (
                <Box key={group.key} sx={{ mb: "var(--space-3)" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-text-subtle)",
                      fontWeight: 650,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {group.title}
                  </Typography>
                  <ArtifactList
                    leaves={group.requirements}
                    kind="prd"
                    onOpen={(leaf) => onOpenSelection({ kind: "prd", path: leaf.path })}
                  />
                </Box>
              ) : null,
            )
          ) : (
            <ArtifactList
              leaves={allRequirements}
              kind="prd"
              empty="No requirements runs yet."
              onOpen={(leaf) => onOpenSelection({ kind: "prd", path: leaf.path })}
            />
          )}
          {other && other.other.length > 0 && (
            <Box sx={{ mt: "var(--space-3)" }}>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--color-text-subtle)",
                  fontWeight: 650,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Other folders
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {other.other.map((entry) => (
                  <Button
                    key={entry.path}
                    size="small"
                    onClick={() => onOpenSelection({ kind: "prd", path: entry.path })}
                    sx={{ justifyContent: "flex-start", textTransform: "none" }}
                  >
                    {entry.folderName}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Panel>

        <Panel
          title="Architecture"
          {...(multi
            ? { subtitle: `${named.filter((g) => g.architecture.length > 0).length} lineages` }
            : allArchitecture.length > 0
              ? { subtitle: "Spine runs" }
              : {})}
          {...(allArchitecture[0]
            ? {
                action: (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      onOpenSelection({ kind: "architecture", path: allArchitecture[0]!.path })
                    }
                  >
                    Open latest
                  </Button>
                ),
              }
            : {})}
        >
          {multi ? (
            named.map((group) =>
              group.architecture.length > 0 ? (
                <Box key={group.key} sx={{ mb: "var(--space-3)" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-text-subtle)",
                      fontWeight: 650,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {group.title}
                  </Typography>
                  <ArtifactList
                    leaves={group.architecture}
                    kind="architecture"
                    onOpen={(leaf) => onOpenSelection({ kind: "architecture", path: leaf.path })}
                  />
                </Box>
              ) : null,
            )
          ) : (
            <ArtifactList
              leaves={allArchitecture}
              kind="architecture"
              empty="No architecture runs yet."
              onOpen={(leaf) => onOpenSelection({ kind: "architecture", path: leaf.path })}
            />
          )}
        </Panel>
      </Box>
    </StageFrame>
  );
}
