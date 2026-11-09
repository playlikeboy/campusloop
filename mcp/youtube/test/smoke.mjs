// End-to-end smoke test for dist/Code.gs without a Google account.
// - Runs the bundle in a VM with mocked Apps Script services.
// - Fakes the YouTube Data/Upload/Analytics APIs, Google Drive and a CDN.
// - Serves doPost/doGet behind an HTTP server that mimics Apps Script's
//   302 -> script.googleusercontent.com redirect, then talks to it with raw
//   fetch and (if available) the official MCP SDK client.
//
// Run:  node mcp/youtube/build.mjs && node mcp/youtube/test/smoke.mjs
// With the SDK client: MCP_SDK_DIR=/path/with/node_modules node mcp/youtube/test/smoke.mjs
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const code = readFileSync(join(root, "dist", "Code.gs"), "utf8");
const MiB = 1024 * 1024;
let passed = 0;
const check = async (name, fn) => {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
};

/* ------------------------------------------------------------ fixtures -- */

const pattern = (size, seed) => {
  const b = Buffer.alloc(size);
  for (let i = 0; i < size; i++) b[i] = (i * 31 + seed) & 255;
  return b;
};
const sha = (b) => createHash("sha256").update(b).digest("hex");
const SOURCES = {
  "https://cdn.example.com/big-vertical.mp4": { buf: pattern(50 * MiB + 12345, 7), range: true, type: "video/mp4" },
  "https://cdn.example.com/no-range.mov": { buf: pattern(3 * MiB, 3), range: false, type: "application/octet-stream" },
  "https://cdn.example.com/thumb.jpg": { buf: pattern(40 * 1024, 9), range: false, type: "image/jpeg" },
  "https://cdn.example.com/page": { buf: Buffer.from("<html>login</html>"), range: false, type: "text/html; charset=utf-8" },
};
const DRIVE = { "1AbCdEfGhIjKlMnOpQrStUvWxYz012345": { name: "lecture.mp4", mimeType: "video/mp4", buf: pattern(45 * MiB, 11) } };

/* ------------------------------------------------- fake Google backend -- */

const state = {
  channel: { id: "UCabcdefghijklmnopqrstuv", title: "Test Channel", customUrl: "@testchannel", uploads: "UUabcdefghijklmnopqrstuv" },
  videos: new Map(),
  uploadsOrder: [],
  sessions: new Map(),
  playlistItems: [],
  thumbnails: new Map(),
  failNextPut: 0,
  requests: [],
};

function json(status, body, headers = {}) {
  return { status, headers: { "Content-Type": "application/json; charset=UTF-8", ...headers }, body: Buffer.from(JSON.stringify(body)) };
}
function apiErr(status, reason, message) {
  return json(status, { error: { code: status, message, errors: [{ reason, message }] } });
}
function serveRange(src, rangeHeader) {
  if (src.range && rangeHeader) {
    const [, s, e] = rangeHeader.match(/bytes=(\d+)-(\d+)/);
    const start = Number(s);
    const end = Math.min(Number(e), src.buf.length - 1);
    return {
      status: 206,
      headers: { "Content-Type": src.type, "Content-Range": `bytes ${start}-${end}/${src.buf.length}`, "Content-Length": String(end - start + 1) },
      body: src.buf.subarray(start, end + 1),
    };
  }
  return { status: 200, headers: { "Content-Type": src.type, "Content-Length": String(src.buf.length) }, body: src.buf };
}
function makeVideo(resource, size) {
  const id = randomUUID().replace(/-/g, "").slice(0, 11);
  const video = {
    kind: "youtube#video",
    id,
    snippet: { ...resource.snippet, publishedAt: new Date().toISOString(), channelId: state.channel.id, thumbnails: {} },
    status: { uploadStatus: "uploaded", ...resource.status },
    contentDetails: { duration: size > 48 * MiB ? "PT45S" : "PT10M2S" },
    statistics: { viewCount: "0", likeCount: "0", commentCount: "0" },
    fileDetails: { videoStreams: size > 48 * MiB ? [{ widthPixels: 1080, heightPixels: 1920 }] : [{ widthPixels: 1920, heightPixels: 1080 }] },
  };
  state.videos.set(id, video);
  state.uploadsOrder.unshift(id);
  return video;
}

