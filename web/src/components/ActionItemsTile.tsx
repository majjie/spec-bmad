import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ComputerIcon from "@mui/icons-material/Computer";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { ActionItem } from "../api.js";

interface ActionItemsTileProps {
  actionItems: ActionItem[];
  onOpenFile: (path: string) => void;
  // The Summary tile's own measured height (SprintStatusView.tsx) — an explicit, definite
  // value (not CSS stretch) so this tile always matches it exactly regardless of how many
  // action items it holds, scrolling internally instead of growing past it (FR-002/FR-003).
  height: number;
}

// FR-005: anything other than exactly "dev loop" gets the human-outline icon.
// The extra `mr` (on top of the header row's own `gap`) widens only the gap before the
// status checkbox, to visually match the larger gap the jump control's own IconButton
// padding already creates before it (research.md § 1, feature 011 FR-001).
function OwnerIcon({ owner }: { owner: string }) {
  const Icon = owner === "dev loop" ? ComputerIcon : PersonOutlineIcon;
  return (
    <Tooltip title={owner}>
      <Icon fontSize="small" sx={{ mr: 0.75 }} />
    </Tooltip>
  );
}

// FR-006: filled iff status is exactly "done", else unfilled — never a third state.
function StatusCheckbox({ status }: { status: string }) {
  const Icon = status === "done" ? CheckBoxIcon : CheckBoxOutlineBlankIcon;
  return <Icon fontSize="small" />;
}

function JumpIcon({
  refText,
  resolvedPath,
  onOpenFile,
}: {
  refText: string;
  resolvedPath: string | null;
  onOpenFile: (path: string) => void;
}) {
  return (
    <Tooltip title={refText}>
      <span>
        <IconButton
          size="small"
          disabled={resolvedPath === null}
          onClick={() => {
            if (resolvedPath !== null) {
              onOpenFile(resolvedPath);
            }
          }}
        >
          <SearchIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
}

// FR-004: a header line (owner icon, tick-box, jump icon, epic label), then the action
// text on its own line below it — not inline with the header, per the post-implementation
// Clarifications correcting the original inline layout.
function ActionItemRow({
  item,
  index,
  onOpenFile,
}: {
  item: ActionItem;
  index: number;
  onOpenFile: (path: string) => void;
}) {
  return (
    <Box
      sx={{
        py: 0.5,
        px: 1,
        // FR-014: alternating row background ("candy stripe").
        bgcolor: index % 2 === 0 ? "action.hover" : "transparent",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {item.owner !== null && <OwnerIcon owner={item.owner} />}
        {item.status !== null && <StatusCheckbox status={item.status} />}
        {item.ref !== null && (
          <JumpIcon refText={item.ref} resolvedPath={item.resolvedPath} onOpenFile={onOpenFile} />
        )}
        {item.epic !== null && (
          <Typography variant="caption" color="text.secondary">
            epic-{item.epic}
          </Typography>
        )}
      </Box>
      {item.action !== null && <Typography variant="body2">{item.action}</Typography>}
    </Box>
  );
}

export default function ActionItemsTile({ actionItems, onOpenFile, height }: ActionItemsTileProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, flex: 1, minWidth: 260, height, display: "flex", flexDirection: "column" }}
    >
      {/* primary.light: the blue accent, deliberately pinned in theme.ts (feature 011
          FR-005, research.md § 4). */}
      <Typography variant="subtitle2" sx={{ color: "var(--color-accent)", mb: 1 }}>
        Action Items
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {actionItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No action items declared in this sprint-status file.
          </Typography>
        ) : (
          actionItems.map((item, index) => (
            <ActionItemRow key={item.id} item={item} index={index} onOpenFile={onOpenFile} />
          ))
        )}
      </Box>
    </Paper>
  );
}
