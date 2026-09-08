import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { SprintStatusResult, StepDetail } from "../api.js";
import ActionItemsTile from "./ActionItemsTile.js";

interface SprintStatusViewProps {
  data: SprintStatusResult;
  onOpenFile: (path: string) => void;
}

// Only these four statuses get an icon (FR-003/FR-004/FR-005) — any other status value
// (e.g. a story marked "ready-for-dev") renders as text only, with no icon and no error.
// Each also gets its own distinct, semantically-fitting icon color (feature 011 FR-006):
// done=success (finished), review=warning (needs attention), in-progress=info (actively
// happening, a blue distinct from the primary accent's own blue), backlog=disabled
// (deliberately muted, lowest visual priority) (research.md § 6). Bundled into one map
// (rather than two parallel lookups) so a recognized status always carries both together.
const STATUS_META: Record<string, { Icon: typeof CheckCircleIcon; color: "success" | "warning" | "info" | "disabled" }> = {
  done: { Icon: CheckCircleIcon, color: "success" },
  review: { Icon: RateReviewIcon, color: "warning" },
  backlog: { Icon: Inventory2Icon, color: "disabled" },
  "in-progress": { Icon: AutorenewIcon, color: "info" },
};

/** An epic's or a story's status, with an icon when it's one of the four recognized
 * values — the same mapping either way, so "done"/"review"/"backlog"/"in-progress" always
 * look identical whether shown for an epic or a story. */
function StatusText({ status }: { status: string }) {
  const meta = STATUS_META[status];
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, verticalAlign: "middle" }}>
      {meta && <meta.Icon fontSize="inherit" color={meta.color} />}
      {status}
    </Box>
  );
}

// A default for Action Items' height before the ResizeObserver below reports Summary's
// real one (the very first render, before layout has happened at all).
const FALLBACK_HEIGHT = 360;

const SUMMARY_FIELDS: { label: string; key: keyof SprintStatusResult["summary"] }[] = [
  { label: "Active Epic", key: "activeEpic" },
  { label: "Generated", key: "generated" },
  { label: "Last updated", key: "lastUpdated" },
  { label: "Project", key: "project" },
  { label: "Project key", key: "projectKey" },
  { label: "Tracking system", key: "trackingSystem" },
  { label: "Story location", key: "storyLocation" },
];

// FR-002/FR-003 (feature 011): the exact same two tokens FileViewerDialog.tsx's
// PreambleReadout already uses for its keys/values, not just visually-similar colors.
function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="info.light">
        {label}
      </Typography>
      <Typography variant="body2" color="warning.light">
        {value}
      </Typography>
    </Box>
  );
}

function Tile({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 260, ...sx }}>
      {children}
    </Paper>
  );
}