function google(method, url, headers, body) {
  const u = new URL(url);
  const q = Object.fromEntries(u.searchParams);
  const h = Object.fromEntries(Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
  state.requests.push(`${method} ${u.hostname}${u.pathname}`);

  if (SOURCES[url]) return serveRange(SOURCES[url], h.range);
  if (u.hostname !== "www.googleapis.com" && u.hostname !== "youtubeanalytics.googleapis.com") return { status: 404, headers: {}, body: Buffer.from("nope") };
  if (h.authorization !== "Bearer test-token") return apiErr(401, "authError", "Invalid Credentials");

  const p = u.pathname;
  if (p.startsWith("/drive/v3/files/")) {
    const f = DRIVE[decodeURIComponent(p.split("/").pop())];
    if (!f) return apiErr(404, "notFound", "File not found");
    if (q.alt === "media") return serveRange({ buf: f.buf, range: true, type: f.mimeType }, h.range);
    return json(200, { id: "x", name: f.name, mimeType: f.mimeType, size: String(f.buf.length) });
  }
  if (p === "/youtube/v3/channels" && method === "GET") {
    const c = state.channel;
    return json(200, {
      items: [
        {
          id: c.id,
          snippet: { title: c.title, customUrl: c.customUrl, description: "desc" },
          contentDetails: { relatedPlaylists: { uploads: c.uploads } },
          statistics: { subscriberCount: "1200", viewCount: "99000", videoCount: String(state.videos.size), hiddenSubscriberCount: false },
          brandingSettings: { channel: { description: "desc", keywords: "a b" }, image: { bannerExternalUrl: "https://yt3/banner" } },
          status: { privacyStatus: "public" },
        },
      ],
    });
  }
  if (p === "/upload/youtube/v3/videos" && method === "POST" && q.uploadType === "resumable") {
    const resource = JSON.parse(body.toString("utf8"));
    if (!resource.snippet || !resource.snippet.title) return apiErr(400, "invalidTitle", "No title");
    const sid = randomUUID();
    const total = h["x-upload-content-length"] ? Number(h["x-upload-content-length"]) : null;
    state.sessions.set(sid, { resource, parts: q.part, total, chunks: [], received: 0, video: null });
    return { status: 200, headers: { Location: `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&upload_id=${sid}` }, body: Buffer.alloc(0) };
  }
  if (p === "/upload/youtube/v3/videos" && method === "PUT") {
    const s = state.sessions.get(q.upload_id);
    if (!s) return apiErr(404, "notFound", "No session");
    const cr = h["content-range"] || "";
    const statusQuery = cr.match(/^bytes \*\/(\d+|\*)$/);
    if (statusQuery) {
      if (s.video) return json(200, s.video);
      return s.received ? { status: 308, headers: { Range: `bytes=0-${s.received - 1}` }, body: Buffer.alloc(0) } : { status: 308, headers: {}, body: Buffer.alloc(0) };
    }
    if (state.failNextPut > 0) {
      state.failNextPut--;
      return apiErr(503, "backendError", "Temporary");
    }
    if (state.putDelayMs) {
      const until = Date.now() + state.putDelayMs;
      while (Date.now() < until);
    }
    const m = cr.match(/^bytes (\d+)-(\d+)\/(\d+|\*)$/);
    assert.ok(m, `bad Content-Range ${cr}`);
    const start = Number(m[1]);
    const end = Number(m[2]);
    const total = m[3] === "*" ? null : Number(m[3]);
    assert.equal(start, s.received, "chunk must continue at the confirmed offset");
    assert.equal(body.length, end - start + 1, "chunk length must match Content-Range");
    const isLast = total !== null && end + 1 === total;
    if (!isLast) assert.equal(body.length % 262144, 0, "non-final chunks must be multiples of 256 KiB");
    s.chunks.push(Buffer.from(body));
    s.received = end + 1;
    if (isLast) {
      s.data = Buffer.concat(s.chunks);
      s.video = makeVideo(s.resource, s.data.length);
      return json(200, s.video);
    }
    return { status: 308, headers: { Range: `bytes=0-${end}` }, body: Buffer.alloc(0) };
  }
  if (p === "/youtube/v3/videos" && method === "GET") {
    const ids = (q.id || "").split(",");
    return json(200, { items: ids.map((id) => state.videos.get(id)).filter(Boolean) });
  }
  if (p === "/youtube/v3/videos" && method === "PUT") {
    const b = JSON.parse(body.toString("utf8"));
    const v = state.videos.get(b.id);
    if (!v) return apiErr(404, "videoNotFound", "Video not found");
    for (const part of q.part.split(",")) v[part] = b[part];
    return json(200, v);
  }
  if (p === "/youtube/v3/videos" && method === "DELETE") {
    state.videos.delete(q.id);
    return { status: 204, headers: {}, body: Buffer.alloc(0) };
  }
  if (p === "/youtube/v3/playlistItems" && method === "GET") {
    if (q.playlistId === state.channel.uploads) {
      const max = Number(q.maxResults || 5);
      const start = Number(q.pageToken || 0);
      const ids = state.uploadsOrder.filter((id) => state.videos.has(id)).slice(start, start + max);
      const next = start + max < state.uploadsOrder.length ? String(start + max) : undefined;
      return json(200, { items: ids.map((id) => ({ id: `pi_${id}`, contentDetails: { videoId: id } })), nextPageToken: next });
    }
    return json(200, { items: state.playlistItems.filter((i) => i.snippet.playlistId === q.playlistId) });
  }
  if (p === "/youtube/v3/playlistItems" && method === "POST") {
    const b = JSON.parse(body.toString("utf8"));
    const item = { id: `pli_${state.playlistItems.length}`, snippet: b.snippet, contentDetails: { videoId: b.snippet.resourceId.videoId } };
    state.playlistItems.push(item);
    return json(200, item);
  }
  if (p === "/upload/youtube/v3/thumbnails/set" && method === "POST") {
    state.thumbnails.set(q.videoId, { bytes: body.length, type: h["content-type"] });
    return json(200, { items: [{ default: { url: `https://i.ytimg.com/vi/${q.videoId}/default.jpg` } }] });
  }
  if (u.hostname === "youtubeanalytics.googleapis.com" && p === "/v2/reports") {
    assert.equal(q.ids, "channel==MINE");
    const ids = [...state.videos.keys()];
    return json(200, {
      columnHeaders: [{ name: "video" }, { name: "views" }, { name: "likes" }],
      rows: ids.map((id, i) => [id, 1000 - i, 10]),
    });
  }
  return apiErr(404, "notFound", `Unhandled ${method} ${p}`);
}

/* ------------------------------------------------ Apps Script mocks -- */

const signed = (buf) => Array.from(buf, (b) => (b > 127 ? b - 256 : b));
function toBuffer(payload) {
  if (payload === undefined || payload === null) return Buffer.alloc(0);
  if (typeof payload === "string") return Buffer.from(payload, "utf8");
  if (Array.isArray(payload)) return Buffer.from(payload.map((b) => b & 255));
  if (payload.__buf) return payload.__buf;
  throw new Error("Unsupported payload type");
}
function makeBlob(buf, type = null, name = null) {
  return {
    __buf: buf,
    getBytes: () => signed(buf),
    getContentType() {
      return type;
    },
    setContentType(t) {
      type = t;
      return this;
    },
    getName: () => name,
    setName(n) {
      name = n;
      return this;
    },
    getDataAsString: () => buf.toString("utf8"),
  };
}
function makeResponse({ status, headers, body }) {
  return {
    getResponseCode: () => status,
    getContentText: () => body.toString("utf8"),
    getBlob: () => makeBlob(body, headers["Content-Type"] || null),
    getContent: () => signed(body),
    getHeaders: () => headers,
    getAllHeaders: () => headers,
  };
}
const props = new Map();
const cache = new Map();
let triggers = [];
const sandbox = {
  console: { log: () => {}, warn: () => {}, error: (...a) => console.error("    [script error]", ...a), info: () => {} },
  Logger: { log: () => {} },
  Session: { getScriptTimeZone: () => "Asia/Kolkata" },
  ContentService: {
    MimeType: { JSON: "application/json", TEXT: "text/plain" },
    createTextOutput: (content) => ({
      content,
      mime: "text/plain",
      setMimeType(m) {
        this.mime = m;
        return this;
      },
    }),
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (k) => (props.has(k) ? props.get(k) : null),
      setProperty: (k, v) => {
        assert.ok(String(v).length < 9000, `property ${k} exceeds the 9 KB Apps Script limit`);
        props.set(k, String(v));
      },
      deleteProperty: (k) => props.delete(k),
      getProperties: () => Object.fromEntries(props),
      getKeys: () => [...props.keys()],
    }),
  },
  CacheService: {
    getScriptCache: () => ({ get: (k) => cache.get(k) ?? null, put: (k, v) => cache.set(k, v), remove: (k) => cache.delete(k) }),
  },
  LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
  ScriptApp: {
    getOAuthToken: () => "test-token",
    getService: () => ({ getUrl: () => "https://script.google.com/macros/s/DEPLOYMENT/exec" }),
    getProjectTriggers: () => [...triggers],
    deleteTrigger: (t) => {
      triggers = triggers.filter((x) => x !== t);
    },
    newTrigger: (fn) => ({
      timeBased: () => ({
        after: () => ({
          create: () => {
            const t = { getHandlerFunction: () => fn };
            triggers.push(t);
            return t;
          },
        }),
      }),
    }),
  },
  Utilities: {
    getUuid: () => randomUUID(),
    sleep: () => {},
    base64Decode: (s) => signed(Buffer.from(s, "base64")),
    base64DecodeWebSafe: (s) => signed(Buffer.from(s, "base64url")),
    newBlob: (data, type, name) => makeBlob(typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from((data || []).map((b) => b & 255)), type, name),
    formatDate: (d) => d.toISOString().slice(0, 10),
  },
  UrlFetchApp: {
    fetch(url, params = {}) {
      const headers = { ...(params.headers || {}) };
      if (params.contentType) headers["Content-Type"] = params.contentType;
      const res = google((params.method || "get").toUpperCase(), url, headers, toBuffer(params.payload));
      if (!params.muteHttpExceptions && res.status >= 400) throw new Error(`Request failed for ${url} returned code ${res.status}`);
      return makeResponse(res);
    },
  },
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: "Code.gs" });

