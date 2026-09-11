import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import BrandMark from "./BrandMark.js";
import { useColorScheme } from "./ColorSchemeProvider.js";

interface AppHeaderProps {
  projectName?: string | null;
  refreshing: boolean;
  refreshFailed: boolean;
  onRefresh: () => void;
  onHelp: () => void;
}

export default function AppHeader({
  projectName,
  refreshing,
  refreshFailed,
  onRefresh,
  onHelp,
}: AppHeaderProps) {
  const { scheme, toggleScheme } = useColorScheme();
  const nextLabel = scheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

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
        bgcolor: "var(--color-bg-header)",
        boxShadow: "var(--elevation-header)",
        zIndex: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <BrandMark size={32} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 650, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            BMAD Browser
          </Typography>
          {projectName ? (
            <Typography
              variant="caption"
              sx={{ color: "var(--color-text-subtle)", display: "block", lineHeight: 1.2 }}
            >
              {projectName}
            </Typography>
          ) : null}
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Tooltip title={nextLabel}>
          <IconButton
            onClick={toggleScheme}
            aria-label={nextLabel}
            aria-pressed={scheme === "dark"}
            size="small"
            data-tour="color-scheme"
            sx={{ color: "var(--color-text-muted)" }}
          >
            {scheme === "dark" ? (
              <LightModeOutlinedIcon fontSize="small" />
            ) : (
              <DarkModeOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
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
