# Feature Specification: Artifact Access Layer

**Feature Branch**: `001-artifact-access-layer`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Keep it simple, avoid over-engineering. Create an access layer for the BMAD artifacts: cache the folder/file hierarchy of a BMAD project in memory (not file contents), with a mechanism to invalidate and refresh it; ignore symlinks. CLI folder resolution: default to the current working directory when no folder is given; if the target folder has no `_bmad` or `_bmad-output` folder, tell the user the folder is invalid, then look one level up and crawl down two levels to find a folder that has `_bmad` or `_bmad-output` content, and suggest the correct CLI invocation."

## Clarifications

### Session 2026-09-07

- Q: Should the cached hierarchy include everything under the target project folder, or only what's inside its `_bmad` and `_bmad-output` subfolders? → A: Only cache the `_bmad` and `_bmad-output` subtrees (plus the folders themselves); unrelated content elsewhere in the target project folder is never scanned or cached.
- Q: When walking up to the parent directory to search for a valid project nearby, should the parent directory itself also be checked for `_bmad`/`_bmad-output`, or only its children and grandchildren? → A: Check the parent directory itself, plus its children (level 1) and grandchildren (level 2) — 3 levels of candidates total.
- Q: Should the discovery crawl skip conventionally-noisy directories (`.git`, `node_modules`, other hidden/dot folders), or crawl into everything within its two-level range? → A: Skip hidden (dot-prefixed) folders and common dependency/build folders (e.g. `node_modules`, `.git`) during the discovery crawl only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View the cached hierarchy of a valid project (Priority: P1)

A user runs BMAD Browser against a directory that is a real BMAD project (it contains a
`_bmad` and/or `_bmad-output` folder). The tool scans the folder/file structure once and
keeps it available in memory so that anything built on top of this access layer (e.g. a
future UI) can repeatedly ask "what does this project's artifact tree look like?" without
the disk being re-scanned every time.

**Why this priority**: Without a working, cached view of the hierarchy, there is nothing
for any other part of BMAD Browser to display or navigate. This is the foundation the rest
of the tool is built on.

**Independent Test**: Point the access layer at a directory containing `_bmad`/`_bmad-output`
folders with a known set of nested files and folders. Request the hierarchy twice in a row
and confirm both requests return the same structure and the second request does not
re-read the file system.

**Acceptance Scenarios**:

1. **Given** a target directory containing a `_bmad` folder with nested subfolders and
   files, **When** the hierarchy is requested for the first time, **Then** the returned
   structure matches the real folder/file layout of that `_bmad` folder on disk (names,
   paths, and file-vs-folder type for every entry within it), and does not include any
   other, unrelated content of the target directory.
2. **Given** a hierarchy that has already been built and cached, **When** the hierarchy is
   requested again without any refresh being triggered, **Then** the same in-memory result
   is returned without the file system being scanned again.

---

### User Story 2 - Refresh the cache after the project changes (Priority: P2)

While a project's cached hierarchy is being used, files and folders inside the BMAD
project change on disk (new artifacts appear, old ones are removed). The user (or a
component built on this layer) needs a way to force the cached hierarchy to be rebuilt so
it reflects the current state of the file system.

**Why this priority**: BMAD artifacts are generated continuously as a project's SDD process
proceeds. A cache that can never be refreshed would quickly show a stale, misleading view
of the project.

**Independent Test**: Build the initial cached hierarchy for a project, then add and remove
files/folders on disk. Trigger the refresh/invalidate mechanism and confirm the next
requested hierarchy reflects exactly the additions and removals made.

**Acceptance Scenarios**:

1. **Given** a previously cached hierarchy, **When** a file is added to the project on disk
   and the cache is invalidated/refreshed, **Then** the next requested hierarchy includes
   the new file.
2. **Given** a previously cached hierarchy, **When** a folder is removed from the project on
   disk and the cache is invalidated/refreshed, **Then** the next requested hierarchy no
   longer includes that folder or anything under it.

