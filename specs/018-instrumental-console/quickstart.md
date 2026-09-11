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

## E. Accessibility and motion (US5)

| # | Step | Expected |
|---|---|---|
| E1 | Load the page and press Tab once | A control offering to skip to the main content (FR-026, SC-007) |
| E2 | Tab through the entire interface | Every navigation destination and header control is reachable and operable; focus is always visibly indicated (FR-028) |
| E3 | Hover or focus each header icon control | A text name appears, and is exposed to assistive technology (FR-027) |
| E4 | Enable "reduce motion" at the OS level, reload, replay the tour | No animated transitions; the reload indicator does not spin (FR-029) |
| E5 | Run a contrast check over body text and focus rings | Meets WCAG 2.1 AA (SC-006) |

## F. Degraded and empty corpora

| # | Step | Expected |
|---|---|---|
| F1 | Point the CLI at a directory containing `_bmad` but no `_bmad-output` | Curated document sections are omitted; the method folder remains browsable (Edge Cases) |
| F2 | Temporarily rename `sprint-status.yaml`, reload | The sprint entry is **absent**, not empty or disabled (FR-003); Overview points at requirements instead (FR-012) |
| F3 | Open the tool in a private window with site data blocked | The application still loads; the welcome simply appears again (FR-020) |
| F4 | Restore `sprint-status.yaml` | — |

## G. Cases the shipped sample corpus does **not** cover

`examples/sample-project` contains exactly one named project lineage (`harbor`) and no
non-conforming folders - an earlier revision had a second project and a scratch folder, and
both were removed when the sample was narrowed to a single project. Two requirements are
therefore **not** reachable through the demo as shipped, and need a temporary corpus:

```bash
cp -r examples/sample-project /tmp/bmad-multi
cd /tmp/bmad-multi/_bmad-output/planning-artifacts/prds
cp -r prd-harbor-2026-09-01 prd-lumen-2026-08-28     # a second named lineage
mkdir -p scratch-workshop-notes && echo '# Notes' > scratch-workshop-notes/notes.md
cd - && npx tsx src/cli.ts /tmp/bmad-multi
```

| # | Step | Expected |
|---|---|---|
| G1 | Expand Requirements | Runs now nest under `Harbor` and `Lumen` (FR-008) |
| G2 | Read each project's nest summary | States what it contains (e.g. PRD and architecture counts) |
| G3 | Look for the non-conforming folder | `scratch-workshop-notes` is reachable under a separate group, sorted **last** (FR-009) |
| G4 | Re-run C5 in this corpus | Collapsing a project's nest survives selecting within it (FR-010) |
| G5 | Check the header | With two lineages and sprint data naming `harbor`, the header shows `Harbor` (contract § Header) |

> This gap is worth noting in its own right: the multi-project path is unit-tested in
> `shell.test.ts` but is not exercised by anything a reviewer would open by default. A
> follow-up task in `tasks.md` proposes restoring a second lineage to the sample corpus so
> the demo covers its own requirements.

---

## Done when

Every row above passes, and `npm run typecheck`, `npm test`, and `npm run build:web` are
clean. Record any row that fails against the FR it cites rather than fixing it silently -
this feature is retrofitted, and a failing row means the spec describes something the code
does not actually do.
