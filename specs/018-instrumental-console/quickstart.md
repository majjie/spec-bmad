# Quickstart: Verifying the Instrumental Console Redesign

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/ui-behavior.md](./contracts/ui-behavior.md)

Constitution Principle V requires UI changes to be manually verified in a running browser.
This is that script. Automated coverage of the derivation beneath it lives in
`tests/unit/web/shell.test.ts` and `tests/unit/web/onboarding.test.ts`.

## Prerequisites

```bash
npm run typecheck     # must be clean
npm test              # must be green
npm run build:web     # the CLI serves web/dist, which is not checked in
```

Then, from the repo root:

```bash
npx tsx src/cli.ts examples/sample-project
```

Open the printed `127.0.0.1` URL.

> **Reset onboarding between runs.** The welcome shows only once per browser profile. To see
> it again, clear the `bmad-browser:onboarding:v3` key from site data, or use a private
> window. A private window also exercises FR-020's blocked-storage path on some browsers.

---

## A. First run and onboarding (US2)

| # | Step | Expected |
|---|---|---|
| A1 | Open the URL in a profile that has never loaded the tool | The welcome appears, explaining the three document types and stating that the tool never writes to the project (FR-013, FR-014) |
| A2 | Read the actions offered | Exactly two paths: start the tour, or dismiss |
| A3 | Choose to skip | It closes immediately |
| A4 | Reload the page | The welcome does **not** return (FR-015, SC-003) |
| A5 | Activate Help in the header | The tour starts at step 1; the welcome does **not** reappear (FR-018) |
| A6 | Step through the tour | Each step highlights the element it describes - navigation, Overview, the stage, reload, Help |
| A7 | Press Escape mid-tour | The tour exits immediately (FR-017, SC-004) |
| A8 | Re-open Help, then dismiss via the tour's own skip control | Exits the same way - one action, from any step |
| A9 | Read step 1, then look at the sidebar | It names both *Requirements* (the section) and *PRDs* (what is inside it), matching the "latest PRD" annotation on a run |
| A10 | Point the CLI at a project with `_bmad` but no `_bmad-output` and start the tour | The Overview step is **omitted** - that anchor is not on the page in this configuration - and the counter reads one fewer. No step floats unanchored (T039a) |

## B. Orientation on first paint (US1)

| # | Step | Expected |
|---|---|---|
| B1 | With onboarding dismissed, reload | Overview is the selected item and the stage is **populated** - no "select something" prompt (FR-005, SC-002) |
| B2 | Read the header | Product identity plus the project name `Harbor`, resolved from the sprint data (contract § Header) |
| B3 | Read Overview's top row | Project, latest requirements, latest architecture, active epic, and open action items are all present |
| B4 | Check the active epic against the corpus | `epic-2` is `in-progress` in `sprint-status.yaml`, so it is the epic named (FR-011) |
| B5 | Read the sidebar's third group | Each raw-folder entry carries a caption naming the folder it maps to (FR-004) |
| B6 | Time yourself finding the active epic and opening a PRD from a cold start | Under one minute without help (SC-001) |

## C. Document navigation (US3)

| # | Step | Expected |
|---|---|---|
| C1 | Expand Requirements | Two dated runs, newest first |
| C2 | Read the newest run's label | A human date (`1 Sep 2026`), annotated as the latest **PRD** - the type is named, not just "latest" |
| C3 | Expand Architecture | Two runs; the newest annotated as the latest **architecture** |
| C4 | Note the absence of a project level | The corpus has one named project, so no `Harbor` grouping level is rendered (FR-008, SC-009) |
| C5 | Collapse Requirements, then select an architecture run | Requirements **stays collapsed** (FR-010, SC-008) |
| C6 | Collapse Architecture, then select a run inside it from Overview | Architecture stays collapsed; the document still opens |

## D. Sprint status (US4)

