import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { serveStaticFile } from "./static-files.js";

export interface RouteResponse {
  status: number;
  body?: unknown;
  /**
   * When set and `body` is a `string`, the body is sent as-is with this content type
   * instead of being JSON-encoded (feature 004 - serving a file's raw text contents).
   */
  contentType?: string;
}

/**
 * Handles one GET request's pathname/query. Returns `undefined` when the path isn't an
 * API route this server knows about, so the caller falls back to static file serving.
 */
export type ApiRequestHandler = (
  pathname: string,
  searchParams: URLSearchParams,
) => Promise<RouteResponse | undefined>;

export interface HttpServerHandle {
  url: string;
  close(): Promise<void>;
}

/**
 * Starts a dependency-free HTTP server bound to 127.0.0.1 on an OS-assigned port
 * (research.md § 6, constitution Principle III). `handleApiRequest` is injected so this
 * module has no knowledge of which specific routes exist.
 */
export async function startHttpServer(
  handleApiRequest: ApiRequestHandler,
): Promise<HttpServerHandle> {
  const server = createServer((req, res) => {
    void handleRequest(req, res, handleApiRequest);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo | null;
  if (address === null) {
    throw new Error("Failed to determine the server's listening address.");
  }
  const url = `http://127.0.0.1:${address.port}`;

  const close = (): Promise<void> =>
    new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });

  const onSigint = (): void => {
    void close().finally(() => process.exit(0));
  };
  process.once("SIGINT", onSigint);

  return { url, close };
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  handleApiRequest: ApiRequestHandler,
): Promise<void> {
  if (req.method !== "GET") {
    res.writeHead(405).end();
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");

  const apiResponse = await handleApiRequest(url.pathname, url.searchParams);
  if (apiResponse !== undefined) {
    sendResponse(res, apiResponse);
    return;
  }

  await serveStaticFile(url.pathname, res);
}

function sendResponse(res: ServerResponse, response: RouteResponse): void {
  if (response.body === undefined) {
    res.writeHead(response.status).end();
    return;
  }

  if (response.contentType !== undefined && typeof response.body === "string") {
    res.writeHead(response.status, { "Content-Type": response.contentType }).end(response.body);
    return;
  }

  const payload = JSON.stringify(response.body);
  res.writeHead(response.status, { "Content-Type": "application/json; charset=utf-8" }).end(payload);
}
