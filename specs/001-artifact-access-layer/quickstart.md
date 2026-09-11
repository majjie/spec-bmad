# Quickstart: Validating the Artifact Access Layer

Manual end-to-end validation for this feature, once implemented. Automated coverage lives
in `tests/unit/` and `tests/integration/` (see `plan.md` § Project Structure); this guide
is for a human to confirm the feature works as specced.

## Prerequisites

- Node.js ≥20 LTS installed.
- This package's dependencies installed (`npm install`).
- `src/cli.ts` is executable (`chmod +x src/cli.ts`) so it can be run directly via its own
  shebang - this makes it behave the same regardless of which directory it's run from,
  matching how it will run once published as the `bmad-browser` command.
- Set `CLI` to the repo's absolute path to `src/cli.ts` so the commands below work from
  any directory, e.g.: `CLI="$(pwd)/src/cli.ts"` (run from the repository root).
- A sample directory tree to test against - create one ad hoc, e.g.:

  ```bash
  mkdir -p /tmp/bmad-sample/project-a/_bmad/specs
  mkdir -p /tmp/bmad-sample/project-a/_bmad-output/reports
  touch /tmp/bmad-sample/project-a/_bmad/specs/spec.md
  touch /tmp/bmad-sample/project-a/_bmad-output/reports/summary.md
  mkdir -p /tmp/bmad-sample/not-a-project
  ```

## Scenario 1 - Cached hierarchy for a valid project (User Story 1)

```bash
"$CLI" /tmp/bmad-sample/project-a
```

**Expected**: succeeds (exit code `0`); the tool's internal hierarchy for this run
includes `specs/spec.md` under `_bmad` and `reports/summary.md` under `_bmad-output`, and
nothing from outside those two folders.

## Scenario 2 - Cache reuse (User Story 1)

Run the same command as Scenario 1 twice against a long-lived process (or, once a
future feature exposes a "list hierarchy" operation, call it twice in the same run).

**Expected**: the second call returns the same result without re-reading the directory
tree from disk - verified by the unit tests in `tests/unit/artifacts/cache.test.ts`
asserting the scanner is invoked only once between calls.

## Scenario 3 - Refresh after a change (User Story 2)

```bash
touch /tmp/bmad-sample/project-a/_bmad-output/reports/new-report.md
# trigger invalidate() + a subsequent get() via whatever this feature exposes for that
```

**Expected**: the hierarchy returned after invalidation includes `new-report.md`; deleting
a file and refreshing again removes it from the returned hierarchy.

## Scenario 4 - Invalid folder with a nearby candidate (User Story 3)

```bash
"$CLI" /tmp/bmad-sample/not-a-project
```

**Expected**: exit code non-zero; stderr reports `/tmp/bmad-sample/not-a-project` is not a
recognizable BMAD project, and suggests
`bmad-browser /tmp/bmad-sample/project-a` (found one level down from
`/tmp/bmad-sample`, the parent of the given folder).

## Scenario 5 - Invalid folder, nothing nearby

```bash
mkdir -p /tmp/bmad-sample-empty/nothing-here
"$CLI" /tmp/bmad-sample-empty/nothing-here
```

**Expected**: exit code non-zero; stderr reports the folder is invalid and that no BMAD
project could be found nearby.

## Scenario 6 - Symlinks are invisible (Edge Cases)

```bash
ln -s /tmp/bmad-sample/project-a/_bmad/specs/spec.md \
      /tmp/bmad-sample/project-a/_bmad/specs/spec-link.md
```

Re-run Scenario 1's command.

**Expected**: `spec-link.md` does not appear anywhere in the resulting hierarchy.

## Scenario 7 - No folder argument (User Story 3, FR-006)

```bash
(cd /tmp/bmad-sample/project-a && "$CLI")
```

**Expected**: behaves identically to Scenario 1 - the current working directory is used
as the target.
