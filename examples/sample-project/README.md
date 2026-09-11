# Harbor - sample BMAD project

Fictional design-system ops console used as **seed data** for BMAD Browser. It is not
product code; the CLI treats this folder as a target project because it contains `_bmad`
and `_bmad-output`.

## What you should see

| Tab | Contents |
| --- | --- |
| **Navigator** | PRD groups (`prd-harbor`, `prd-lumen` + `scratch-workshop-notes`), Architecture (`architecture-harbor`), Sprint Status (epic-2 active) |
| **Infra** | Thin `_bmad` core config, agent stub, sprint-status workflow, sample Python script |
| **Output** | Full `_bmad-output` tree including specs, CSV, and planning folders |

The full PRD leaf is `prd-harbor-2026-09-01` (reviews, addendum, memlog, requirement codes).
The full architecture leaf is `architecture-harbor-2026-09-02`.

## Run against this folder

From the repo root (after `npm install` and `npm run build:web`):

```bash
npx tsx src/cli.ts examples/sample-project
```

Open the URL printed on stdout (bound to `127.0.0.1`).
