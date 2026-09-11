import { useState } from "react";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ComputerIcon from "@mui/icons-material/Computer";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { ActionItem, SprintStatusResult, StepDetail } from "../api.js";
import { countOpenActionItems, formatStatusLabel } from "../shell.js";
import { ListRow, MetaField, StageFrame, StageHeader, Stat, StatStrip } from "./stage/Stage.js";
import { StatusChip } from "./stage/StatusChip.js";

interface SprintStatusViewProps {
  data: SprintStatusResult;
  onOpenFile: (path: string) => void;
}

const DETAIL_FIELDS: { label: string; key: keyof SprintStatusResult["summary"] }[] = [
  { label: "Generated", key: "generated" },
  { label: "Last updated", key: "lastUpdated" },
  { label: "Project", key: "project" },
  { label: "Project key", key: "projectKey" },
  { label: "Tracking system", key: "trackingSystem" },
  { label: "Story location", key: "storyLocation" },
];

function StepRow({ step, onOpenFile }: { step: StepDetail; onOpenFile: (path: string) => void }) {
  return (
    <ListRow>
      <Box sx={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start", minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: "var(--color-text-subtle)",
            fontFamily: "var(--font-mono)",
            minWidth: 36,
            pt: 0.15,
            flexShrink: 0,
          }}
        >
          {step.index}
        </Typography>
        <Typography variant="body2" sx={{ minWidth: 0, textWrap: "pretty" }}>
          {step.title}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <StatusChip status={step.status} />
        {step.specPath !== null && (
          <Tooltip title="Open matching spec">
            <IconButton
              size="small"
              aria-label={`Open spec for ${step.index}`}
              onClick={() => onOpenFile(step.specPath!)}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </ListRow>
  );
}

function ActionItemRow({ item, onOpenFile }: { item: ActionItem; onOpenFile: (path: string) => void }) {
  const done = item.status === "done";
  const OwnerIcon = item.owner === "dev loop" ? ComputerIcon : PersonOutlineIcon;
  return (
    <ListRow>
      <Box sx={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start", minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            pt: 0.15,
            color: "var(--color-text-subtle)",
            flexShrink: 0,
          }}
        >
          {item.status !== null &&
            (done ? <CheckBoxIcon fontSize="small" /> : <CheckBoxOutlineBlankIcon fontSize="small" />)}
          {item.owner !== null && (
            <Tooltip title={item.owner}>
              <OwnerIcon fontSize="small" />
            </Tooltip>
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              textWrap: "pretty",
              color: done ? "var(--color-text-subtle)" : "var(--color-text-default)",
              textDecoration: done ? "line-through" : "none",
            }}
          >
            {item.action ?? item.id}
          </Typography>
          {item.epic !== null && (
            <Typography variant="caption" sx={{ color: "var(--color-text-subtle)", fontFamily: "var(--font-mono)" }}>
              epic-{item.epic}
            </Typography>
          )}
        </Box>
      </Box>
      {item.ref !== null && (
        <Tooltip title={item.ref}>
          <span>
            <IconButton
              size="small"
              disabled={item.resolvedPath === null}
              aria-label={`Open ${item.ref}`}
              onClick={() => {
                if (item.resolvedPath) {
                  onOpenFile(item.resolvedPath);
                }
              }}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </ListRow>
  );
}

export default function SprintStatusView({ data, onOpenFile }: SprintStatusViewProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const initialExpanded = new Set(
    data.epics.filter((epic) => epic.status === "in-progress").map((epic) => epic.epicKey),
  );
  const [expandedEpicKeys, setExpandedEpicKeys] = useState<Set<string>>(initialExpanded);
  const openCount = countOpenActionItems(data.actionItems);

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

  return (
    <StageFrame>
      <StageHeader
        title="Sprint status"
        lede="Delivery tracking from sprint-status.yaml — epics, stories, and open action items."
      />

      <StatStrip>
        <Stat label="Active epic" value={data.summary.activeEpic || "—"} mono />
        <Stat label="Project" value={data.summary.project || "—"} />
        <Stat label="Last updated" value={data.summary.lastUpdated || "—"} mono />
        <Stat label="Open action items" value={String(openCount)} />
      </StatStrip>

      <Box>
        <Button
          size="small"
          color="inherit"
          onClick={() => setDetailsOpen((value) => !value)}
          endIcon={detailsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ color: "var(--color-text-muted)", px: 0, minWidth: 0 }}
        >
          Project details
        </Button>
        <Collapse in={detailsOpen}>
          <Box
            sx={{
              mt: "var(--space-3)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {DETAIL_FIELDS.map(({ label, key }) => (
              <MetaField key={key} label={label} value={data.summary[key]} />
            ))}
          </Box>
        </Collapse>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--elevation-card)",
          bgcolor: "var(--color-bg-raised)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: "var(--space-5)",
            py: "var(--space-4)",
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          <Typography variant="overline" sx={{ color: "var(--color-accent)", display: "block", lineHeight: 1.2 }}>
            Action items
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--color-text-subtle)" }}>
            Open work first; completed items stay available for audit.
          </Typography>
        </Box>
        <Box sx={{ px: "var(--space-5)" }}>
          {data.actionItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: "var(--space-4)" }}>
              No action items declared in this sprint-status file.
            </Typography>
          ) : (
            data.actionItems.map((item) => (
              <ActionItemRow key={item.id} item={item} onOpenFile={onOpenFile} />
            ))
          )}
        </Box>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <Typography
          variant="overline"
          sx={{ color: "var(--color-text-subtle)", letterSpacing: "0.08em", px: 0.25 }}
        >
          Epics
        </Typography>

        {data.epics.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: "var(--space-5)",
              borderRadius: "var(--radius-card)",
              bgcolor: "var(--color-bg-raised)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No epics declared in this sprint-status file.
            </Typography>
          </Paper>
        ) : (
          data.epics.map((epic) => {
            const isExpanded = expandedEpicKeys.has(epic.epicKey);
            return (
              <Paper
                key={epic.epicKey}
                variant="outlined"
                sx={{
                  borderRadius: "var(--radius-card)",
                  boxShadow: "var(--elevation-card)",
                  bgcolor: "var(--color-bg-raised)",
                  overflow: "hidden",
                }}
              >
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
                    gap: "var(--space-3)",
                    px: "var(--space-5)",
                    py: "var(--space-4)",
                    cursor: "pointer",
                    borderBottom: isExpanded ? "1px solid var(--color-border-subtle)" : "none",
                    "&:hover": { bgcolor: "var(--color-bg-hover)" },
                    "&:focus-visible": {
                      outline: "2px solid var(--color-focus-ring)",
                      outlineOffset: -2,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 650,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {epic.epicKey}
                    </Typography>
                    <StatusChip status={epic.status} />
                    {epic.retrospectiveStatus && (
                      <Typography variant="caption" sx={{ color: "var(--color-text-subtle)" }}>
                        Retro · {formatStatusLabel(epic.retrospectiveStatus)}
                      </Typography>
                    )}
                  </Box>
                  {isExpanded ? (
                    <ExpandLessIcon fontSize="small" sx={{ color: "var(--color-text-subtle)" }} />
                  ) : (
                    <ExpandMoreIcon fontSize="small" sx={{ color: "var(--color-text-subtle)" }} />
                  )}
                </Box>
                {isExpanded && (
                  <Box sx={{ px: "var(--space-5)" }}>
                    {epic.steps.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: "var(--space-4)" }}>
                        No stories under this epic.
                      </Typography>
                    ) : (
                      epic.steps.map((step) => (
                        <StepRow key={step.key} step={step} onOpenFile={onOpenFile} />
                      ))
                    )}
                  </Box>
                )}
              </Paper>
            );
          })
        )}
      </Box>
    </StageFrame>
  );
}
