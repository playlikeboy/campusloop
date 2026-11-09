// Cloudflare Worker relay for the YouTube MCP Apps Script web app.
//
// Why: Apps Script answers every POST with a 302 to script.googleusercontent.com
// that must be fetched with GET. Current MCP SDKs (TypeScript >= 1.32,
// Python >= 2.x) refuse redirects that change origin or method, so they
// cannot talk to Apps Script directly. This relay follows the redirect
// server-side and returns a normal Streamable HTTP response (200 JSON, 202
// for notifications, 405 for GET). It also accepts the key as an
// "Authorization: Bearer <key>" header, which Apps Script cannot read.
//
// It stores no secrets: the MCP key travels with each request and is still
// checked by Apps Script. It only ever forwards to APPS_SCRIPT_URL.
//
// Deploy (from this folder):
//   npx wrangler deploy --var APPS_SCRIPT_URL:https://script.google.com/macros/s/XXXX/exec
// MCP endpoint:  https://youtube-mcp-relay.<your-subdomain>.workers.dev/mcp?key=<MCP_KEY>
//   (or the same URL without ?key and header  Authorization: Bearer <MCP_KEY>)

const FORWARDED_PARAMS = ["key", "groups", "mode"];
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

function rpcError(id, code, message) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "POST") {
      // No SSE stream and no sessions: the Streamable HTTP spec asks for 405 here.
      return new Response("This MCP endpoint only accepts POST.", { status: 405, headers: { Allow: "POST", ...CORS } });
    }
    if (!env.APPS_SCRIPT_URL || !/^https?:\/\/[^?#]+\/exec$/.test(env.APPS_SCRIPT_URL)) {
      return rpcError(null, -32603, "Relay misconfigured: set APPS_SCRIPT_URL to your Apps Script web app URL ending in /exec (without ?key).");
    }

    const incoming = new URL(request.url);
    const target = new URL(env.APPS_SCRIPT_URL);
    for (const name of FORWARDED_PARAMS) {
      const value = incoming.searchParams.get(name);
      if (value) target.searchParams.set(name, value);
    }
    const auth = request.headers.get("Authorization") || "";
    const bearer = auth.match(/^Bearer\s+(.+)$/i);
    if (bearer && !target.searchParams.has("key")) target.searchParams.set("key", bearer[1].trim());

    const body = await request.text();
    let id = null;
    try {
      const parsed = JSON.parse(body);
      if (parsed && !Array.isArray(parsed)) id = parsed.id ?? null;
    } catch {
      return rpcError(null, -32700, "Parse error: the request body must be JSON-RPC 2.0");
    }

    let upstream;
    try {
      upstream = await fetch(target.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        redirect: "follow",
      });
    } catch (err) {
      return rpcError(id, -32603, `Could not reach Apps Script: ${err.message}`);
    }

    const text = await upstream.text();
    const type = upstream.headers.get("Content-Type") || "";
    if (!upstream.ok || !/json/i.test(type)) {
      if (!text.trim() && upstream.ok) return new Response(null, { status: 202, headers: CORS });
      return rpcError(
        id,
        -32603,
        `Apps Script returned HTTP ${upstream.status} (${type || "no content type"}). Check that the deployment's "Who has access" is "Anyone", that APPS_SCRIPT_URL is the /exec URL of the current deployment, and the Executions log in the Apps Script editor.`,
      );
    }
    if (!text.trim()) return new Response(null, { status: 202, headers: CORS });
    return new Response(text, { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  },
};