---

### User Story 3 - Get guided back to the right folder (Priority: P3)

A user runs the CLI without pointing it at a real BMAD project directory (or without
specifying a folder while sitting in the wrong directory). Instead of failing with no
help, the tool tells them the folder is invalid, looks nearby for a directory that does
look like a BMAD project, and gives them the exact command to run instead.

**Why this priority**: This directly affects first-run experience and how forgiving the
tool feels, but the tool is still useful without it as long as users can pass a correct
path manually. It builds on top of the folder-validity check already needed by User Story 1.

**Independent Test**: Run the CLI from/against a directory with no `_bmad` or
`_bmad-output` folder, where a sibling directory one level up (found within two levels of
descent) does contain one. Confirm the tool reports the given folder as invalid and prints
a suggested command pointing at the discovered project folder.

**Acceptance Scenarios**:

1. **Given** no folder argument is passed on the command line, **When** the CLI starts,
   **Then** it treats the current working directory as the target folder.
2. **Given** a target folder that contains neither a `_bmad` nor a `_bmad-output` folder,
   **When** the CLI evaluates it, **Then** it reports the folder as invalid rather than
   silently proceeding.
3. **Given** an invalid target folder whose parent directory has, within two levels below
   it, exactly one other directory containing `_bmad` or `_bmad-output`, **When** the CLI
   reports the folder as invalid, **Then** it also prints the exact CLI command to launch
   against that discovered directory.
4. **Given** an invalid target folder whose parent directory has, within two levels below
   it, more than one directory containing `_bmad` or `_bmad-output`, **When** the CLI
   reports the folder as invalid, **Then** it prints a suggested CLI command for each
   discovered directory.
5. **Given** an invalid target folder with no `_bmad`/`_bmad-output` directory found
   anywhere within two levels below its parent, **When** the CLI reports the folder as
   invalid, **Then** it tells the user no candidate project folder could be found nearby.

---

### Edge Cases

- What happens when a folder or file inside the project is a symlink? It (and everything
  under it, if it is a symlinked folder) is left out of the cached hierarchy entirely, as
  if it did not exist.
- What happens when the only `_bmad` or `_bmad-output` entry in the target folder is
  itself a symlink? Since symlinks are excluded, it does not count — the folder is still
  treated as invalid.
- What happens when a hierarchy refresh is triggered on a folder that no longer exists on
  disk at all? The system reports that the target folder can no longer be found rather
  than returning a stale or empty hierarchy silently.
- What happens when the crawl during folder discovery encounters a directory it does not
  have permission to read? That directory is skipped (treated as a non-match) and the
  crawl continues evaluating its other candidates.
- What happens when the only `_bmad`/`_bmad-output` folder found is reached through a
  symlinked intermediate directory during discovery? It does not count, consistent with
  FR-003 excluding symlinks from the discovery crawl entirely, not just the final match.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST build an in-memory hierarchical representation (a tree of
  folders and files, with name, path, and file-vs-folder type for each entry) rooted at
  each of the `_bmad` and `_bmad-output` folders that exist directly under the resolved
  target project folder. Other, unrelated content of the target project folder MUST NOT be
  scanned or included.
- **FR-002**: The system MUST NOT read or interpret the contents of any file while building
  or refreshing the hierarchy — only folder/file names, paths, and type are captured.
- **FR-003**: The system MUST exclude symlinked files and symlinked folders, and everything
  underneath a symlinked folder, from the cached hierarchy and from any folder-discovery
  crawl.
- **FR-004**: The system MUST serve repeated requests for a project's hierarchy from the
  in-memory cache, without re-scanning the file system, until that cache is invalidated.
- **FR-005**: The system MUST provide a mechanism to invalidate a project's cached
  hierarchy and rebuild it from the current state of the file system on the next request.
