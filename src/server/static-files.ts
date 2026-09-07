import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import type { ServerResponse } from "node:http";

const WEB_DIST_DIR = fileURLToPath(new URL("../../web/dist/", import.meta.url));

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
};

/**
 * Serves `pathname` from `web/dist/`, falling back to `web/dist/index.html` for any
 * unrecognized path (so the frontend's own client-side routing, if any, can take over).
 */
export async function serveStaticFile(pathname: string, res: ServerResponse): Promise<void> {
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(WEB_DIST_DIR, safePath);
  const indexPath = join(WEB_DIST_DIR, "index.html");

  try {
    const stats = await stat(filePath);
    if (stats.isFile()) {
      const contents = await readFile(filePath);
      const mimeType = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
      res.writeHead(200, { "Content-Type": mimeType }).end(contents);
      return;
    }
  } catch {
    // Falls through to index.html below.
  }

  try {
    const contents = await readFile(indexPath);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(contents);
  } catch {
    res.writeHead(404).end();
  }
}
