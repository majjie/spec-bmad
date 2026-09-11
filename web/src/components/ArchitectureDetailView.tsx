import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import HistoryIcon from "@mui/icons-material/History";
import RateReviewIcon from "@mui/icons-material/RateReview";
import type { ContentsEntry, PrdDateEntry, PrdNonConformingEntry } from "../api.js";
import { fetchContents, fetchFileContentOrNull } from "../api.js";
import { stripFrontmatter } from "../frontmatter.js";
import { buildRequirementCodeIndex, groupByPrefix, type RequirementCodeReference } from "../prdIndex.js";
import { buildReviewFileList, type ReviewFileReference } from "../reviewFiles.js";
import FrontmatterInfoControl from "./FrontmatterInfoControl.js";
import MarkdownContent from "./MarkdownContent.js";
import MemoryLogDialog from "./MemoryLogDialog.js";

interface ArchitectureDetailViewProps {
  entry: PrdDateEntry | PrdNonConformingEntry;
  onOpenFile: (path: string) => void;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "no-file" }
  | { kind: "error"; message: string }
  | { kind: "ready"; content: string };

type MemlogDialogState = { open: boolean; content: string | null; error: string | null };

const CLOSED_MEMLOG_DIALOG: MemlogDialogState = { open: false, content: null, error: null };

function fileBody({
  state,
}: {
  state: LoadState;
}): { body: string | null; preamble: Record<string, unknown> | null } {
  if (state.kind !== "ready") {
    return { body: null, preamble: null };
  }
  const frontmatter = stripFrontmatter(state.content);
  return { body: frontmatter.body, preamble: frontmatter.preamble };
}

function textOf(children: ReactNode): string {
  if (Array.isArray(children)) {
    return children.map((child) => (typeof child === "string" ? child : "")).join("");
  }
  return typeof children === "string" ? children : "";
}

// Header-style match only, for `### AD-1 - Some decision` - architecture never detects
// bullet-style codes at all (FR-005), so there is deliberately no `strong` override here,
// unlike PrdDetailView.tsx's own anchor-rendering.
// NOTE: the — here is DATA, not prose - one of the two accepted separators.
// Never include it in a punctuation sweep (see prdIndex.ts).
const HEADING_CODE_PATTERN = /^([A-Z]{2,})-(\d+)\s[—-]/;

interface PrefixTileProps {
  prefix: string;
  references: RequirementCodeReference[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelectReference: (id: string) => void;
}

// Re-declared here rather than imported - this is PrdDetailView.tsx's own file-local,
// non-exported component (plan.md, Structure Decision).
function PrefixTile({ prefix, references, open, onOpen, onClose, onSelectReference }: PrefixTileProps) {
  return (
    <Tooltip
      title={
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {references.map((reference) => (
            <Box
              key={reference.id}
              component="button"
              type="button"
              onClick={() => onSelectReference(reference.id)}
              sx={{
                all: "unset",
                cursor: "pointer",
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {reference.code}
            </Box>
          ))}
        </Box>
      }
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      // FR-008: leave disableInteractive unset (MUI's own default) so hover-through from
      // the tile onto the tooltip's own content keeps it open.
      leaveDelay={400}
      slotProps={{
        tooltip: {
          sx: { bgcolor: "grey.900", fontSize: "0.85rem", maxWidth: "none", maxHeight: "80vh", overflowY: "auto" },
        },
      }}
    >
      <Paper variant="outlined" onClick={onOpen} sx={{ px: 1, py: 0.5, textAlign: "center", cursor: "pointer" }}>
        <Typography variant="body2">{prefix}</Typography>
      </Paper>
    </Tooltip>
  );
}

// Re-declared here rather than imported - PrdDetailView.tsx's own file-local, non-exported
// ReviewsTile (feature 013). FR-013/FR-014: hovering (or clicking) reveals a tooltip
// listing each review by its friendly name, alphabetically; selecting one opens it via
// onOpenFile.
function ReviewsTile({
  reviews,
  onSelectReview,
}: {
  reviews: ReviewFileReference[];
  onSelectReview: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);
  const [tileWidth, setTileWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = tileRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setTileWidth(el.offsetWidth);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reviews.length > 0]);

  if (reviews.length === 0) {
    return (
      <Paper
        ref={tileRef}
        variant="outlined"
        sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.75, flex: 1 }}
      >
        <RateReviewIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.disabled">
          Reviews
        </Typography>
      </Paper>
    );
  }