- **FR-006**: When the CLI is invoked without an explicit target folder, the system MUST
  use the current working directory as the target folder.
- **FR-007**: The system MUST consider a target folder valid only if it directly contains a
  `_bmad` folder or a `_bmad-output` folder that is a real directory (not a symlink).
- **FR-008**: When the target folder is invalid, the system MUST inform the user that the
  supplied folder is not a recognizable BMAD project.
- **FR-009**: When the target folder is invalid, the system MUST search for candidate
  project folders by evaluating the parent of the target folder itself, plus its
  descendants up to two directory levels deep, for the presence of a `_bmad` or
  `_bmad-output` folder as defined in FR-007.
- **FR-010**: When the search in FR-009 finds one or more candidate folders, the system
  MUST present the user with the exact CLI invocation syntax for launching against each
  discovered candidate.
- **FR-011**: When the search in FR-009 finds no candidate folders, the system MUST inform
  the user that no BMAD project could be located nearby.
- **FR-012**: When a hierarchy refresh is requested for a target folder that no longer
  exists on disk, the system MUST report that the folder cannot be found rather than
  returning a stale or empty hierarchy.
- **FR-013**: The discovery crawl in FR-009 MUST NOT descend into hidden (dot-prefixed)
  folders or conventional dependency/build folders (e.g. `node_modules`, `.git`); this
  exclusion applies only to the discovery crawl and does not affect what is cached under
  FR-001 for an already-valid project.
- **FR-014**: The CLI MUST support `--help` and `--version` flags: each MUST print
  usage/version information and exit `0` without attempting folder resolution, per
  constitution Principle IV.

### Key Entities

- **Artifact Node**: A single file or folder discovered within a project's hierarchy;
  carries a name, a path, its type (file or folder), and — for folders — its child Artifact
  Nodes.
- **Project Root**: The target folder that has been confirmed to directly contain a
  `_bmad` and/or `_bmad-output` folder. It is used to locate those folders but is not
  itself part of the cached hierarchy.
- **Hierarchy Cache**: The in-memory store holding the current Artifact Node tree for each
  of a Project Root's `_bmad`/`_bmad-output` folders, along with whether each tree is
  currently fresh or has been invalidated and needs rebuilding.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a valid project folder, repeated requests for the artifact hierarchy
  return identical, correct results without the file system being re-scanned, until a
  refresh is explicitly triggered.
- **SC-002**: After a refresh is triggered, 100% of file/folder additions and removals made
  on disk since the previous scan are reflected in the next returned hierarchy.
- **SC-003**: 100% of symlinked files and folders are absent from every returned hierarchy
  and from every folder-discovery search result.
- **SC-004**: When pointed at an invalid folder that has a valid BMAD project within two
  directory levels of its parent, a user receives a ready-to-run corrected command with no
  need to manually search the file system themselves.

## Assumptions

- The cache is in-memory and scoped to a single running instance of the tool; persisting
  the hierarchy across restarts, or sharing it across processes, is out of scope for this
  feature.
- This access layer only needs to expose a way to invalidate/refresh the cache; deciding
  *when* to call it (a manual command, a file-system watcher, a UI refresh button, etc.) is
  the responsibility of whatever consumes this layer and is out of scope here.
- "Crawl down two levels" means: the target folder's parent directory itself, its direct
  children (level 1), and their direct children in turn (level 2), are each checked for a
  `_bmad`/`_bmad-output` folder.
- Reading or parsing the contents of BMAD artifact files (e.g. the Markdown inside
  `_bmad-output`) is explicitly out of scope for this feature and is left for a later one.
- Only content inside `_bmad` and/or `_bmad-output` is cached; other files and folders in
  the target project folder (application source code, `node_modules`, `.git`, etc.) are
  never scanned or cached by this layer. Within a cached `_bmad`/`_bmad-output` subtree,
  hidden folders are not treated specially — they are included like any other folder,
  unless they are symlinks.