/* ----------------------------------- Apps Script web app HTTP emulator -- */

const echo = new Map();
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname === "/macros/echo") {
    const out = echo.get(u.searchParams.get("user_content_key"));
    echo.delete(u.searchParams.get("user_content_key"));
    if (!out) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": `${out.mime}; charset=utf-8` }).end(out.content);
    return;
  }
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const m = u.pathname.match(/^\/macros\/s\/DEPLOYMENT\/exec(?:\/(.*))?$/);
    if (!m) {
      res.writeHead(404).end();
      return;
    }
    const e = { parameter: Object.fromEntries(u.searchParams), pathInfo: m[1] || undefined };
    if (req.method === "POST") e.postData = { contents: Buffer.concat(chunks).toString("utf8"), type: req.headers["content-type"] };
    const out = req.method === "POST" ? sandbox.doPost(e) : sandbox.doGet(e);
    const key = randomUUID();
    echo.set(key, out);
    res.writeHead(302, { Location: `/macros/echo?user_content_key=${key}` }).end();
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/macros/s/DEPLOYMENT/exec`;

async function rpc(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  return { status: r.status, type: r.headers.get("content-type"), body: text ? JSON.parse(text) : null };
}
let rpcId = 1;
async function call(url, name, args = {}) {
  const r = await rpc(url, { jsonrpc: "2.0", id: rpcId++, method: "tools/call", params: { name, arguments: args } });
  assert.ok(r.body.result, `tools/call ${name} returned a JSON-RPC error: ${JSON.stringify(r.body.error)}`);
  const text = r.body.result.content[0].text;
  return { isError: !!r.body.result.isError, text, data: r.body.result.isError ? null : JSON.parse(text) };
}

/* --------------------------------------------------------------- tests -- */

console.log("YouTube MCP smoke test");
sandbox.setup();
const key = props.get("MCP_API_KEY");
assert.match(key, /^[0-9a-f]{64}$/);
const url = `${base}?key=${key}`;

await check("rejects missing and wrong keys", async () => {
  const r1 = await rpc(base, { jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  assert.equal(r1.body.error.code, -32001);
  const r2 = await rpc(`${base}?key=nope`, { jsonrpc: "2.0", id: 2, method: "tools/list" });
  assert.equal(r2.body.error.code, -32001);
  assert.equal(r2.body.id, 2);
});

await check("initialize negotiates protocol version via the redirect", async () => {
  const r = await rpc(url, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } });
  assert.equal(r.status, 200);
  assert.match(r.type, /application\/json/);
  assert.equal(r.body.result.protocolVersion, "2025-06-18");
  assert.ok(r.body.result.capabilities.tools);
  const r2 = await rpc(url, { jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "1999-01-01" } });
  assert.equal(r2.body.result.protocolVersion, "2025-06-18");
});

await check("notifications get an empty 200, unknown methods -32601, key via path works", async () => {
  const n = await rpc(url, { jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(n.status, 200);
  assert.equal(n.body, null);
  const u = await rpc(url, { jsonrpc: "2.0", id: 9, method: "nope/nope" });
  assert.equal(u.body.error.code, -32601);
  const p = await rpc(`${base}/${key}`, { jsonrpc: "2.0", id: 10, method: "ping" });
  assert.deepEqual(p.body.result, {});
});

let toolNames;
await check("tools/list exposes valid tool definitions", async () => {
  const r = await rpc(url, { jsonrpc: "2.0", id: 3, method: "tools/list" });
  const tools = r.body.result.tools;
  toolNames = tools.map((t) => t.name);
  assert.ok(tools.length >= 55, `expected many tools, got ${tools.length}`);
  for (const t of tools) {
    assert.match(t.name, /^[a-z0-9_]{3,64}$/);
    assert.ok(t.description && t.description.length > 20, `${t.name} needs a description`);
    assert.equal(t.inputSchema.type, "object");
    for (const req of t.inputSchema.required || []) assert.ok(t.inputSchema.properties[req], `${t.name}: required ${req} missing`);
    assert.equal(typeof t.annotations.readOnlyHint, "boolean");
  }
  for (const n of ["upload_video", "upload_short", "get_upload_status", "update_video", "delete_video", "list_my_videos", "youtube_api_request"]) {
    assert.ok(toolNames.includes(n), `missing ${n}`);
  }
});

await check("groups and readonly mode filter tools", async () => {
  const g = await rpc(`${url}&groups=uploads`, { jsonrpc: "2.0", id: 4, method: "tools/list" });
  assert.ok(g.body.result.tools.every((t) => /upload/.test(t.name)));
  const ro = await rpc(`${url}&mode=readonly`, { jsonrpc: "2.0", id: 5, method: "tools/list" });
  assert.ok(ro.body.result.tools.every((t) => t.annotations.readOnlyHint === true));
  assert.ok(!ro.body.result.tools.some((t) => t.name === "delete_video"));
  const blocked = await rpc(`${url}&mode=readonly`, { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "delete_video", arguments: { video_id: "x" } } });
  assert.equal(blocked.body.error.code, -32602);
});

let shortId;
await check("upload_short: 50 MB ranged URL, chunked, completes in the foreground", async () => {
  const r = await call(url, "upload_short", { source_url: "https://cdn.example.com/big-vertical.mp4", title: "Campus <tour>", privacy_status: "public" });
  assert.equal(r.isError, false, r.text);
  assert.equal(r.data.status, "completed");
  assert.ok(r.data.shorts_url.includes(r.data.video_id));
  assert.ok(r.data.warnings.some((w) => /Removed < and >/.test(w)));
  shortId = r.data.video_id;
  const session = [...state.sessions.values()].find((s) => s.video && s.video.id === shortId);
  assert.equal(session.chunks.length, 3, "50 MB should go up in 3 chunks of <= 20 MiB");
  assert.equal(sha(session.data), sha(SOURCES["https://cdn.example.com/big-vertical.mp4"].buf), "bytes must arrive intact");
  assert.match(session.resource.snippet.description, /#Shorts/);
  assert.equal(session.resource.snippet.title, "Campus tour");
});

await check("upload_video from Drive continues in the background worker", async () => {
  sandbox.CONFIG.FOREGROUND_BUDGET_MS = 0;
  const r = await call(url, "upload_video", {
    drive_file_id: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view?usp=sharing",
    title: "Lecture 1",
    tags: ["#dbms", "sql", "sql", "normal forms"],
    thumbnail_url: "https://cdn.example.com/thumb.jpg",
    playlist_ids: ["PLabc"],
    publish_at: new Date(Date.now() + 86400000).toISOString(),
    privacy_status: "public",
  });
  sandbox.CONFIG.FOREGROUND_BUDGET_MS = 40000;
  assert.equal(r.data.status, "uploading");
  assert.equal(r.data.progress.bytes_uploaded, 0);
  assert.equal(r.data.privacy_status, "private");
  assert.equal(triggers.length, 1, "background worker should be scheduled");
  sandbox.processUploadQueue();
  assert.equal(triggers.length, 0, "worker trigger removed when nothing is left");
  const s = await call(url, "get_upload_status", { upload_id: r.data.upload_id });
  assert.equal(s.data.status, "completed");
  assert.equal(s.data.extras.thumbnail, "set");
  assert.equal(s.data.extras.playlists[0].added, true);
  assert.ok(state.thumbnails.has(s.data.video_id));
  const session = [...state.sessions.values()].find((x) => x.video && x.video.id === s.data.video_id);
  assert.equal(sha(session.data), sha(DRIVE["1AbCdEfGhIjKlMnOpQrStUvWxYz012345"].buf));
  assert.deepEqual(session.resource.snippet.tags, ["dbms", "sql", "normal forms"]);
});

await check("transient 503 on a chunk is retried from the confirmed offset", async () => {
  state.failNextPut = 2;
  const r = await call(url, "upload_video", { source_url: "https://cdn.example.com/big-vertical.mp4", title: "Retry me" });
  assert.equal(r.data.status, "completed", r.text);
});

await check("resume_upload continues a partially uploaded job", async () => {
  // Budget allows the first chunk to start but not a second one.
  sandbox.CONFIG.FOREGROUND_BUDGET_MS = 300;
  state.putDelayMs = 400;
  const r = await call(url, "upload_video", { source_url: "https://cdn.example.com/big-vertical.mp4", title: "Partial" });
  sandbox.CONFIG.FOREGROUND_BUDGET_MS = 40000;
  state.putDelayMs = 0;
  assert.equal(r.data.status, "uploading");
  assert.ok(r.data.progress.bytes_uploaded > 0 && r.data.progress.bytes_uploaded < r.data.progress.total_bytes);
  const resumed = await call(url, "resume_upload", { upload_id: r.data.upload_id });
  assert.equal(resumed.data.status, "completed", resumed.text);
  triggers = [];
});

await check("non-range URL and base64 sources upload in one request", async () => {
  const a = await call(url, "upload_video", { source_url: "https://cdn.example.com/no-range.mov", title: "No range" });
  assert.equal(a.data.status, "completed", a.text);
  const small = pattern(300 * 1024, 5);
  const b = await call(url, "upload_video", { base64_data: `data:video/mp4;base64,${small.toString("base64")}`, title: "Inline" });
  assert.equal(b.data.status, "completed", b.text);
  const session = [...state.sessions.values()].find((x) => x.video && x.video.id === b.data.video_id);
  assert.equal(sha(session.data), sha(small));
});

await check("bad sources and bad input give tool errors, not crashes", async () => {
  const html = await call(url, "upload_video", { source_url: "https://cdn.example.com/page", title: "x" });
  assert.equal(html.isError, true);
  assert.match(html.text, /web page/);
  const none = await call(url, "upload_video", { title: "x" });
  assert.equal(none.isError, true);
  const long = await call(url, "upload_video", { source_url: "https://cdn.example.com/no-range.mov", title: "x".repeat(101) });
  assert.match(long.text, /at most 100/);
  const missing = await call(url, "update_video", {});
  assert.match(missing.text, /Missing required argument: video_id/);
});

await check("create_upload_session + client PUT + get_upload_status finalizes", async () => {
  const r = await call(url, "create_upload_session", { title: "From laptop", playlist_ids: "PLxyz" });
  assert.match(r.data.upload_url, /upload_id=/);
  assert.match(r.data.curl, /--upload-file/);
  const pending = await call(url, "get_upload_status", { upload_id: r.data.upload_id });
  assert.equal(pending.data.status, "awaiting_client");
  const file = pattern(1 * MiB + 7, 1);
  const put = google("PUT", r.data.upload_url, { "Content-Range": `bytes 0-${file.length - 1}/${file.length}`, Authorization: "Bearer test-token" }, file);
  assert.equal(put.status, 200);
  const done = await call(url, "get_upload_status", { upload_id: r.data.upload_id });
  assert.equal(done.data.status, "completed", done.text);
  assert.equal(done.data.extras.playlists[0].playlist_id, "PLxyz");
});

await check("update_video keeps untouched fields and list_my_videos filters Shorts", async () => {
  const before = state.videos.get(shortId);
  before.snippet.tags = ["keep", "me"];
  const u = await call(url, "update_video", { video_id: `https://youtube.com/shorts/${shortId}`, title: "New title", add_tags: ["fresh"] });
  assert.equal(u.data.title, "New title");
  assert.deepEqual(u.data.tags, ["keep", "me", "fresh"]);
  assert.match(state.videos.get(shortId).snippet.description, /#Shorts/, "description must be preserved");
  const shorts = await call(url, "list_my_videos", { type: "shorts" });
  assert.ok(shorts.data.videos.length >= 1);
  assert.ok(shorts.data.videos.every((v) => v.is_short === true));
  const longs = await call(url, "list_my_videos", { type: "long", max_results: 50 });
  assert.ok(longs.data.videos.every((v) => v.is_short === false));
});

