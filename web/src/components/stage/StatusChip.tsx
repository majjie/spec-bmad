import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import RateReviewIcon from "@mui/icons-material/RateReview";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { formatStatusLabel } from "../../shell.js";

const STATUS_META: Record<string, { Icon: typeof CheckCircleIcon; color: string }> = {
  done: { Icon: CheckCircleIcon, color: "var(--color-status-done)" },
  review: { Icon: RateReviewIcon, color: "var(--color-status-review)" },
  backlog: { Icon: Inventory2Icon, color: "var(--color-status-backlog)" },
  "in-progress": { Icon: AutorenewIcon, color: "var(--color-status-progress)" },
};

export function StatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status];
  const label = formatStatusLabel(status);
  if (!meta) {
    return (
      <Typography component="span" variant="caption" sx={{ color: "var(--color-text-muted)" }}>
        {label}
      </Typography>
    );
  }
  return (
    <Chip
      size="small"
      icon={<meta.Icon sx={{ color: `${meta.color} !important`, fontSize: "14px !important" }} />}
      label={label}
      sx={{
        height: 22,
        borderRadius: "var(--radius-control)",
        bgcolor: "transparent",
        border: "1px solid var(--color-border-default)",
        color: "var(--color-text-muted)",
        "& .MuiChip-label": { px: 0.75, fontSize: "0.7rem", fontWeight: 500 },
        "& .MuiChip-icon": { ml: 0.5 },
      }}
    />
  );
}
