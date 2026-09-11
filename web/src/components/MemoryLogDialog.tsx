import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { stripFrontmatter } from "../frontmatter.js";
import { parseMemlogEntries, type MemlogEntry, type MemlogSegment } from "../memlogParser.js";
import type { RequirementCodeReference } from "../prdIndex.js";
import FrontmatterInfoControl from "./FrontmatterInfoControl.js";

interface MemoryLogDialogProps {
  open: boolean;
  content: string | null;
  error: string | null;
  prdReferences: RequirementCodeReference[];
  onClose: () => void;
  onSelectReference: (id: string) => void;
}

function MemlogSegmentView({
  segment,
  onSelectReference,
}: {
  segment: MemlogSegment;
  onSelectReference: (id: string) => void;
}) {
  if (segment.kind === "text") {
    return <>{segment.value}</>;
  }
  if (segment.referenceId === null) {
    return <>{segment.text}</>;
  }
  return (
    <Box
      component="button"
      type="button"
      onClick={() => onSelectReference(segment.referenceId!)}
      sx={{
        all: "unset",
        cursor: "pointer",
        color: "var(--color-accent-strong)",
        textDecoration: "underline",
      }}
    >
      {segment.text}
    </Box>
  );
}

// Alternating row background by index - same candy-striping convention SprintStatusView
// StepRow uses - with the category (when present) broken into its own accent header.
function MemlogEntryRow({
  entry,
  index,
  onSelectReference,
}: {
  entry: MemlogEntry;
  index: number;
  onSelectReference: (id: string) => void;
}) {
  return (
    <Box sx={{ py: 0.5, px: 1, bgcolor: index % 2 === 0 ? "action.hover" : "transparent" }}>
      {entry.category !== null && (
        <Typography
          variant="caption"
          sx={{ display: "block", fontWeight: 600, color: "var(--color-accent)" }}
        >
          {entry.category}
        </Typography>
      )}
      <Typography variant="body2">
        {entry.segments.map((segment, segmentIndex) => (
          <MemlogSegmentView key={segmentIndex} segment={segment} onSelectReference={onSelectReference} />
        ))}
      </Typography>
    </Box>
  );
}

/**
 * The memory log tile's bespoke dialog (feature 013) - structurally modeled on
 * FileViewerDialog.tsx's own shell (the corner controls as a sibling of the scrolling
 * content, never a descendant of it) but rendering `.memlog.md`'s bullets via
 * parseMemlogEntries instead of ReactMarkdown.
 */
export default function MemoryLogDialog({
  open,
  content,
  error,
  prdReferences,
  onClose,
  onSelectReference,
}: MemoryLogDialogProps) {
  const frontmatter = content !== null && !error ? stripFrontmatter(content) : null;
  const body = frontmatter ? frontmatter.body : null;
  const preamble = frontmatter?.preamble ?? null;
  const hasPreamble = preamble !== null && Object.keys(preamble).length > 0;
  const entries = body !== null ? parseMemlogEntries(body, prdReferences) : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          margin: "20px",
          width: "calc(100% - 40px)",
          height: "calc(100% - 40px)",
          maxWidth: "none",
          maxHeight: "none",
          bgcolor: "var(--color-bg-raised)",
          backgroundImage: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 0.5,
          py: 0.25,
          borderRadius: "var(--radius-control)",
          bgcolor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-default)",
          boxShadow: "var(--elevation-card)",
        }}
      >
        {hasPreamble && <FrontmatterInfoControl preamble={preamble} />}
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="small"
          sx={{ color: "var(--color-text-muted)" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <div style={{ overflow: "auto", height: "100%" }}>
        {error && (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        )}
        {!error && content === null && (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            Loading…
          </Typography>
        )}
        {!error && content !== null && (
          <Box sx={{ display: "flex", flexDirection: "column", pt: 5 }}>
            {entries.map((entry, index) => (
              <MemlogEntryRow key={index} entry={entry} index={index} onSelectReference={onSelectReference} />
            ))}
          </Box>
        )}
      </div>
    </Dialog>
  );
}
