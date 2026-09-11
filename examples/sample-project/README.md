# Harbor - sample BMAD project

Fictional design-system ops console used as **seed data** for BMAD Browser. It is not
product code; the CLI treats this folder as a target project because it contains `_bmad`
and `_bmad-output`.

BMAD Browser sessions are **one project folder at a time** - but a single folder can hold
more than one named lineage, and this seed deliberately does. **Harbor** is the main
initiative; **Lumen** is a sibling one living in the same output tree. That is what makes
the sidebar's per-lineage nesting visible here rather than only in unit tests (feature 018,
FR-008). A `scratch-workshop-notes` folder follows no dated convention, so it also exercises
the non-conforming group (FR-009).

## What you should see

| Area | Contents |
| --- | --- |
| **Header** | Project name **Harbor**, from `sprint-status.yaml` - which wins over the two lineages in the tree |
| **Documents → Requirements** | Nested by lineage: **Harbor** (`2026-09-01`, `2026-08-15`) and **Lumen** (`2026-08-28`), then an **Other** group holding `scratch-workshop-notes` |
| **Documents → Architecture** | **Harbor** only (`2026-09-02`, `2026-08-20`) - Lumen has no architecture run, so it does not appear here at all |
| **Sprint status** | Epic-2 active |
| **Method / Generated** | Thin `_bmad` + full `_bmad-output` trees |

Each lineage row carries a summary of what it holds - here **Harbor** reads
"2 PRDs · 2 architectures", **Lumen** reads "1 PRD", and the **Other** group reads
"Unsorted folders".

The full PRD leaf is `prd-harbor-2026-09-01` (reviews, addendum, memlog, requirement codes).
The full architecture leaf is `architecture-harbor-2026-09-02`. Lumen's single PRD is
deliberately thin - it exists to make a second lineage exist, not to be explored.

> Remove `prd-lumen-2026-08-28` and the nesting disappears, because with one named lineage
> the extra level would contain a single child (SC-009). Both shapes are worth seeing; the
> single-lineage one is a `mv` away.

## Run against this folder

From the repo root (after `npm install` and `npm run build:web`):

```bash
npx tsx src/cli.ts examples/sample-project
```

Open the URL printed on stdout (bound to `127.0.0.1`).