await check("analytics rows are mapped to objects with titles", async () => {
  const r = await call(url, "get_top_videos", { max_results: 3 });
  assert.equal(r.isError, false, r.text);
  assert.ok(r.data.rows[0].views >= r.data.rows[1].views);
  assert.ok(r.data.rows[0].title);
});

await check("delete_video and get_server_status", async () => {
  const d = await call(url, "delete_video", { video_id: shortId });
  assert.equal(d.data.deleted, true);
  const s = await call(url, "get_server_status");
  assert.equal(s.data.channel.title, "Test Channel");
  assert.ok(!JSON.stringify(s.data).includes(key), "status must not leak the key");
});

/* ------------------------------------------- Cloudflare Worker relay -- */

const { default: worker } = await import(pathToFileURL(join(root, "relay", "worker.mjs")).href);
const relayEnv = { APPS_SCRIPT_URL: base };
const relay = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(`http://127.0.0.1${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks),
  });
  const response = await worker.fetch(request, relayEnv);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
});
await new Promise((r) => relay.listen(0, "127.0.0.1", r));
const relayBase = `http://127.0.0.1:${relay.address().port}/mcp`;
const relayUrl = `${relayBase}?key=${key}`;

await check("relay: 200 JSON for requests, 202 for notifications, 405 for GET, Bearer auth", async () => {
  const init = await fetch(relayUrl, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25" } }),
  });
  assert.equal(init.status, 200, "relay must not expose the Apps Script redirect");
  assert.equal((await init.json()).result.protocolVersion, "2025-11-25");
  const note = await fetch(relayUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) });
  assert.equal(note.status, 202);
  const get = await fetch(relayUrl);
  assert.equal(get.status, 405);
  const bearer = await fetch(relayBase, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
  });
  assert.ok((await bearer.json()).result.tools.length >= 55);
  const noKey = await fetch(relayBase, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/list" }) });
  assert.equal((await noKey.json()).error.code, -32001);
});

