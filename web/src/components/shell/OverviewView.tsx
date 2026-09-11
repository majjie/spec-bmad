import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { NavigatorTree, SprintStatusResult } from "../../api.js";
import {
  buildProjectNav,
  countOpenActionItems,
  formatRunDate,
  titleCaseProject,
  type ShellSelection,
} from "../../shell.js";
import { StageFrame, StageHeader, Stat, StatStrip } from "../stage/Stage.js";
import { OpenItems, Panel, ProductCard } from "./OverviewPanels.js";

interface OverviewViewProps {
  tree: NavigatorTree | null;
  sprintStatus: SprintStatusResult | null;
  sprintStatusError: string | null;
  onOpenSelection: (selection: ShellSelection) => void;
  onOpenFile: (path: string) => void;
}

const OVERVIEW_LEDE =
  "A read-only map of this workspace — products BMAD has been planning, plus delivery status for the whole folder.";

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
  return `${titleCaseProject(latest.project)}${date ? ` · ${date}` : ""}`;
}

export default function OverviewView({
  tree,
  sprintStatus,
  sprintStatusError,
  onOpenSelection,
  onOpenFile,
}: OverviewViewProps) {
  const hasSprint = tree?.sprintStatusAvailable === true;
  const products = buildProjectNav(tree).filter((product) => product.key !== "_other");
  const openCount = countOpenActionItems(sprintStatus?.actionItems ?? []);
  const dash = "—";

  return (
    <StageFrame>
      <StageHeader title="Workspace overview" lede={OVERVIEW_LEDE} />

      <StatStrip>
        <Stat
          label="Products"
          value={products.length > 0 ? products.map((p) => p.title).join(", ") : dash}
        />
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

      {products.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-4)",
            alignItems: "stretch",
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.key}
              product={product}
              onOpenPrd={(leaf) => onOpenSelection({ kind: "prd", path: leaf.path })}
              onOpenArchitecture={(leaf) => onOpenSelection({ kind: "architecture", path: leaf.path })}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No named products yet — open Requirements or Architecture folders from the left nav when they appear.
        </Typography>
      )}
    </StageFrame>
  );
}
