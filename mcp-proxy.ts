/**
 * MCP Protocol-Translating Proxy
 *
 * Sits between Claude Code and Lens Studio's MCP server to translate
 * protocol versions. Lens Studio 5.17.1 only accepts version 2025-06-18.
 *
 * Usage: bun run mcp-proxy.ts
 */

const PROXY_PORT = 50050;
const UPSTREAM_URL = "http://localhost:50049/mcp";
const TARGET_PROTOCOL_VERSION = "2025-06-18";

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: {
    protocolVersion?: string;
    [key: string]: unknown;
  };
  id?: string | number;
}

function rewriteProtocolVersion(body: JsonRpcRequest): JsonRpcRequest {
  if (body.method === "initialize") {
    const originalVersion = body.params?.protocolVersion ?? "not specified";
    console.log(`[proxy] Claude Code protocol version: ${originalVersion}`);
    if (body.params) {
      body.params.protocolVersion = TARGET_PROTOCOL_VERSION;
      console.log(`[proxy] Rewrote to: ${TARGET_PROTOCOL_VERSION}`);
    }
  }
  return body;
}

const server = Bun.serve({
  port: PROXY_PORT,

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Log all incoming requests
    console.log(`[proxy] ${req.method} ${url.pathname}`);

    // Build upstream URL - forward the path to Lens Studio
    const upstreamUrl = `http://localhost:50049${url.pathname}${url.search}`;

    // Forward headers (excluding host)
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    });

    // For POST requests, try to parse and potentially modify the body
    let body: string | null = null;
    if (req.method === "POST") {
      const bodyText = await req.text();
      try {
        const jsonBody = JSON.parse(bodyText) as JsonRpcRequest;

        console.log(`[proxy] JSON-RPC method: ${jsonBody.method || "unknown"}`);

        // Rewrite protocol version for initialize requests
        const modifiedBody = rewriteProtocolVersion(jsonBody);
        body = JSON.stringify(modifiedBody);
      } catch {
        // Not valid JSON, forward as-is
        console.log(`[proxy] Non-JSON body, forwarding as-is`);
        body = bodyText;
      }
    }

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: req.method,
        headers,
        body: body,
      });

      // Log response status
      console.log(`[proxy] Response: ${upstreamResponse.status}`);

      // Forward response back with all headers
      const responseBody = await upstreamResponse.text();
      const responseHeaders = new Headers();
      upstreamResponse.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });

      return new Response(responseBody, {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("[proxy] Failed to connect to Lens Studio:", error);
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Proxy error: Cannot connect to Lens Studio MCP server at " + upstreamUrl,
          },
          id: null,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  MCP Protocol-Translating Proxy                              ║
╠══════════════════════════════════════════════════════════════╣
║  Proxy:    http://localhost:${PROXY_PORT}/mcp                       ║
║  Upstream: ${UPSTREAM_URL}                      ║
║  Target:   protocolVersion → ${TARGET_PROTOCOL_VERSION}                ║
╚══════════════════════════════════════════════════════════════╝
`);
console.log("[proxy] Waiting for connections...\n");