  return (
    <Tooltip
      title={
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {reviews.map((review) => (
            <Box
              key={review.fileName}
              component="button"
              type="button"
              onClick={() => {
                onSelectReview(review.path);
                setOpen(false);
              }}
              sx={{
                all: "unset",
                cursor: "pointer",
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {review.displayName}
            </Box>
          ))}
        </Box>
      }
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      leaveDelay={400}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: "grey.900",
            fontSize: "0.85rem",
            maxWidth: "none",
            maxHeight: "80vh",
            overflowY: "auto",
            width: tileWidth !== null ? `${tileWidth}px` : undefined,
          },
        },
      }}
    >
      <Paper
        ref={tileRef}
        variant="outlined"
        onClick={() => setOpen(true)}
        sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.75, flex: 1, cursor: "pointer" }}
      >
        <RateReviewIcon fontSize="small" color="primary" />
        <Typography variant="body2">Reviews</Typography>
      </Paper>
    </Tooltip>
  );
}

// Re-declared here rather than imported - PrdDetailView.tsx's own file-local, non-exported
// SingleFileTile (feature 013). No addendum tile in this feature (FR-020) - only the
// memory log tile uses this.
function SingleFileTile({
  title,
  Icon,
  enabled,
  onClick,
}: {
  title: string;
  Icon: typeof HistoryIcon;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <Paper
      variant="outlined"
      onClick={enabled ? onClick : undefined}
      aria-disabled={!enabled}
      title={enabled ? undefined : "Not in this folder"}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        flex: 1,
        cursor: enabled ? "pointer" : "default",
      }}
    >
      <Icon fontSize="small" color={enabled ? "primary" : "disabled"} />
      <Typography variant="body2" color={enabled ? "text.primary" : "text.disabled"}>
        {enabled ? title : `${title} · not in this folder`}
      </Typography>
    </Paper>
  );
}

/**
 * The architecture leaf's own full-pane view (feature 016), superseding feature 015's bare
 * folder-name placeholder. Structurally mirrors PrdDetailView.tsx (features 012/013), but
 * narrower in scope: ARCHITECTURE-SPINE.md instead of prd.md, a header-only requirement-code
 * index, a reviews tile sourced from a "reviews" subfolder, a memory log tile with no links,
 * and no addendum tile (plan.md, Structure Decision).
 */
