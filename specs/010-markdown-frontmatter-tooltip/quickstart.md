# Quickstart: Validating the Markdown Frontmatter Tooltip

Manual end-to-end validation once implemented. Automated coverage for
`stripFrontmatter()`/`stringifyPreambleValue()` lives in `tests/unit/web/frontmatter.test.ts`;
the info control's hover/click interaction and its color rendering are validated manually
here, per constitution Principle V's UI-rendering carve-out.

## Prerequisites

- Built and running per prior features' quickstarts: `npm install`, `npm run build:web`.
- A fixture project with a handful of Markdown files under any already-browsable folder
  (e.g. `_bmad-output/implementation-artifacts/`), covering every case this feature
  handles:

  ```bash
  mkdir -p /tmp/bmad-frontmatter/project/_bmad-output/implementation-artifacts
  cd /tmp/bmad-frontmatter/project/_bmad-output/implementation-artifacts

  # Case 1: YAML preamble + a wrapper marker element whose closing tag is at the very end.
  cat > spec-1-1-full-example.md <<'EOF'
  ---
  title: "Copy the artifact's path"
  type: 'feature'
  created: '2026-09-04'
  status: 'done'
  baseline_commit: 'd64f993073510e8ec56449ad9d5afb65bc7fac7e'
  review_loop_iteration: 0
  context: []
  ---

  <frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

  # Copy the artifact's path

  This is the actual document body. It should be the only thing visible when opened.

  </frozen-after-approval>
  EOF

  # Case 2: YAML preamble only, no marker element at all.
  cat > spec-1-2-yaml-only.md <<'EOF'
  ---
  title: "YAML only, no marker"
  status: 'open'
  ---

  # YAML only

  Body text after a bare YAML preamble.
  EOF

  # Case 3: no preamble at all — an ordinary Markdown file.
  cat > spec-1-3-no-preamble.md <<'EOF'
  # Ordinary document

  No preamble here at all.
  EOF

  # Case 4: starts with --- but isn't a YAML mapping (a horizontal rule at the very top).
  cat > spec-1-4-horizontal-rule.md <<'EOF'
  ---

  Not a preamble — just a Markdown file that happens to open with a horizontal rule.
  EOF
  ```

- Start the CLI against `/tmp/bmad-frontmatter/project` and open the printed URL in a
  full-size desktop browser. Open each file above via the Output tab.

## Scenario 1 — Full example: YAML + wrapper marker element (FR-001/FR-002)

Open `spec-1-1-full-example.md`. **Expected**: the rendered view shows only the heading
"Copy the artifact's path" and its body paragraph — no YAML syntax, no
`<frozen-after-approval ...>` or `</frozen-after-approval>` line anywhere in the view.

## Scenario 2 — Info control appears and shows the readout (FR-005–FR-008)

With the same file still open, **expected**: an informational "(i)" control sits next to
the "X" close control, in the same translucent container. Hovering it shows a readout
listing every preamble key (`title`, `type`, `created`, `status`, `baseline_commit`,
`review_loop_iteration`, `context`) alongside its value (`context`'s value reading as
`[]`), with keys and values in two visually distinct colors. Clicking the control (instead
of hovering) produces the same readout.

## Scenario 3 — YAML-only preamble, no marker element (FR-001, Edge Cases)

Open `spec-1-2-yaml-only.md`. **Expected**: the rendered view shows only "YAML only" and
its body paragraph; the info control still appears (a preamble was still detected) and its
readout shows `title`/`status`.

## Scenario 4 — No preamble at all (FR-006)

Open `spec-1-3-no-preamble.md`. **Expected**: renders exactly as it always has; no info
control appears next to the close control.

## Scenario 5 — A leading `---` that isn't this feature's preamble (FR-003/FR-004)

Open `spec-1-4-horizontal-rule.md`. **Expected**: renders exactly as it always has — the
horizontal rule displays as a normal Markdown rule, nothing is stripped, and no info
control appears.

## Scenario 6 — Non-Markdown files are unaffected (FR-003)

Open any non-Markdown file already used in prior features' quickstarts (e.g. a
`sprint-status.yaml` or `.csv` file). **Expected**: renders exactly as it already does
today (via its own syntax/CSV render mode) — no stripping, no info control. This holds
regardless of the file's own content shape, since FR-003 gates this feature entirely on
render mode, never on what the content looks like.
