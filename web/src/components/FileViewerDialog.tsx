import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getFileRenderMode } from "../fileRenderMode.js";
import { deriveFileViewerMeta } from "../fileViewerMeta.js";
import { fileViewerPaperSize } from "../fileViewerPaper.js";
import { stripFrontmatter } from "../frontmatter.js";
import { formatRunDate } from "../shell.js";
import CsvGrid from "./CsvGrid.js";
import FrontmatterInfoControl from "./FrontmatterInfoControl.js";
import MarkdownContent from "./MarkdownContent.js";
import { useColorScheme } from "./shell/ColorSchemeProvider.js";
import { StatusChip } from "./stage/StatusChip.js";

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
  const { scheme } = useColorScheme();
  const syntaxStyle = scheme === "light" ? oneLight : vscDarkPlus;

  if (error) {
    return (
      <Typography color="error" sx={{ p: "var(--space-5)" }}>
        {error}
      </Typography>
    );
  }

  if (content === null) {
    return (
      <Typography color="text.secondary" sx={{ p: "var(--space-5)" }}>
        Loading…
      </Typography>
    );
  }

  const mode = getFileRenderMode(fileNameOf(path));

  // csv-grid renders flush, with no ambient padding: its sticky header/row-number cells
  // need to sit right at the scroll container's own clip boundary.
  if (mode.kind === "csv-grid") {
    return <CsvGrid content={content} />;
  }

  if (mode.kind === "markdown") {
    return <MarkdownContent content={content} density="reader" />;
  }

  if (mode.kind === "syntax") {
    return (
      <Box sx={{ p: "var(--space-5)" }}>
        <SyntaxHighlighter language={mode.language} style={syntaxStyle} showLineNumbers>
          {content}
        </SyntaxHighlighter>
      </Box>
    );
  }

  return (
    <Box sx={{ p: "var(--space-5)" }}>
      <SyntaxHighlighter language="text" style={syntaxStyle} showLineNumbers>
        {content}
      </SyntaxHighlighter>
    </Box>
  );
}

function MetaBits({
  items,
}: {
  items: Array<{ label: string; mono?: boolean }>;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: "var(--space-2)",
        rowGap: 0.5,
        mt: "var(--space-2)",
      }}
    >
      {items.map((item, index) => (
        <Box key={`${item.label}-${index}`} sx={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
          {index > 0 && (
            <Typography component="span" variant="caption" sx={{ color: "var(--color-text-subtle)" }} aria-hidden>
              ·
            </Typography>
          )}
          <Typography
            component="span"
            variant="caption"
            sx={{
              color: "var(--color-text-subtle)",
              fontFamily: item.mono ? "var(--font-mono)" : "inherit",
            }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function FileViewerDialog({ path, content, error, onClose }: FileViewerDialogProps) {
  // Frontmatter stripping only ever applies to the Markdown render mode (FR-003), and only
  // once content has actually loaded - every other mode, and the loading/error states,
  // pass `content` straight through to `DialogBody` unchanged.
  const [expanded, setExpanded] = useState(false);
  const mode = path ? getFileRenderMode(fileNameOf(path)) : null;
  const frontmatter = mode?.kind === "markdown" && content !== null && !error ? stripFrontmatter(content) : null;
  const displayContent = frontmatter ? frontmatter.body : content;
  const preamble = frontmatter?.preamble ?? null;
  const hasPreamble = preamble !== null && Object.keys(preamble).length > 0;
  const meta = path ? deriveFileViewerMeta(path, preamble) : null;
  const paperSize = fileViewerPaperSize(expanded);

  useEffect(() => {
    if (path === null) {
      setExpanded(false);
    }
  }, [path]);

  const metaItems =
    meta === null
      ? []
      : [
          ...(meta.type ? [{ label: meta.type }] : []),
          ...(meta.created ? [{ label: formatRunDate(meta.created) }] : []),
          { label: meta.fileName, mono: true },
        ];

  return (
    <Dialog
      open={path !== null}
      onClose={onClose}
      {...(path ? { "aria-labelledby": "file-viewer-title" } : {})}
      sx={{
        "& .MuiDialog-paper": {
          ...paperSize,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "var(--color-bg-raised)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-overlay)",
          boxShadow: "var(--elevation-overlay)",
        },
      }}
    >
      {meta && (
        <Box
          component="header"
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            px: "var(--space-5)",
            pt: "var(--space-4)",
            pb: "var(--space-4)",
            borderBottom: "1px solid var(--color-border-subtle)",
            bgcolor: "var(--color-bg-surface)",
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
              <Typography
                id="file-viewer-title"
                variant="h6"
                sx={{
                  fontWeight: 650,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.25,
                  textWrap: "balance",
                  color: "var(--color-text-default)",
                }}
              >
                {meta.title}
              </Typography>
              {meta.status && <StatusChip status={meta.status} />}
            </Box>
            <MetaBits items={metaItems} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0, mt: -0.25 }}>
            {hasPreamble && preamble && <FrontmatterInfoControl preamble={preamble} />}
            <IconButton
              onClick={() => setExpanded((prev) => !prev)}
              aria-label={expanded ? "Shrink" : "Expand"}
              aria-pressed={expanded}
              size="small"
              sx={{ color: "var(--color-text-muted)" }}
            >
              {expanded ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
            </IconButton>
            <IconButton
              onClick={onClose}
              aria-label="Close"
              size="small"
              sx={{ color: "var(--color-text-muted)" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          bgcolor: "var(--color-bg-raised)",
        }}
      >
        {path && <DialogBody path={path} content={displayContent} error={error} />}
      </Box>
    </Dialog>
  );
}
