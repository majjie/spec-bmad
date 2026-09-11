---
title: "Harbor Design-System Ops Console"
type: "prd"
created: "2026-09-01"
status: "approved"
baseline_commit: "a1b2c3d4e5f6789012345678abcdef0123456789"
review_loop_iteration: 2
context: ["design-system", "ops-console"]
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

# Harbor - Product Requirements Document

Harbor is an internal console for design-system operators: token health, component
adoption, and release readiness in one place.

## Goals

- Give platform designers a single read-only view of token and component health
- Let engineering leads see adoption gaps without leaving the console
- Keep sprint tracking visible next to planning artifacts

## Functional requirements

- **FR-1** Operators can open a project and see token drift summarized on a dashboard.
- **FR-2** Operators can filter components by adoption tier (core, extended, experimental).
- **FR-3** Release managers can export a readiness checklist as Markdown.
- **FR-12** The console never writes back to the design-system repository.

## Non-functional requirements

- **NFR-1** Dashboard first paint under 2s on a warm cache for projects under 500 components.
- **NFR-2** All artifact paths stay on localhost; no remote upload of project files.

## User journeys

### UJ-1 - Scanning token health

An operator opens Harbor, selects the active brand, and reviews red/amber token deltas
before a release freeze.

### UJ-2 - Checking component adoption

A lead filters to experimental components, sorts by consumer count, and flags low-adoption
candidates for deprecation review.

## Acceptance matrix

| Area | Must | Should |
| --- | --- | --- |
| Token dashboard | FR-1 | NFR-1 |
| Adoption filters | FR-2 | UJ-2 |
| Export checklist | FR-3 | - |
| Read-only guarantee | FR-12 | NFR-2 |

## Example integration sketch

```typescript
type AdoptionTier = "core" | "extended" | "experimental";

export function filterByTier(
  components: { name: string; tier: AdoptionTier }[],
  tier: AdoptionTier,
) {
  return components.filter((c) => c.tier === tier);
}
```

## Out of scope

- Live editing of tokens or Figma variables
- Multi-tenant SaaS hosting

</frozen-after-approval>
