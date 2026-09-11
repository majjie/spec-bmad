---
title: "Group PRD folders"
type: "feature"
created: "2026-09-07"
status: "done"
baseline_commit: "4444444444444444444444444444444444444444"
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

# Spec 2-1 - Group PRD folders

## Intent

Navigator PRD view groups `planning-artifacts/prds` folders by project slug, then by date
newest-first, with non-conforming names listed literally.

## Acceptance

- `prd-harbor-2026-09-01` appears under Requirements → `1 Sep 2026 · latest PRD`
- `prd-harbor-2026-08-15` appears as the older dated run under the same section
- Multi-slug fixtures (unit tests only) nest under Requirements by slug when more than one named lineage exists

</frozen-after-approval>