export default function ArchitectureDetailView({ entry, onOpenFile }: ArchitectureDetailViewProps) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [openPrefix, setOpenPrefix] = useState<string | null>(null);
  const [reviewsFolderFiles, setReviewsFolderFiles] = useState<ContentsEntry[]>([]);
  const [folderFiles, setFolderFiles] = useState<ContentsEntry[]>([]);
  const [memlogDialog, setMemlogDialog] = useState<MemlogDialogState>(CLOSED_MEMLOG_DIALOG);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    fetchFileContentOrNull("output", `${entry.path}/ARCHITECTURE-SPINE.md`).then(
      (content) => {
        if (cancelled) {
          return;
        }
        setState(content === null ? { kind: "no-file" } : { kind: "ready", content });
      },
      (error: unknown) => {
        if (cancelled) {
          return;
        }
        setState({ kind: "error", message: error instanceof Error ? error.message : String(error) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [entry.path]);

  // The reviews tile's own listing - the folder's "reviews" subfolder, not the leaf folder
  // itself (FR-011). A rejected fetch (subfolder absent) is treated as an empty listing,
  // the same catch-and-default-to-[] pattern PrdDetailView.tsx already uses for its own
  // folder-contents fetch (research.md § 3).
  useEffect(() => {
    let cancelled = false;
    setReviewsFolderFiles([]);
    fetchContents("output", `${entry.path}/reviews`).then(
      (entries) => {
        if (!cancelled) {
          setReviewsFolderFiles(entries);
        }
      },
      () => {
        if (!cancelled) {
          setReviewsFolderFiles([]);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [entry.path]);

  // A separate fetch of the leaf folder's own direct contents - used only to gate the
  // memory log tile (a file named exactly ".memlog.md", FR-015/FR-016), not the reviews
  // tile (contracts/ui-behavior.md).
  useEffect(() => {
    let cancelled = false;
    setFolderFiles([]);
    setMemlogDialog(CLOSED_MEMLOG_DIALOG);
    fetchContents("output", entry.path).then(
      (entries) => {
        if (!cancelled) {
          setFolderFiles(entries);
        }
      },
      () => {
        if (!cancelled) {
          setFolderFiles([]);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [entry.path]);

  const { body, preamble } = fileBody({ state });
  const hasPreamble = preamble !== null && Object.keys(preamble).length > 0;

  // Header-style only (FR-005) - bullet-style codes are never detected in an architecture
  // document, unlike PRD's own index (research.md § 1).
  const references = useMemo(() => (body !== null ? buildRequirementCodeIndex(body, ["header"]) : []), [body]);
  const groups = useMemo(() => groupByPrefix(references), [references]);

  // Reset once per render, before ReactMarkdown's own custom-renderer callback runs
  // (during this same synchronous render pass) - it consumes the next entry from
  // `references`, in document order, matching how buildRequirementCodeIndex assembled that
  // same order (mirroring PrdDetailView.tsx's own nextAnchorId technique).
  const anchorIndexRef = useRef(0);
  anchorIndexRef.current = 0;

  function nextAnchorId(matched: boolean): string | undefined {
    if (!matched) {
      return undefined;
    }
    const reference = references[anchorIndexRef.current];
    anchorIndexRef.current += 1;
    return reference?.id;
  }

  function handleSelectReference(id: string) {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
    setOpenPrefix(null);
  }

  const reviews = useMemo(() => buildReviewFileList(reviewsFolderFiles), [reviewsFolderFiles]);
  const hasMemlog = folderFiles.some((f) => f.type === "file" && f.name === ".memlog.md");

  function handleOpenMemlog() {
    setMemlogDialog({ open: true, content: null, error: null });
    fetchFileContentOrNull("output", `${entry.path}/.memlog.md`).then(
      (content) => {
        setMemlogDialog((prev) => (prev.open ? { ...prev, content } : prev));
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setMemlogDialog((prev) => (prev.open ? { ...prev, error: message } : prev));
      },
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", gap: 1, p: 1, flexShrink: 0 }}>
          <ReviewsTile reviews={reviews} onSelectReview={onOpenFile} />
          <SingleFileTile title="Memory log" Icon={HistoryIcon} enabled={hasMemlog} onClick={handleOpenMemlog} />
        </Box>
      </Box>
      <MemoryLogDialog
        open={memlogDialog.open}
        content={memlogDialog.content}
        error={memlogDialog.error}
        // Always empty - this feature never resolves a memory-log-mentioned requirement
        // code to a link, regardless of whether that code exists in the architecture
        // document (FR-019). An empty array means MemoryLogDialog's own existing
        // cross-referencing never matches anything, so every code renders as plain text
        // with zero new parsing/rendering logic (research.md § 4).
        prdReferences={[]}
        onClose={() => setMemlogDialog(CLOSED_MEMLOG_DIALOG)}
        onSelectReference={() => setMemlogDialog(CLOSED_MEMLOG_DIALOG)}
      />
      <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
        <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
          {hasPreamble && (
            // A sibling of the scrolling Box below, not a descendant of it - an
            // absolutely-positioned descendant of the element that itself scrolls would
            // scroll away with it, the exact bug PrdDetailView.tsx (feature 012) had to fix
            // once after shipping it wrong the first time.
            <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
              <FrontmatterInfoControl preamble={preamble} />
            </Box>
          )}
          <Box sx={{ height: "100%", overflow: "auto" }}>
            {state.kind === "loading" && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                Loading…
              </Typography>
            )}
            {state.kind === "no-file" && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No ARCHITECTURE-SPINE.md file was found in this folder.
              </Typography>
            )}
            {state.kind === "error" && (
              <Typography variant="body2" color="error" sx={{ p: 2 }}>
                {state.message}
              </Typography>
            )}
            {state.kind === "ready" && body !== null && (
              <Box sx={{ maxWidth: "65ch", px: 3, py: 2 }}>
              <MarkdownContent
                content={body}
                components={{
                  h3: ({ children, ...rest }) => {
                    const matched = HEADING_CODE_PATTERN.test(textOf(children));
                    const id = nextAnchorId(matched);
                    return (
                      <h3 id={id} {...rest}>
                        {children}
                      </h3>
                    );
                  },
                }}
              />
              </Box>
            )}
          </Box>
        </Box>
        {groups.length > 0 && (
          <Box
            sx={{
              width: 96,
              flexShrink: 0,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              p: 1,
              borderLeft: 1,
              borderColor: "divider",
            }}
          >
            {groups.map((group) => (
              <PrefixTile
                key={group.prefix}
                prefix={group.prefix}
                references={group.references}
                open={openPrefix === group.prefix}
                onOpen={() => setOpenPrefix(group.prefix)}
                onClose={() => setOpenPrefix((current) => (current === group.prefix ? null : current))}
                onSelectReference={handleSelectReference}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
