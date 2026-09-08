import type { ReactNode } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import RateReviewIcon from "@mui/icons-material/RateReview";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { SprintStatusResult } from "../api.js";

interface SprintStatusViewProps {
  data: SprintStatusResult;
}

// Only these four statuses get an icon (FR-003/FR-004/FR-005) — any other status value
// (e.g. a story marked "ready-for-dev") renders as text only, with no icon and no error.
const STATUS_ICONS: Record<string, typeof CheckCircleIcon> = {
  done: CheckCircleIcon,
  review: RateReviewIcon,
  backlog: Inventory2Icon,
  "in-progress": AutorenewIcon,
};

/** An epic's or a story's status, with an icon when it's one of the four recognized
 * values — the same mapping either way, so "done"/"review"/"backlog"/"in-progress" always
 * look identical whether shown for an epic or a story. */
function StatusText({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status];
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, verticalAlign: "middle" }}>
      {Icon && <Icon fontSize="inherit" />}
      {status}
    </Box>
  );
}

const SUMMARY_FIELDS: { label: string; key: keyof SprintStatusResult["summary"] }[] = [
  { label: "Active Epic", key: "activeEpic" },
  { label: "Generated", key: "generated" },
  { label: "Last updated", key: "lastUpdated" },
  { label: "Project", key: "project" },
  { label: "Project key", key: "projectKey" },
  { label: "Tracking system", key: "trackingSystem" },
  { label: "Story location", key: "storyLocation" },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
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

export default function SprintStatusView({ data }: SprintStatusViewProps) {
  return (
    // Column layout, not the previous wrapping grid (FR-006): the Summary tile keeps its
    // own natural size (alignItems: "flex-start" stops it from stretching), while each
    // epic tile below it opts into `width: "100%"` individually (FR-007/FR-008).
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
      <Tile>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Summary
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {SUMMARY_FIELDS.map(({ label, key }) => (
            <Field key={key} label={label} value={data.summary[key]} />
          ))}
        </Box>
      </Tile>

      {data.epics.length === 0 ? (
        <Tile sx={{ width: "100%" }}>
          <Typography variant="body2" color="text.secondary">
            No epics declared in this sprint-status file.
          </Typography>
        </Tile>
      ) : (
        data.epics.map((epic) => (
          <Tile key={epic.epicKey} sx={{ width: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {epic.epicKey} — <StatusText status={epic.status} />
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1 }}>
              {epic.stories.map((story) => (
                <Typography key={story.key} variant="body2">
                  {story.key}: <StatusText status={story.status} />
                </Typography>
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Retrospective: {epic.retrospectiveStatus ?? "not started"}
            </Typography>
          </Tile>
        ))
      )}
    </Box>
  );
}
