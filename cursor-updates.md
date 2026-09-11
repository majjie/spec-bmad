# Cursor updates

- Added `examples/sample-project/` Harbor seed with `_bmad` / `_bmad-output` so Navigator, Infra, and Output have realistic demo artifacts.
- Redesigned BMAD Browser as an instrumental console (spec 018): token theme, product shell, Overview default, welcome modal, and skippable guided tour.
- Project-centric left nav (Harbor/Lumen accordions with Requirements/Architecture/Delivery), square selected rows, restored welcome+tour via onboarding v2, and removed the misleading Harbor product name from the header.
- Rebuilt Sprint status hierarchy (stat strip, disclosure, action list, epic accordions) and shared Stage frame/Panel/ListRow patterns with Overview; sharpened radii and flat nav selection.
- Overview uses the same StageFrame/StatStrip/Panel rhythm as Sprint for consistent spacing and hierarchy.
- Matched Overview “Open file” to the outlined “Open sprint” button and pill-rounded all MUI buttons.
- Softened the shell: bound-document logo, rounded corners and elevation, clearer left-nav hierarchy, and project accordions that stay closed after collapse.
- Polished status pills: larger type (0.8125rem), taller chip, and clearer icon–label spacing.
- Removed curved inset left-nav selection: full-bleed square selected rows, no floating pill margins or accent side-border.
- Added horizontal padding to ListRow (and Overview project captions) so date/Latest labels aren’t flush to the row highlight.
- Added a header light/dark mode switcher with persisted preference, light semantic tokens, and scheme-aware syntax highlighting.
- Aligned IA to Workspace / Products / Folders: Sprint sits under Workspace, Overview is product-first, and nav leaves use document dates instead of ISO.
- Redesigned the file viewer modal: centered ~880px panel with a proper header (title, status, type/date/filename) and calmer reader markdown.
- Softened light mode: warm sand/sage surfaces instead of white-grey, ochre accents, and layered low-opacity shadows for cards and overlays.
- Swapped light-mode sage chrome for muted mist blue (sidebar, selection, logo spine, favicon).
- Realigned IA to one BMAD project per session: Documents (Requirements/Architecture) replace the Products accordion; Harbor-only seed; header shows the project name; multi-slug nesting kept for tests only.

- Refined the welcome modal: tighter measure, clearer glossary spacing, and a read-only safety callout.
- Added an Expand control on the file viewer modal that toggles the panel to 98% of the screen.
- Expanded file viewer now drops the 72ch reader measure so markdown fills the wider panel.
- Gave welcome modal action buttons more horizontal padding and widened the dialog slightly (480→540).
- Raised StageHeader lede measure so the Harbor overview line stays on one row.
- Fixed Project details disclosure button horizontal padding (was px:0 against the pill).
- Sprint status lists epics before action items so delivery structure isn’t buried.
- Fixed PRD/architecture jump-list tooltip contrast (semantic bg/text instead of grey.900).
- Hardened light-mode icon and chrome contrast: muted IconButtons, stronger sand borders, semantic memory-log dialog.