// FR-004: a header line (index, status, optional magnifying-glass) followed by a body
// line (title) — matching the Action Items tile's established header/body, candy-striped
// row pattern (FR-006/FR-011). The magnifying glass (FR-007) only renders when a matching
// spec document exists (`step.specPath !== null`), reusing the same `onOpenFile` path the
// Action Items tile's own jump icon already uses (feature 008).
function StepRow({
  step,
  index,
  onOpenFile,
}: {
  step: StepDetail;
  index: number;
  onOpenFile: (path: string) => void;
}) {
  return (
    <Box sx={{ py: 0.5, px: 1, bgcolor: index % 2 === 0 ? "action.hover" : "transparent" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {/* The extra `mr` widens only the gap before the status, to visually match the
            larger gap the jump control's own IconButton padding already creates before
            it, when present (research.md § 1, feature 011 FR-001). */}
        {/* primary.light: the blue accent, applied to this row's closest analog to a
            tile heading (feature 011 FR-005, research.md § 4). */}
        <Typography variant="caption" color="primary.light" sx={{ mr: 0.75 }}>
          {step.index}
        </Typography>
        <StatusText status={step.status} />
        {step.specPath !== null && (
          <IconButton size="small" onClick={() => onOpenFile(step.specPath!)}>
            <SearchIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Typography variant="body2">{step.title}</Typography>
    </Box>
  );
}

export default function SprintStatusView({ data, onOpenFile }: SprintStatusViewProps) {
  // Action Items' own content is unbounded (it can hold arbitrarily many items) — in plain
  // CSS, a flex/grid sibling's *natural* content size always contributes to the shared
  // row's height, no matter its overflow settings, so leaving Action Items' height to CSS
  // alone means enough items eventually inflate the row (and drag the Summary tile up with
  // it) instead of scrolling. Measuring the Summary tile's own rendered height and applying
  // it directly to Action Items sidesteps that: the Summary tile stays fully natural
  // (never constrained, never scrolling), and Action Items always matches it exactly,
  // scrolling internally past that height however many items it holds.
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryHeight, setSummaryHeight] = useState(FALLBACK_HEIGHT);

  // Every epic tile collapses by default (FR-001) — membership in this set is what
  // "expanded" means, so an epic never in it starts (and stays, until toggled) collapsed,
  // independently of every other tile (research.md § 5).
  const [expandedEpicKeys, setExpandedEpicKeys] = useState<Set<string>>(new Set());

  function toggleEpic(epicKey: string) {
    setExpandedEpicKeys((prev) => {
      const next = new Set(prev);
      if (next.has(epicKey)) {
        next.delete(epicKey);
      } else {
        next.add(epicKey);
      }
      return next;
    });
  }

  useLayoutEffect(() => {
    const el = summaryRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSummaryHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // Column layout, not the previous wrapping grid (FR-006): the Summary tile keeps its
    // own natural size (alignItems: "flex-start" stops it from stretching), while each
    // epic tile below it opts into `width: "100%"` individually (FR-007/FR-008).
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
      {/* This row needs its own `width: "100%"` to escape the outer container's
          `alignItems: "flex-start"` — the same override the epic-tile stack below already
          needed from that same container, for the identical reason (research.md § 4). */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        {/* `alignSelf: "flex-start"` keeps this wrapper at its own natural content height —
            without it, the row's default `alignItems: stretch` would stretch it to match
            Action Items' height, and the ResizeObserver below would measure that stretched
            size instead of Summary's real one, feeding back into a stable-but-wrong loop. */}
        <Box ref={summaryRef} sx={{ alignSelf: "flex-start" }}>
          <Tile>
            <Typography variant="subtitle2" color="primary.light" sx={{ mb: 1 }}>
              Summary
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {SUMMARY_FIELDS.map(({ label, key }) => (
                <Field key={key} label={label} value={data.summary[key]} />
              ))}
            </Box>
          </Tile>
        </Box>
        <ActionItemsTile actionItems={data.actionItems} onOpenFile={onOpenFile} height={summaryHeight} />
      </Box>

      {data.epics.length === 0 ? (
        <Tile sx={{ width: "100%" }}>
          <Typography variant="body2" color="text.secondary">
            No epics declared in this sprint-status file.
          </Typography>
        </Tile>
      ) : (
        data.epics.map((epic) => {
          const isExpanded = expandedEpicKeys.has(epic.epicKey);
          return (
            <Tile key={epic.epicKey} sx={{ width: "100%" }}>
              {/* The whole header toggles expand/collapse, not just the chevron (FR-002) —
                  the chevron is a plain icon here, not its own nested button, so a click
                  anywhere in the header fires exactly one toggle rather than two. */}
              <Box
                onClick={() => toggleEpic(epic.epicKey)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <Typography variant="subtitle2">
                  {/* Only the key gets the accent — the status keeps its own semantic
                      color (feature 011 FR-005/FR-006, research.md §§ 4/6). */}
                  <Box component="span" sx={{ color: "primary.light" }}>
                    {epic.epicKey}
                  </Box>{" "}
                  — <StatusText status={epic.status} />
                </Typography>
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
              {isExpanded && (
                <>
                  <Box sx={{ display: "flex", flexDirection: "column", mb: 1, mt: 1 }}>
                    {epic.steps.map((step, index) => (
                      <StepRow key={step.key} step={step} index={index} onOpenFile={onOpenFile} />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Retrospective: {epic.retrospectiveStatus ?? "not started"}
                  </Typography>
                </>
              )}
            </Tile>
          );
        })
      )}
    </Box>
  );
}
