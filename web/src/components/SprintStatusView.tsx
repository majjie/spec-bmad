import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { SprintStatusResult, StepDetail } from "../api.js";
import { formatStatusLabel } from "../shell.js";
import ActionItemsTile from "./ActionItemsTile.js";

interface SprintStatusViewProps {
  data: SprintStatusResult;
  onOpenFile: (path: string) => void;
}

const STATUS_META: Record<
  string,
  { Icon: typeof CheckCircleIcon; color: string }
> = {
  done: { Icon: CheckCircleIcon, color: "var(--color-status-done)" },
  review: { Icon: RateReviewIcon, color: "var(--color-status-review)" },
  backlog: { Icon: Inventory2Icon, color: "var(--color-status-backlog)" },
  "in-progress": { Icon: AutorenewIcon, color: "var(--color-status-progress)" },
};

function StatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status];
  const label = formatStatusLabel(status);
  if (!meta) {
    return (
      <Typography component="span" variant="body2">
        {label}
      </Typography>
    );
  }
  return (
    <Chip
      size="small"
      icon={<meta.Icon sx={{ color: `${meta.color} !important`, fontSize: "16px !important" }} />}
      label={label}
      sx={{
        height: 24,
        bgcolor: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-default)",
        color: "var(--color-text-default)",
        "& .MuiChip-label": { px: 1, fontSize: "0.75rem", fontWeight: 500 },
      }}
    />
  );
}

const FALLBACK_HEIGHT = 360;

const DETAIL_FIELDS: { label: string; key: keyof SprintStatusResult["summary"] }[] = [
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
      <Typography variant="caption" sx={{ color: "var(--color-label)" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--color-value)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
        {value}
      </Typography>
    </Box>
  );
}

function Tile({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 260, borderRadius: "var(--radius-md)", ...sx }}>
      {children}
    </Paper>
  );
}

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
    <Box sx={{ py: 0.75, px: 1, bgcolor: index % 2 === 0 ? "action.hover" : "transparent" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)", mr: 0.5 }}
        >
          {step.index}
        </Typography>
        <StatusChip status={step.status} />
        {step.specPath !== null && (
          <Tooltip title="Open matching spec">
            <IconButton size="small" aria-label={`Open spec for ${step.index}`} onClick={() => onOpenFile(step.specPath!)}>
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {step.title}
      </Typography>
    </Box>
  );
}

export default function SprintStatusView({ data, onOpenFile }: SprintStatusViewProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryHeight, setSummaryHeight] = useState(FALLBACK_HEIGHT);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const initialExpanded = new Set(
    data.epics.filter((e) => e.status === "in-progress").map((e) => e.epicKey),
  );
  const [expandedEpicKeys, setExpandedEpicKeys] = useState<Set<string>>(initialExpanded);

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
  }, [detailsOpen]);

  return (
    <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box ref={summaryRef} sx={{ alignSelf: "flex-start" }}>
          <Tile>
            <Typography variant="subtitle2" sx={{ color: "var(--color-accent)", mb: 1.5 }}>
              Summary
            </Typography>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: "var(--color-label)" }}>
                Active epic
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)", fontWeight: 650 }}
              >
                {data.summary.activeEpic}
              </Typography>
            </Box>
            <Box
              component="button"
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              sx={{
                all: "unset",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                color: "var(--color-text-muted)",
                fontSize: "0.8rem",
                mb: detailsOpen ? 1 : 0,
              }}
            >
              Project details {detailsOpen ? <ExpandLessIcon fontSize="inherit" /> : <ExpandMoreIcon fontSize="inherit" />}
            </Box>
            <Collapse in={detailsOpen}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pt: 0.5 }}>
                {DETAIL_FIELDS.map(({ label, key }) => (
                  <Field key={key} label={label} value={data.summary[key]} />
                ))}
              </Box>
            </Collapse>
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
              <Box
                onClick={() => toggleEpic(epic.epicKey)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleEpic(epic.epicKey);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}
                  >
                    {epic.epicKey}
                  </Typography>
                  <StatusChip status={epic.status} />
                  {epic.retrospectiveStatus && (
                    <Typography variant="caption" color="text.secondary">
                      Retro: {formatStatusLabel(epic.retrospectiveStatus)}
                    </Typography>
                  )}
                </Box>
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
              {isExpanded && (
                <Box sx={{ display: "flex", flexDirection: "column", mt: 1 }}>
                  {epic.steps.map((step, index) => (
                    <StepRow key={step.key} step={step} index={index} onOpenFile={onOpenFile} />
                  ))}
                </Box>
              )}
            </Tile>
          );
        })
      )}
    </Box>
  );
}
