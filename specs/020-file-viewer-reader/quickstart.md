# Quickstart: Verifying the File Viewer Reading Surface

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/ui-behavior.md](./contracts/ui-behavior.md)

Constitution Principle V requires UI changes to be verified in a running browser. Automated
coverage of the derivations is in `tests/unit/web/fileViewerMeta.test.ts` and
`tests/unit/web/fileViewerPaper.test.ts`.

## Prerequisites

```bash
npm run typecheck && npm test && npm run build:web
npx tsx src/cli.ts examples/sample-project
```

Open the printed URL, then select **Sprint status** - its step rows are the quickest route
into the viewer.

## A. Identification (US1)

| # | Step | Expected |
|---|---|---|
| A1 | Open a step whose document declares a title | That title is the header (FR-001) |
| A2 | Open `spec-2-2-render-sprint-status.md` | If it declares no title, the header reads `Render sprint status` - prefix stripped, sentence-cased (FR-002) |
| A3 | Check a document declaring status / type / created | Each appears alongside the title (FR-003) |
| A4 | Check a document declaring none of them | Title alone - **no** empty fields, no placeholder labels (FR-003, SC-005) |
| A5 | Look for the filename | Identifiable somewhere in the header (FR-004) |
| A6 | Open a file whose name matches no convention - e.g. `coverage.csv` | Still a readable, non-empty title (SC-001) |

> A blank declared title (`title:` with no value) must be treated as **absent**, not honoured.
> That rule is verified by unit test (`fileViewerMeta.test.ts`), not here: it is pure string
> derivation with no rendering component, so a browser adds nothing to the check. The sample
> corpus deliberately does not carry such a document - it represents well-formed BMAD output,
> and seeding it with a malformed one to exercise a rule the test suite already pins would
> make the demo worse to read for no gain.

## B. Reading comfort (US2)

| # | Step | Expected |
|---|---|---|
| B1 | Open a long document with the browser maximised on a wide display | Prose sits in a bounded, centred column - it does **not** span the window (FR-005, SC-002) |
| B2 | Look past the panel | The application is still visible behind it; this reads as a panel, not a takeover (FR-006) |
| B3 | Widen and narrow the window while open | The measure stays comfortable; the panel shrinks rather than overflowing (FR-011) |
| B4 | Narrow the window to roughly phone width | Content is not clipped, and prose never needs sideways scrolling |

## C. Expansion (US3)

| # | Step | Expected |
|---|---|---|
| C1 | Open a document containing a wide table, then activate expand | The panel grows to nearly fill the window (FR-007) |
| C2 | Look at the prose in the expanded panel | It **widened** to use the room - it did not stay at the reading measure (FR-008) |
| C3 | Activate the control again | Returns to the reading size (SC-003) |
| C4 | Expand, then close, then open any other document | It opens at the **reading size** (FR-009, SC-004) |
| C5 | Inspect the control in the accessibility tree | Its pressed state is exposed, not just its label (FR-010) |
| C6 | Operate expand and close by keyboard alone | Both reachable and operable |

> C2 is the row that catches the coupling described in data-model.md § 4: the panel size and
> the content measure are decided in different modules from the same flag. A panel that grows
> while its prose stays narrow means they have drifted.

## D. Feature 017's rendering is intact (FR-012, SC-006)

| # | Step | Expected |
|---|---|---|
| D1 | Open a document containing a table | Full cell grid in the divider colour, as feature 017 established |
| D2 | Open a document with a fenced code block | Background visibly distinct from the prose, spanning the block's width |
| D3 | Open one whose fence declares a language | Syntax coloured as it is when opening a file of that type directly |
| D4 | Find a code block wider than the measure | Scrolls within its own block; the prose measure around it is unaffected |
| D5 | Repeat D1-D3 **expanded** | Identical rendering - only the width differs |
| D6 | Open a CSV file | Renders as the spreadsheet view (feature 005), unchanged, inside the panel |

## E. Both appearances

| # | Step | Expected |
|---|---|---|
| E1 | Repeat B1 and C1 in the light appearance | Panel surface and prose are legible; the panel is distinct from the page behind it |
| E2 | Check the panel's elevation in light | Reads as a raised surface, not a flat rectangle |

---

## Done when

Every row passes, and `npm run typecheck`, `npm test`, `npm run build:web` are clean.

Section D is a **regression check on a prior feature**, not a check on this one. If any D row
fails, this feature has broken feature 017 and the fix belongs here - `MarkdownContent` is
shared, and that is the cost of sharing it.
