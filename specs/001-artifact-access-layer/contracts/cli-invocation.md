# Contract: CLI Folder Resolution (observable behavior)

This describes what a user running the CLI actually sees for this feature's scope
(folder resolution only — no artifact browsing UI exists yet in this feature). It is the
CLI's user-facing contract, built on top of `resolveProjectFolder` in
`contracts/access-layer.md`.

## Invocation

```text
bmad-browser [folder]
```

- `[folder]` is optional. Omitted → current working directory is used (FR-006).

## Outcome: valid folder

- Exit code `0`.
- No error output. (What happens next — launching the web server — is out of scope for
  this feature; this contract covers only that resolution succeeds silently.)

## Outcome: invalid folder, candidates found

- Exit code non-zero (folder resolution failed; the CLI does not proceed further this
  run).
- stderr includes:
  1. A message stating the given/defaulted folder is not a recognizable BMAD project
     (FR-008).
  2. One suggested invocation line per discovered candidate (FR-010), each of the form
     `bmad-browser <absolute-path-to-candidate>` — one line per entry in
     `DiscoveryResult.candidates`.

## Outcome: invalid folder, no candidates found

- Exit code non-zero.
- stderr includes the FR-008 message, followed by a message stating that no BMAD project
  could be located nearby (FR-011). No suggested command lines are printed.

## Notes for implementers (non-normative)

- Exact wording of messages is not fixed by the spec; the above defines only what
  information must be present and in what outcome each piece appears. Choose plain,
  direct wording consistent with constitution Principle IV (errors to stderr,
  human-readable).
- This contract intentionally does not define flag syntax beyond the single positional
  `[folder]` argument, since the spec does not require any other CLI options for this
  feature.
