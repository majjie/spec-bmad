import Typography from "@mui/material/Typography";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useColorScheme } from "./shell/ColorSchemeProvider.js";

interface MarkdownContentProps {
  content: string;
  components?: Components;
  /** `reader` adds calmer type rhythm for modal document viewing. */
  density?: "default" | "reader";
  /** When true with `reader`, drop the narrow measure so content fills the panel. */
  wide?: boolean;
}

// A `className` match only ever occurs for a fenced code block whose fence actually
// declared a language - never for an inline span (no wrapping `pre`, no `className` at
// all) and never for an undeclared-language block (wrapped in `pre`, but still no
// `className`) - so this is already a fully reliable signal with no need to separately
// detect "am I inside a pre" (research.md § 2/§ 3).
const FENCE_LANGUAGE_PATTERN = /language-(\w+)/;

/**
 * The shared Markdown-rendering piece (feature 017) - extracted out of
 * `FileViewerDialog.tsx`'s own "markdown" mode, `PrdDetailView.tsx`, and
 * `ArchitectureDetailView.tsx`, which each inlined this exact `Typography`/`ReactMarkdown`
 * pair and its own table/code `sx` styling identically (plan.md, Structure Decision). A
 * caller's own `components` overrides (e.g. requirement-code anchor-id assignment) are
 * merged in underneath this component's own `code` override, which always wins
 * (data-model.md, "Merge rule").
 */
export default function MarkdownContent({
  content,
  components,
  density = "default",
  wide = false,
}: MarkdownContentProps) {
  const { scheme } = useColorScheme();
  const syntaxStyle = scheme === "light" ? oneLight : vscDarkPlus;
  const reader = density === "reader";
  const narrowMeasure = reader && !wide;

  // The same Prism pairing FileViewerDialog.tsx's own whole-file "syntax" mode already
  // uses (FR-005), switched to oneLight when the shell is in light mode.
  const CodeBlock: NonNullable<Components["code"]> = ({ className, children, ...rest }) => {
    const match = FENCE_LANGUAGE_PATTERN.exec(className ?? "");
    if (!match) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <SyntaxHighlighter language={match[1]} style={syntaxStyle} PreTag="div" customStyle={{ margin: 0 }}>
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    );
  };

  return (
    <Typography
      component="div"
      sx={{
        p: reader ? "var(--space-5)" : 2,
        px: reader ? (wide ? "var(--space-8)" : "var(--space-6)") : 2,
        color: "var(--color-text-default)",
        maxWidth: narrowMeasure ? "72ch" : "none",
        mx: narrowMeasure ? "auto" : 0,
        width: wide && reader ? "100%" : undefined,
        boxSizing: "border-box",
        lineHeight: reader ? 1.65 : undefined,
        "& h1": {
          fontSize: reader ? "1.35rem" : undefined,
          fontWeight: 650,
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
          mt: 0,
          mb: reader ? "var(--space-4)" : undefined,
          textWrap: "balance",
        },
        "& h2": {
          fontSize: reader ? "1.05rem" : undefined,
          fontWeight: 650,
          letterSpacing: "-0.01em",
          mt: reader ? "var(--space-6)" : undefined,
          mb: reader ? "var(--space-3)" : undefined,
          paddingBottom: reader ? "var(--space-2)" : undefined,
          borderBottom: reader ? "1px solid var(--color-border-subtle)" : undefined,
        },
        "& h3, & h4": {
          fontWeight: 650,
          mt: reader ? "var(--space-5)" : undefined,
          mb: reader ? "var(--space-2)" : undefined,
        },
        "& p, & li": {
          color: "var(--color-text-default)",
          textWrap: "pretty",
        },
        "& p": {
          mb: reader ? "var(--space-3)" : undefined,
        },
        "& ul, & ol": {
          pl: reader ? "var(--space-5)" : undefined,
          mb: reader ? "var(--space-3)" : undefined,
        },
        "& table": { borderCollapse: "collapse", width: "100%", my: reader ? "var(--space-4)" : undefined },
        "& table, & th, & td": { border: "1px solid var(--color-border-default)" },
        "& th, & td": {
          px: reader ? "var(--space-3)" : undefined,
          py: reader ? "var(--space-2)" : undefined,
          textAlign: "left",
        },
        "& th": {
          bgcolor: "var(--color-bg-subtle)",
          fontWeight: 650,
          color: "var(--color-text-muted)",
        },
        "& code": {
          backgroundColor: "var(--color-bg-subtle)",
          borderRadius: "var(--radius-sm)",
          px: 0.5,
          fontFamily: "var(--font-mono)",
          fontSize: "0.85em",
        },
        "& pre": {
          backgroundColor: "var(--color-bg-subtle)",
          borderRadius: "var(--radius-control)",
          border: "1px solid var(--color-border-subtle)",
          p: reader ? "var(--space-4)" : 1.5,
          overflowX: "auto",
          my: reader ? "var(--space-4)" : undefined,
        },
        "& pre code": { backgroundColor: "transparent", padding: 0 },
        "& blockquote": {
          borderLeft: "3px solid var(--color-accent)",
          m: 0,
          pl: "var(--space-4)",
          color: "var(--color-text-muted)",
        },
        "& a": { color: "var(--color-accent-strong)" },
        "& hr": {
          border: "none",
          borderTop: "1px solid var(--color-border-subtle)",
          my: "var(--space-5)",
        },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...components, code: CodeBlock }}>
        {content}
      </ReactMarkdown>
    </Typography>
  );
}
