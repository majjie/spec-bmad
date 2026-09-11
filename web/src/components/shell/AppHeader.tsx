import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import BrandMark from "./BrandMark.js";

interface AppHeaderProps {
  refreshing: boolean;
  refreshFailed: boolean;
  onRefresh: () => void;
  onHelp: () => void;
}

export default function AppHeader({
  refreshing,
  refreshFailed,
  onRefresh,
  onHelp,
}: AppHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        height: "var(--header-height)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        bgcolor: "var(--color-bg-surface)",
        boxShadow: "var(--elevation-header)",
        zIndex: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <BrandMark size={28} />
        <Typography variant="subtitle1" sx={{ fontWeight: 650, letterSpacing: "-0.02em" }}>
          BMAD Browser
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Tooltip title="Replay the guided tour">
          <IconButton
            onClick={onHelp}
            aria-label="Help - replay the guided tour"
            size="small"
            data-tour="help"
          >
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={refreshing ? "Reloading from disk…" : "Reload folder tree from disk"}>
          <span>
            <IconButton
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Reload from disk"
              size="small"
              data-tour="refresh"
              sx={{
                color: refreshFailed ? "error.main" : "inherit",
                "@keyframes spin": {
                  from: { transform: "rotate(0deg)" },
                  to: { transform: "rotate(360deg)" },
                },
                animation: refreshing ? "spin 0.6s var(--ease-out) infinite" : "none",
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}