| # | Step | Expected |
|---|---|---|
| D1 | Select Sprint status | The view renders with `epic-2` already expanded, since it is in progress (FR-023) |
| D2 | Inspect any step's status | An icon **and** a text label - `Done`, `In review`, `In progress`, `Backlog` (FR-021, FR-022) |
| D3 | Apply a greyscale filter in devtools | Every status remains distinguishable (SC-005) |
| D4 | Look for project metadata | Collapsed behind a disclosure, not competing with status (FR-024) |
| D5 | Cross-check the open action-item count | Matches the number of items whose status is not `done` |
| D5a | Look at the order of the page | **Epics first**, action items below them (FR-026a). With a long action-item list, epics must still be visible without scrolling past it |
| D6 | Look at the Action items section | Full width, at its natural height - it does **not** scroll within itself, and is not height-matched to a neighbour (FR-025, superseding feature 008's FR-001-003) |
| D7 | Inspect one action item | Owner indication, completion indication, and a jump control whose accessible name is the raw reference; properties the item does not declare are absent, not blank |
| D8 | Activate a jump control | The referenced document opens in the file viewer |
| D9 | Check the row treatment | Divider-separated, not alternately shaded - superseding feature 008's FR-014 |
| D10 | Return to Overview | The outstanding items are listed there too, each with a direct open affordance (FR-026) |

## E. Accessibility and motion (US5)

| # | Step | Expected |
|---|---|---|
| E1 | Load the page and press Tab once | A control offering to skip to the main content (FR-028, SC-007) |
| E2 | Tab through the entire interface | Every navigation destination and header control is reachable and operable; focus is always visibly indicated (FR-030) |
| E3 | Hover or focus each header icon control | A text name appears, and is exposed to assistive technology (FR-029) |
| E4 | Enable "reduce motion" at the OS level, reload, replay the tour | No animated transitions; the reload indicator does not spin (FR-031) |
| E5 | Run a contrast check over body text and focus rings | Meets WCAG 2.1 AA (SC-006) |
| E6 | **In the light appearance**, open a PRD and hover a requirement-code tile and the reviews tile | The jump list is readable - a surface that follows the appearance, not a fixed dark panel with dark text (FR-027a, SC-006a) |
| E7 | **In the light appearance**, open a memory log | Its floating close/info cluster reads as a raised control on the dialog, not a dark chip |

## F. Degraded and empty corpora

| # | Step | Expected |
|---|---|---|
| F1 | Point the CLI at a directory containing `_bmad` but no `_bmad-output` | Curated document sections are omitted; the method folder remains browsable (Edge Cases) |
| F2 | Temporarily rename `sprint-status.yaml`, reload | The sprint entry is **absent**, not empty or disabled (FR-003); Overview points at requirements instead (FR-012) |
| F3 | Open the tool in a private window with site data blocked | The application still loads; the welcome simply appears again (FR-020) |
| F4 | Restore `sprint-status.yaml` | — |

## G. Multiple lineages and non-conforming folders (US3)

`examples/sample-project` covers these directly - it holds two named lineages (`harbor`,
`lumen`) plus a `scratch-workshop-notes` folder that follows no dated convention. No
temporary corpus is needed.

| # | Step | Expected |
|---|---|---|
| G1 | Expand Requirements | Runs nest under **Harbor** and **Lumen** (FR-008) |
| G2 | Read each lineage row | A summary of what it holds - Harbor "2 PRDs · 2 architectures", Lumen "1 PRD" |
| G3 | Expand Architecture | **Harbor** only. Lumen has no architecture run, so it is absent from this section entirely - not shown empty |
| G4 | Look below the named lineages under Requirements | An **Other** group holding `scratch-workshop-notes`, sorted last (FR-009) |
| G5 | Check the header | `Harbor`, from sprint data - which resolves the name even though two lineages exist (contract § Header) |
| G6 | Collapse the Lumen nest, then select a Harbor run | Lumen stays collapsed (FR-010, SC-008) |
| G7 | Move `prd-lumen-2026-08-28` out of the corpus and reload | The nesting disappears: one named lineage means no grouping level containing a single child (SC-009). Move it back afterwards. |

> G7 is the check that SC-009 is a real conditional rather than an accident of fixture
> shape. G2 is worth reading carefully: the summary it verifies was computed but rendered
> nowhere until this retrospective (T038b), and its unit test passed the whole time.

## H. The tool works offline (constitution Principle III)

Check the **built output**, not the source. This is the distinction the original defect turned
on: the source always looked reasonable, and the remote font link was only visible in what the
build actually emitted.

```bash
npm run build:web
grep -r 'fonts.googleapis.com\|fonts.gstatic.com' web/dist/   # must return nothing
ls web/dist/assets/*.woff2                                     # fonts are bundled
```

| # | Step | Expected |
|---|---|---|
| H1 | Run the grep above | No match anywhere in `web/dist/` |
| H2 | List the bundled fonts | The weights `theme.ts` maps are present as build assets |
| H3 | Disconnect the network entirely, then load the tool | The interface renders in IBM Plex, not a fallback stack |
| H4 | With the network still off, open a document, switch appearance, replay the tour | Everything works; no request fails |
| H5 | In devtools' network panel on a normal load, filter by domain | Every request is to `127.0.0.1` - nothing leaves the machine |

> H5 is the one that matters most and is easiest to skip. The principle's rationale is that
> this tool "renders potentially sensitive project documents"; an outbound request made while
> those documents are on screen is the risk, independent of whether the page looks right.

---

## Done when

Every row above passes, and `npm run typecheck`, `npm test`, and `npm run build:web` are
clean. Record any row that fails against the FR it cites rather than fixing it silently -
this feature is retrofitted, and a failing row means the spec describes something the code
does not actually do.
