/**
 * Sizing for the file viewer Dialog paper — compact reading panel vs nearly
 * full-viewport expand (98%).
 */
export function fileViewerPaperSize(expanded: boolean): {
  margin: string;
  width: string;
  maxWidth: string;
  height: string;
  maxHeight: string;
} {
  if (expanded) {
    return {
      margin: "1%",
      width: "98%",
      maxWidth: "98%",
      height: "98%",
      maxHeight: "98%",
    };
  }

  return {
    margin: "var(--space-4)",
    width: "min(880px, calc(100% - 32px))",
    maxWidth: "880px",
    height: "min(820px, calc(100% - 48px))",
    maxHeight: "calc(100% - 48px)",
  };
}
