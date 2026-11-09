#!/usr/bin/env node
// stdio <-> HTTP bridge for the YouTube MCP Apps Script web app.
//
// Desktop and IDE MCP clients launch this as a local stdio server. Each
// JSON-RPC message is POSTed to the Apps Script endpoint with a plain fetch,
// which follows Apps Script's 302 redirect (current MCP SDKs refuse it).
// Zero dependencies; needs Node 18+.
//
// Usage:
//   node stdio-bridge.mjs "https://script.google.com/macros/s/XXXX/exec?key=MCP_KEY"
//   (or set YOUTUBE_MCP_URL instead of passing the URL)
//
// Claude Code:     claude mcp add youtube -- node /abs/path/stdio-bridge.mjs "<ENDPOINT>"
// Claude Desktop / Cursor / Windsurf (mcpServers JSON):
//   "youtube": { "command": "node", "args": ["/abs/path/stdio-bridge.mjs", "<ENDPOINT>"] }
import { createInterface } from "node:readline";

const endpoint = process.argv[2] || process.env.YOUTUBE_MCP_URL;
if (!endpoint || !/^https?:\/\//.test(endpoint)) {
  process.stderr.write('Usage: node stdio-bridge.mjs "<Apps Script /exec URL with ?key=...>"\n');
  process.exit(1);
}

let pending = 0;
let inputClosed = false;
const write = (msg) => process.stdout.write(`${JSON.stringify(msg)}\n`);
const maybeExit = () => {
  if (inputClosed && pending === 0) process.exit(0);
};

async function forward(message) {
  const isRequest = message && typeof message.method === "string" && message.id !== undefined && message.id !== null;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(message),
      redirect: "follow",
    });
    const text = await res.text();
    if (!text.trim()) return;
    if (!/json/i.test(res.headers.get("content-type") || "")) {
      throw new Error(
        `HTTP ${res.status} with a non-JSON reply. Check the deployment allows "Anyone", the URL ends in /exec, and the Apps Script Executions log.`,
      );
    }
    const reply = JSON.parse(text);
    for (const item of Array.isArray(reply) ? reply : [reply]) write(item);
  } catch (err) {
    process.stderr.write(`[youtube-mcp bridge] ${err.message}\n`);
    if (isRequest) write({ jsonrpc: "2.0", id: message.id, error: { code: -32603, message: `Bridge error: ${err.message}` } });
  }
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", (line) => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }
  pending++;
  forward(message).finally(() => {
    pending--;
    maybeExit();
  });
});
rl.on("close", () => {
  inputClosed = true;
  maybeExit();
});
