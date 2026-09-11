# Cursor updates

- Added `examples/sample-project/` Harbor seed with `_bmad` / `_bmad-output` so Navigator, Infra, and Output have realistic demo artifacts.
- Redesigned BMAD Browser as an instrumental console (spec 018): token theme, product shell, Overview default, welcome modal, and skippable guided tour.
- Project-centric left nav (Harbor/Lumen accordions with Requirements/Architecture/Delivery), square selected rows, restored welcome+tour via onboarding v2, and removed the misleading Harbor product name from the header.
- Rebuilt Sprint status hierarchy (stat strip, disclosure, action list, epic accordions) and shared Stage frame/Panel/ListRow patterns with Overview; sharpened radii and flat nav selection.
- Overview uses the same StageFrame/StatStrip/Panel rhythm as Sprint for consistent spacing and hierarchy.
- Fixed sprint-status magnifying glass: map navigator file opens to `/api/file/output` instead of invalid `/api/file/navigator`.
- Matched Overview “Open file” to the outlined “Open sprint” button and pill-rounded all MUI buttons via `--button-radius`.
- Softened the shell: bound-document logo, rounded corners and elevation, clearer left-nav hierarchy, and project accordions that stay closed after collapse.
