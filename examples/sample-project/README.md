# Harbor - sample BMAD project

Fictional design-system ops console used as **seed data** for BMAD Browser. It is not
product code; the CLI treats this folder as a target project because it contains `_bmad`
and `_bmad-output`.

BMAD Browser sessions are **one project folder at a time**. This seed is deliberately a
single lineage (**Harbor**) so the demo matches that model.

## What you should see

| Area | Contents |
| --- | --- |
| **Header** | Project name **Harbor** (from sprint-status.yaml) |
| **Documents → Requirements** | `prd-harbor` dated runs (latest `2026-09-01`) |
| **Documents → Architecture** | `architecture-harbor` (latest `2026-09-02`) |
| **Sprint status** | Epic-2 active |
| **Method / Generated** | Thin `_bmad` + full `_bmad-output` trees |

The full PRD leaf is `prd-harbor-2026-09-01` (reviews, addendum, memlog, requirement codes).
The full architecture leaf is `architecture-harbor-2026-09-02`.

## Run against this folder

From the repo root (after `npm install` and `npm run build:web`):

```bash
npx tsx src/cli.ts examples/sample-project
```

Open the URL printed on stdout (bound to `127.0.0.1`).
