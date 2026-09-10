import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getFileRenderMode } from "../fileRenderMode.js";
import { stripFrontmatter } from "../frontmatter.js";
import CsvGrid from "./CsvGrid.js";
import FrontmatterInfoControl from "./FrontmatterInfoControl.js";
import MarkdownContent from "./MarkdownContent.js";

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
    return <MarkdownContent content={content} />;
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
        {hasPreamble && <FrontmatterInfoControl preamble={preamble} />}
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
