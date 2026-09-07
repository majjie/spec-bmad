# Quickstart: Validating the File Content Viewer

Manual end-to-end validation for this feature, once implemented. Automated coverage for
the new server route and `getFileRenderMode` lives in `tests/unit/server/file.test.ts` and
`tests/unit/web/fileRenderMode.test.ts`; the dialog itself, its three rendering modes, and
its history integration are validated manually here, per constitution Principle V's
UI-rendering carve-out.

## Prerequisites

- Built and running per prior features' quickstarts: `npm install`, `npm run build:web`,
  `chmod +x src/cli.ts`.
- A sample project with one file of each kind:

  ```bash
  mkdir -p /tmp/bmad-file-viewer/project/_bmad
  cd /tmp/bmad-file-viewer/project/_bmad
  printf '# Title\n\n- item one\n- item two\n\n| A | B |\n|---|---|\n| 1 | 2 |\n' > readme.md
  printf 'key: value\nlist:\n  - a\n  - b\n' > config.yaml
  printf '[section]\nkey = "value"\n' > config.toml
  printf 'def hello():\n    print("hi")\n' > script.py
  printf 'plain text file\nsecond line\n' > notes.txt
  printf 'a,b,c\n1,2,3\n' > data.csv
  printf 'node_modules/\ndist/\n' > .gitignore
  printf 'no special rule for this one\n' > file.unknownext
  printf '\x00\x01\x02\x03random binary content follows\xffmore bytes' > binary.dat
  ```

- Start the CLI against `/tmp/bmad-file-viewer/project` and open the printed URL in a
  full-size desktop browser.

## Scenario 1 — Plain text file, X to close (User Story 1)

Double-click `notes.txt`.

**Expected**: a dialog opens, filling the viewport with a visible 20px border, showing
"plain text file" / "second line" in monospace font with line numbers `1`/`2` beside them.
Click the "X" icon in the top-right.

**Expected**: the dialog closes; the contents table underneath is unchanged from before.

## Scenario 2 — Double-clicking a folder does nothing extra (User Story 1)

Double-click the `_bmad` root row itself, or any subfolder if present.

**Expected**: nothing new opens — the same single-click folder navigation happens (or
nothing, if double-clicking just re-selects the already-selected folder).

## Scenario 3 — Unreadable/binary file shows an error (User Story 1)

Double-click `binary.dat`.

**Expected**: the dialog opens showing an error/unsupported message, not garbled
characters.

## Scenario 4 — Escape and Back both close the dialog (User Story 2)

Double-click `notes.txt` again. Press Escape.

**Expected**: the dialog closes. Double-click it again, then use the browser's Back
action.

**Expected**: the dialog closes the same way.

## Scenario 5 — Forward after Back reopens; Forward after X/Escape does not (User Story 2)

With the dialog closed via Back (previous scenario), press Forward.

**Expected**: the dialog reopens showing `notes.txt` again. Close it via the "X" icon this
time, then press Forward.

**Expected**: nothing reopens — Forward has nothing to go to, since closing via "X"
already stepped history back in sync.

## Scenario 6 — Markdown renders as formatted HTML (User Story 3)

Double-click `readme.md`.

**Expected**: "Title" appears as a real heading, "item one"/"item two" as a real bulleted
list, and the two-column table as an actual HTML table — not raw `#`/`-`/`|` characters.
No line numbers are shown.

## Scenario 7 — Syntax highlighting for YAML, TOML, and Python (User Story 4)

Double-click `config.yaml`, then `config.toml`, then `script.py` in turn.

**Expected**: each shows line numbers plus coloring appropriate to that language (e.g. the
YAML file's keys colored differently from its values; the Python file's `def`/keywords
colored differently from identifiers).

## Scenario 8 — Unrecognized extension and CSV fall back to plain text (Edge Cases)

Double-click `file.unknownext`, then `data.csv`.

**Expected**: both render exactly like Scenario 1 — plain monospace text with line
numbers, no highlighting.

## Scenario 9 — `.gitignore` renders as plain text (Edge Cases)

Double-click `.gitignore`.

**Expected**: renders as plain monospace text with line numbers, same as Scenario 1.