/* --------------------------------------------- official MCP SDK client -- */

const sdkDir = process.env.MCP_SDK_DIR;
if (sdkDir) {
  const req = createRequire(join(sdkDir, "package.json"));
  const load = async (p) => import(pathToFileURL(req.resolve(`@modelcontextprotocol/sdk/${p}`)).href);
  const { Client } = await load("client/index.js");
  const { StreamableHTTPClientTransport } = await load("client/streamableHttp.js");
  const { StdioClientTransport } = await load("client/stdio.js");

  const exercise = async (transport) => {
    const client = new Client({ name: "smoke", version: "1.0.0" });
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.equal(tools.length, toolNames.length);
    const ch = await client.callTool({ name: "get_my_channel", arguments: {} });
    assert.equal(JSON.parse(ch.content[0].text).handle, "@testchannel");
    const up = await client.callTool({ name: "upload_short", arguments: { source_url: "https://cdn.example.com/big-vertical.mp4", title: "SDK short" } });
    assert.equal(JSON.parse(up.content[0].text).status, "completed");
    const bad = await client.callTool({ name: "get_upload_status", arguments: { upload_id: "up_missing" } });
    assert.equal(bad.isError, true);
    await client.close();
  };

  await check("SDK default redirect policy rejects the raw Apps Script URL (why the relay exists)", async () => {
    const client = new Client({ name: "smoke", version: "1.0.0" });
    await assert.rejects(client.connect(new StreamableHTTPClientTransport(new URL(url))), /not followed/);
  });
  await check("SDK with redirectPolicy 'follow' works against the raw Apps Script URL", async () => {
    await exercise(new StreamableHTTPClientTransport(new URL(url), { redirectPolicy: "follow" }));
  });
  await check("SDK default policy works through the Cloudflare relay (key in URL and as Bearer)", async () => {
    await exercise(new StreamableHTTPClientTransport(new URL(relayUrl)));
    await exercise(new StreamableHTTPClientTransport(new URL(relayBase), { requestInit: { headers: { Authorization: `Bearer ${key}` } } }));
  });
  await check("SDK stdio client works through stdio-bridge.mjs", async () => {
    await exercise(new StdioClientTransport({ command: process.execPath, args: [join(root, "relay", "stdio-bridge.mjs"), url], stderr: "inherit" }));
  });
} else {
  console.log("  --  skipped SDK client checks (set MCP_SDK_DIR to a folder with @modelcontextprotocol/sdk installed)");
}

