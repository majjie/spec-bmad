import { useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getFileRenderMode } from "../fileRenderMode.js";
import { stringifyPreambleValue, stripFrontmatter } from "../frontmatter.js";
import CsvGrid from "./CsvGrid.js";

interface FileViewerDialogProps {
  path: string | null;
  content: string | null;
  error: string | null;
  onClose: () => void;
}

function fileNameOf(path: string): string {
  const segments = path.split("/");
  return segments[segments.length - 1] ?? path;
}

// FR-007/FR-008: one row per preamble entry, key and value in two distinct theme palette
// colors — no hardcoded hex, consistent with this app's existing theme-driven styling.
function PreambleReadout({ preamble }: { preamble: Record<string, unknown> }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, p: 0.5 }}>
      {Object.entries(preamble).map(([key, value]) => (
        <Box key={key} sx={{ display: "flex", gap: 1 }}>
          <Box component="span" sx={{ color: "info.light", fontWeight: 600 }}>
            {key}:
          </Box>
          <Box component="span" sx={{ color: "warning.light" }}>
            {stringifyPreambleValue(value)}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function DialogBody({ path, content, error }: { path: string; content: string | null; error: string | null }) {
  if (error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        {error}
      </Typography>
    );
  }

  if (content === null) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        Loading…
      </Typography>
    );
  }

  const mode = getFileRenderMode(fileNameOf(path));

  // csv-grid renders flush, with no ambient padding: its sticky header/row-number cells
  // need to sit right at the scroll container's own clip boundary. A padding gap between
  // that boundary and where the header actually sticks was found to leave a band where
  // scrolled-past rows stay visible, uncovered by the header — see the Box below.
  if (mode.kind === "csv-grid") {
    return <CsvGrid content={content} />;
  }

  if (mode.kind === "markdown") {
    return (
      <Typography
        component="div"
        sx={{
          p: 2,
          color: "text.primary",
          "& table, & th, & td": { borderColor: "divider" },
          "& code": { backgroundColor: "action.hover", borderRadius: 0.5, px: 0.5 },
          "& pre code": { backgroundColor: "transparent", padding: 0 },
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </Typography>
    );
  }

  if (mode.kind === "syntax") {
    // The `Prism` (full-bundle) export auto-registers every supported language, including
    // yaml/toml/python, so no per-language registration is needed (research.md § 4's
    // "light" build nuance doesn't apply to this export).
    return (
      <Box sx={{ p: 2 }}>
        <SyntaxHighlighter language={mode.language} style={vscDarkPlus} showLineNumbers>
          {content}
        </SyntaxHighlighter>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <SyntaxHighlighter language="text" style={vscDarkPlus} showLineNumbers>
        {content}
      </SyntaxHighlighter>
    </Box>
  );
}

export default function FileViewerDialog({ path, content, error, onClose }: FileViewerDialogProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  // Frontmatter stripping only ever applies to the Markdown render mode (FR-003), and only
  // once content has actually loaded — every other mode, and the loading/error states,
  // pass `content` straight through to `DialogBody` unchanged.
  const mode = path ? getFileRenderMode(fileNameOf(path)) : null;
  const frontmatter = mode?.kind === "markdown" && content !== null && !error ? stripFrontmatter(content) : null;
  const displayContent = frontmatter ? frontmatter.body : content;
  const preamble = frontmatter?.preamble ?? null;
  const hasPreamble = preamble !== null && Object.keys(preamble).length > 0;

  return (
    <Dialog
      open={path !== null}
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
          // Above any per-rendering-mode content — e.g. CsvGrid's frozen header cells,
          // which use zIndex up to 5 — so the close icon can never be painted over.
          zIndex: 10,
          padding: "4px",
          borderRadius: 1,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {hasPreamble && (
          <Tooltip
            title={<PreambleReadout preamble={preamble} />}
            open={infoOpen}
            onOpen={() => setInfoOpen(true)}
            onClose={() => setInfoOpen(false)}
            slotProps={{
              tooltip: {
                sx: {
                  // Opaque (not MUI's default translucent grey) and a larger base font
                  // size, per feedback — the readout was hard to read against varied
                  // Markdown content showing through it.
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
        )}
        <IconButton onClick={onClose} aria-label="Close" size="small" sx={{ color: "common.white" }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <div style={{ overflow: "auto", height: "100%" }}>
        {path && <DialogBody path={path} content={displayContent} error={error} />}
      </div>
    </Dialog>
  );
}
