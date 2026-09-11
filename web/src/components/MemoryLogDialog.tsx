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
        color: "info.light",
        textDecoration: "underline",
      }}
    >
      {segment.text}
    </Box>
  );
}

// FR-012/FR-013: alternating row background by index - the same candy-striping
// convention SprintStatusView.tsx's StepRow already uses - with the category (when
// present) broken into its own primary.light header, separate from the body text.
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
        <Typography variant="caption" color="primary.light" sx={{ display: "block", fontWeight: 600 }}>
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
 * content, never a descendant of it, research.md § 6) but rendering `.memlog.md`'s bullets
 * via parseMemlogEntries instead of passing the content through ReactMarkdown.
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
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 10,
          padding: "4px",
          borderRadius: 1,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {hasPreamble && <FrontmatterInfoControl preamble={preamble} />}
        <IconButton onClick={onClose} aria-label="Close" size="small" sx={{ color: "common.white" }}>
          <CloseIcon />
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
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {entries.map((entry, index) => (
              <MemlogEntryRow key={index} entry={entry} index={index} onSelectReference={onSelectReference} />
            ))}
          </Box>
        )}
      </div>
    </Dialog>
  );
}
