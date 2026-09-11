import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { stringifyPreambleValue } from "../frontmatter.js";

interface FrontmatterInfoControlProps {
  preamble: Record<string, unknown>;
}

// FR-007/FR-008 (feature 010): one row per preamble entry, key and value in two distinct
// theme palette colors - no hardcoded hex, consistent with this app's existing
// theme-driven styling.
function PreambleReadout({ preamble }: { preamble: Record<string, unknown> }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, p: 0.5 }}>
      {Object.entries(preamble).map(([key, value]) => (
        <Box key={key} sx={{ display: "flex", gap: 1 }}>
          <Box component="span" sx={{ color: "var(--color-label)", fontWeight: 600 }}>
            {key}:
          </Box>
          <Box component="span" sx={{ color: "var(--color-value)", fontFamily: "var(--font-mono)", fontSize: "0.85em" }}>
            {stringifyPreambleValue(value)}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/**
 * The (i)-icon + hover-or-click controlled tooltip showing a Markdown file's frontmatter
 * key/value pairs - extracted out of `FileViewerDialog.tsx` (feature 010) so this same
 * control can also be reused, unmodified, by the non-modal PRD detail pane (feature 012),
 * which needs it without an accompanying close button.
 */
export default function FrontmatterInfoControl({ preamble }: FrontmatterInfoControlProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <Tooltip
      title={<PreambleReadout preamble={preamble} />}
      open={infoOpen}
      onOpen={() => setInfoOpen(true)}
      onClose={() => setInfoOpen(false)}
      slotProps={{
        tooltip: {
          sx: {
            // Opaque (not MUI's default translucent grey) and a larger base font size,
            // per feedback - the readout was hard to read against varied Markdown content
            // showing through it.
            bgcolor: "grey.900",
            fontSize: "0.85rem",
            maxWidth: "none",
          },
        },
      }}
    >
      <IconButton
        onClick={() => setInfoOpen(true)}
        aria-label="Frontmatter info"
        size="small"
        sx={{ color: "common.white" }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
