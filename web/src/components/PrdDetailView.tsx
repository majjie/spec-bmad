import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import HistoryIcon from "@mui/icons-material/History";
import PostAddIcon from "@mui/icons-material/PostAdd";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PrdDateEntry, PrdNonConformingEntry } from "../api.js";
import { fetchFileContentOrNull } from "../api.js";
import { stripFrontmatter } from "../frontmatter.js";
import { buildRequirementCodeIndex, groupByPrefix, type RequirementCodeReference } from "../prdIndex.js";
import FrontmatterInfoControl from "./FrontmatterInfoControl.js";

interface PrdDetailViewProps {
  entry: PrdDateEntry | PrdNonConformingEntry;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "no-file" }
  | { kind: "error"; message: string }
  | { kind: "ready"; content: string };

// One tile per placeholder — icon left of title, per FR-005; none of them carry any
// interaction logic in this feature.
const PLACEHOLDER_TILES = [
  { title: "reviews", Icon: RateReviewIcon },
  { title: "addendum", Icon: PostAddIcon },
  { title: "memory log", Icon: HistoryIcon },
];

function PlaceholderTilesRow() {
  return (
    <Box sx={{ display: "flex", gap: 1, p: 1, flexShrink: 0 }}>
      {PLACEHOLDER_TILES.map(({ title, Icon }) => (
        <Paper
          key={title}
          variant="outlined"
          sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.75, flex: 1 }}
        >
          <Icon fontSize="small" color="primary" />
          <Typography variant="body2">{title}</Typography>
        </Paper>
      ))}
    </Box>
  );
}

function textOf(children: ReactNode): string {
  if (Array.isArray(children)) {
    return children.map((child) => (typeof child === "string" ? child : "")).join("");
  }
  return typeof children === "string" ? children : "";
}

// Full-code-only match, for bullet-style `**FR-25**` — the whole <strong> text must be
// exactly the code, nothing else (data-model.md).
const STRONG_CODE_PATTERN = /^([A-Z]{2,})-(\d+)$/;
// Prefix match, for header-style `### UJ-1 — Verifying a completed stage` — the code sits
// at the start of the heading's text, followed by the title (data-model.md).
const HEADING_CODE_PATTERN = /^([A-Z]{2,})-(\d+)\s—/;

interface PrefixTileProps {
  prefix: string;
  references: RequirementCodeReference[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelectReference: (id: string) => void;
}

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
      // FR-011: the pointer moving from this tile onto the tooltip's own list must keep it
      // open — MUI's Tooltip is interactive (disableInteractive defaults to false) already
      // gives this for free, so that prop must never be set here. leaveDelay gives the
      // pointer a grace period to actually reach the tooltip's content before it closes —
      // MUI's own default is 0ms (closes instantly on mouseleave); set to 400ms per
      // feedback that it felt too abrupt.
      leaveDelay={400}
      slotProps={{
        tooltip: {
          sx: { bgcolor: "grey.900", fontSize: "0.85rem", maxWidth: "none", maxHeight: "80vh", overflowY: "auto" },
        },
      }}
    >
      <Paper
        variant="outlined"
        onClick={onOpen}
        sx={{ px: 1, py: 0.5, textAlign: "center", cursor: "pointer" }}
      >
        <Typography variant="body2">{prefix}</Typography>
      </Paper>
    </Tooltip>
  );
}

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

export default function PrdDetailView({ entry }: PrdDetailViewProps) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [openPrefix, setOpenPrefix] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    fetchFileContentOrNull("output", `${entry.path}/prd.md`).then(
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

  const { body, preamble } = fileBody({ state });
  const hasPreamble = preamble !== null && Object.keys(preamble).length > 0;

  const references = useMemo(() => (body !== null ? buildRequirementCodeIndex(body) : []), [body]);
  const groups = useMemo(() => groupByPrefix(references), [references]);

  // Reset once per render, before ReactMarkdown's own custom-renderer callbacks run
  // (during this same synchronous render pass) — each one consumes the next entry from
  // `references`, in document order, matching how buildRequirementCodeIndex assembled that
  // same order from a plain string scan (research.md § 3).
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

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <PlaceholderTilesRow />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
        <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
          {hasPreamble && (
            // A sibling of the scrolling Box below, not a descendant of it — an
            // absolutely-positioned descendant of the element that itself scrolls would
            // scroll away with it (the bug this fixed); staying outside that box, anchored
            // to this shared position:relative ancestor instead, is what keeps it fixed in
            // the corner regardless of how far the content scrolls, matching how
            // FileViewerDialog's own (i)/Close controls already stay fixed over its Dialog
            // content.
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
                No prd.md file was found in this folder.
              </Typography>
            )}
            {state.kind === "error" && (
              <Typography variant="body2" color="error" sx={{ p: 2 }}>
                {state.message}
              </Typography>
            )}
            {state.kind === "ready" && body !== null && (
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    strong: ({ children, ...rest }) => {
                      const matched = STRONG_CODE_PATTERN.test(textOf(children));
                      const id = nextAnchorId(matched);
                      return (
                        <strong id={id} {...rest}>
                          {children}
                        </strong>
                      );
                    },
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
                >
                  {body}
                </ReactMarkdown>
              </Typography>
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
