import Typography from "@mui/material/Typography";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownContentProps {
  content: string;
  components?: Components;
}

// A `className` match only ever occurs for a fenced code block whose fence actually
// declared a language - never for an inline span (no wrapping `pre`, no `className` at
// all) and never for an undeclared-language block (wrapped in `pre`, but still no
// `className`) - so this is already a fully reliable signal with no need to separately
// detect "am I inside a pre" (research.md § 2/§ 3).
const FENCE_LANGUAGE_PATTERN = /language-(\w+)/;

// The same `Prism`/`vscDarkPlus` pairing FileViewerDialog.tsx's own whole-file "syntax"
// mode already uses (FR-005). `PreTag="div"` swaps the highlighter's own default internal
// `<pre>` for a `<div>`, so the result nests as this component's own `<pre>` (carrying the
// plain-block background/padding above) around a `<div>` - valid markup, and the
// highlighter's own `vscDarkPlus` background simply paints over the outer one with no
// visible seam (research.md § 3). An unrecognized `language` value degrades to plain,
// uncolored text via Prism's own existing behavior - never an error (research.md § 4).
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
    <SyntaxHighlighter language={match[1]} style={vscDarkPlus} PreTag="div" customStyle={{ margin: 0 }}>
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
};

/**
 * The shared Markdown-rendering piece (feature 017) - extracted out of
 * `FileViewerDialog.tsx`'s own "markdown" mode, `PrdDetailView.tsx`, and
 * `ArchitectureDetailView.tsx`, which each inlined this exact `Typography`/`ReactMarkdown`
 * pair and its own table/code `sx` styling identically (plan.md, Structure Decision). A
 * caller's own `components` overrides (e.g. requirement-code anchor-id assignment) are
 * merged in underneath this component's own `code` override, which always wins
 * (data-model.md, "Merge rule").
 */
export default function MarkdownContent({ content, components }: MarkdownContentProps) {
  return (
    <Typography
      component="div"
      sx={{
        p: 2,
        color: "text.primary",
        "& table": { borderCollapse: "collapse" },
        "& table, & th, & td": { border: "1px solid", borderColor: "divider" },
        "& code": { backgroundColor: "action.hover", borderRadius: 0.5, px: 0.5 },
        "& pre": { backgroundColor: "action.hover", borderRadius: 1, p: 1.5, overflowX: "auto" },
        "& pre code": { backgroundColor: "transparent", padding: 0 },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...components, code: CodeBlock }}>
        {content}
      </ReactMarkdown>
    </Typography>
  );
}
