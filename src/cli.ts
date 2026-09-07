#!/usr/bin/env -S npx tsx
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHierarchyCache } from "./artifacts/cache.js";
import { resolveProjectFolder } from "./discovery/resolve-project-folder.js";
import { createApiRequestHandler } from "./server/api-router.js";
import { startHttpServer } from "./server/http-server.js";

const HELP_TEXT = `Usage: bmad-browser [folder]

Browse BMAD spec-driven-development artifacts from a localhost web UI.

Arguments:
  folder         Project directory to browse (defaults to the current working directory)

Options:
  --help         Show this help text and exit
  --version      Show the installed version and exit
`;

function readPackageVersion(): string {
  const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version: string;
  };
  return packageJson.version;
}

async function main(argv: string[]): Promise<void> {
  if (argv.includes("--help")) {
    process.stdout.write(HELP_TEXT);
    process.exitCode = 0;
    return;
  }

  if (argv.includes("--version")) {
    process.stdout.write(`${readPackageVersion()}\n`);
    process.exitCode = 0;
    return;
  }

  const target = argv[0];
  const result = await resolveProjectFolder(target);

  if (result.kind === "valid") {
    const cache = createHierarchyCache();
    const server = await startHttpServer(createApiRequestHandler(result.root!, cache));
    process.stdout.write(`${server.url}\n`);
    return;
  }

  process.stderr.write(`${result.target} is not a recognizable BMAD project.\n`);

  if (result.kind === "invalid-with-candidates") {
    for (const candidate of result.candidates) {
      process.stderr.write(`${candidate.suggestedInvocation}\n`);
    }
  } else {
    process.stderr.write("No BMAD project could be located nearby.\n");
  }

  process.exitCode = 1;
}

main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
