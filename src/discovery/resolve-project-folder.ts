import { dirname, join, resolve } from "node:path";
import { listRealEntries } from "../artifacts/fs-entries.js";
import { buildProjectRoot } from "../artifacts/project-root.js";
import type { DiscoveryCandidate, DiscoveryResult, ProjectRoot } from "../artifacts/types.js";

const SKIPPABLE_NAMES = new Set(["node_modules"]);

function isSkippable(name: string): boolean {
  return name.startsWith(".") || SKIPPABLE_NAMES.has(name);
}

async function safeListRealDirectories(
  dirPath: string,
): Promise<{ name: string }[]> {
  try {
    const entries = await listRealEntries(dirPath);
    return entries.filter((entry) => entry.isDirectory && !isSkippable(entry.name));
  } catch {
    return [];
  }
}

async function checkCandidate(dirPath: string): Promise<ProjectRoot | null> {
  try {
    return await buildProjectRoot(dirPath);
  } catch {
    return null;
  }
}

/**
 * Evaluates `parent` itself, plus its children (level 1) and their children (level 2),
 * for a real `_bmad`/`_bmad-output` folder (FR-009), skipping symlinked, hidden, and
 * dependency/build folders (FR-003, FR-013), and skipping (not aborting on) any
 * directory that cannot be read.
 */
async function findCandidates(parent: string): Promise<ProjectRoot[]> {
  const found: ProjectRoot[] = [];

  const parentRoot = await checkCandidate(parent);
  if (parentRoot) {
    found.push(parentRoot);
  }

  const level1Dirs = await safeListRealDirectories(parent);
  for (const level1Dir of level1Dirs) {
    const level1Path = join(parent, level1Dir.name);
    const level1Root = await checkCandidate(level1Path);
    if (level1Root) {
      found.push(level1Root);
    }

    const level2Dirs = await safeListRealDirectories(level1Path);
    for (const level2Dir of level2Dirs) {
      const level2Path = join(level1Path, level2Dir.name);
      const level2Root = await checkCandidate(level2Path);
      if (level2Root) {
        found.push(level2Root);
      }
    }
  }

  return found;
}

export async function resolveProjectFolder(
  target?: string,
): Promise<DiscoveryResult> {
  const resolvedTarget = resolve(target ?? process.cwd());
  const root = await buildProjectRoot(resolvedTarget);

  if (root) {
    return { kind: "valid", target: resolvedTarget, root, candidates: [] };
  }

  const parent = dirname(resolvedTarget);
  const candidateRoots = await findCandidates(parent);

  if (candidateRoots.length === 0) {
    return {
      kind: "invalid-no-candidates",
      target: resolvedTarget,
      root: null,
      candidates: [],
    };
  }

  const candidates: DiscoveryCandidate[] = candidateRoots.map((candidateRoot) => ({
    root: candidateRoot,
    suggestedInvocation: `bmad-browser ${candidateRoot.path}`,
  }));

  return {
    kind: "invalid-with-candidates",
    target: resolvedTarget,
    root: null,
    candidates,
  };
}