/* ------------------------------------------ official Python SDK client -- */

const python = process.env.MCP_PYTHON;
if (python) {
  const { execFile } = await import("node:child_process");
  const script = `
import asyncio, json, sys
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
async def main(url):
    async with streamable_http_client(url) as (read, write):
        async with ClientSession(read, write) as s:
            await s.initialize()
            tools = await s.list_tools()
            r = await s.call_tool("upload_short", {"source_url": "https://cdn.example.com/big-vertical.mp4", "title": "Py short"})
            print(json.dumps({"tools": len(tools.tools), "status": json.loads(r.content[0].text)["status"]}))
asyncio.run(main(sys.argv[1]))
`;
  const runPy = (target) =>
    new Promise((resolve) => execFile(python, ["-c", script, target], { timeout: 60000 }, (err, stdout, stderr) => resolve({ err, stdout, stderr })));
  await check("Python SDK client works through the relay", async () => {
    const r = await runPy(relayUrl);
    assert.ok(!r.err, r.stderr);
    const out = JSON.parse(r.stdout.trim().split("\n").pop());
    assert.equal(out.tools, toolNames.length);
    assert.equal(out.status, "completed");
  });
  await check("Python SDK client rejects the raw Apps Script URL (why the relay exists)", async () => {
    const r = await runPy(url);
    assert.ok(r.err, "expected the Python SDK to refuse the cross-method redirect");
  });
} else {
  console.log("  --  skipped Python SDK checks (set MCP_PYTHON to a python with the mcp package installed)");
}

relay.close();
server.close();
console.log(`${passed} checks passed`);
