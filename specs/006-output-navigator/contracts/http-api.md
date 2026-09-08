# Contract: HTTP API — Navigator routes

Two new routes, alongside the existing `/api/tabs`, `/api/tree/:tab`, `/api/contents/:tab`,
`/api/file/:tab` (unchanged). Neither new route takes a `:tab` parameter — there is exactly
one Navigator tree and one sprint-status file per project, unlike the generic tab routes.

## `GET /api/tabs` (extended)

Response body gains one field, `navigator`, alongside the existing `infra`/`output`:

```json
{ "navigator": true, "infra": true, "output": true }
```

`navigator` is `true` iff `_bmad-output` exists for the resolved project (FR-002) — the
exact same underlying signal `output` already uses (`root.bmadOutputFolderPath !== null`).

## `GET /api/navigator/tree`

- **200**, body `NavigatorTree` (data-model.md) — always returned when `_bmad-output`
  exists, even if both `prd` is `null` and `sprintStatusAvailable` is `false` (an "empty"
  Navigator tree is a valid response, per spec.md's own Edge Cases).
- **404** — `_bmad-output` doesn't exist for this project. Shouldn't normally be reachable
  (the frontend only calls this once the tab itself — gated on the same condition — is
  active), but handled defensively the same way `getTreeResponse` already 404s for an
  absent tab folder.

## `GET /api/navigator/sprint-status`

- **200**, body `SprintStatusResult` (data-model.md).
- **404** — `sprint-status.yaml` doesn't exist. Defensive: the tree response already said
  `sprintStatusAvailable`, so this is only reachable via a race (file removed between the
  tree fetch and this one) — same class of defensive handling as feature 004's file route.
- **422**, body `{ "error": string }` — the file exists but `js-yaml` couldn't parse it
  (FR-014). `422` (not `415`, which this project already uses specifically for "this isn't
  text" in the generic file route) because the file *is* text, it just isn't valid YAML.

## Scope boundary

No route in this feature ever accepts a request body, a query parameter that mutates
state, or any method other than `GET` — read-only, consistent with every existing route
(constitution Principle II).
