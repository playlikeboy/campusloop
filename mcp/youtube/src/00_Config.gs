/**
 * YouTube MCP server for Google Apps Script
 * ===========================================================================
 * A Model Context Protocol server (Streamable HTTP, JSON responses) that runs
 * as an Apps Script Web App with your own YouTube channel's authorization.
 * Point Claude, Cursor, Windsurf, VS Code, Composio or any MCP client at it to
 * upload videos and Shorts and manage videos, playlists, comments, captions,
 * the channel, analytics and live streams.
 *
 * SETUP (about 5 minutes)
 *  1. Open https://script.google.com and create a new project ("YouTube MCP").
 *  2. Project Settings (gear icon): tick "Show appsscript.json manifest file in editor".
 *  3. Back in the editor, replace the contents of appsscript.json with the
 *     appsscript.json shipped next to this file.
 *  4. Replace the contents of Code.gs with this whole file. Save (Ctrl/Cmd+S).
 *  5. Pick the function `setup` in the toolbar dropdown and click Run.
 *     Sign in with the Google account that owns the channel and allow access.
 *     If Google says "Google hasn't verified this app", click
 *     Advanced -> Go to YouTube MCP (unsafe). This is your own script.
 *     The execution log prints the authorized channel and your secret MCP key.
 *  6. Deploy -> New deployment -> Select type: Web app.
 *       Execute as: Me          Who has access: Anyone
 *     Click Deploy and copy the Web app URL (it ends in /exec).
 *  7. The raw server URL is   <WEB_APP_URL>?key=<MCP_KEY>
 *     Run `showConnectionInfo` at any time to print the key again.
 *
 * CONNECT A CLIENT
 *  Apps Script answers every request with a 302 redirect to another domain
 *  (script.googleusercontent.com). Current MCP clients built on the official
 *  TypeScript (>= 1.32) and Python (>= 2.x) SDKs refuse that redirect, so
 *  connect through one of the two small adapters in mcp/youtube/relay/:
 *
 *  A) Cloudflare Worker relay. Works with every client, including Claude
 *     web/desktop custom connectors and Composio. Free tier is plenty, and it
 *     stores no secrets.
 *       cd mcp/youtube/relay
 *       npx wrangler deploy --var APPS_SCRIPT_URL:<WEB_APP_URL>
 *     Endpoint: https://youtube-mcp-relay.<subdomain>.workers.dev/mcp?key=<MCP_KEY>
 *       (or omit ?key and send the header  Authorization: Bearer <MCP_KEY>)
 *     - Claude: Settings -> Connectors -> Add custom connector -> paste the endpoint.
 *     - Claude Code:  claude mcp add --transport http youtube "<RELAY_ENDPOINT>"
 *     - Cursor / Windsurf:  { "mcpServers": { "youtube": { "url": "<RELAY_ENDPOINT>" } } }
 *     - VS Code:  { "servers": { "youtube": { "type": "http", "url": "<RELAY_ENDPOINT>" } } }
 *     - Composio / other gateways: custom MCP server, transport "Streamable HTTP",
 *       URL = relay endpoint (or relay URL + Authorization: Bearer <MCP_KEY>).
 *
 *  B) Local stdio bridge. For desktop/IDE clients, nothing to deploy, Node 18+.
 *     - Claude Code:
 *         claude mcp add youtube -- node /abs/path/stdio-bridge.mjs "<WEB_APP_URL>?key=<MCP_KEY>"
 *     - Claude Desktop / Cursor / Windsurf (mcpServers JSON):
 *         "youtube": { "command": "node",
 *                      "args": ["/abs/path/stdio-bridge.mjs", "<WEB_APP_URL>?key=<MCP_KEY>"] }
 *
 *  Clients that do follow POST redirects (e.g. the TypeScript SDK with
 *  redirectPolicy: "follow", curl -L, Postman) can use the raw URL directly.
 *
 * OPTIONAL URL PARAMETERS (work on the raw URL, the relay and the bridge)
 *  &groups=uploads,videos,playlists   expose only some tool groups (useful for
 *                                     clients with a tool cap, e.g. Cursor).
 *      Groups: uploads, videos, playlists, comments, captions, channel,
 *              analytics, live, advanced
 *  &mode=readonly                     expose read-only tools only.
 *
 * UPDATING THE CODE
 *  Deploy -> Manage deployments -> pencil icon -> Version: "New version" -> Deploy.
 *  This keeps the same URL. Creating a *new* deployment gives a new URL.
 *  If you change scopes in appsscript.json, run `setup` again to re-authorize.
 *
 * SECURITY
 *  Anyone holding the endpoint URL can act on your channel. Keep the key secret.
 *  Run `rotateMcpKey` to invalidate the old key and print a new one.
 *
 * LIMITS WORTH KNOWING
 *  - YouTube Data API quota: 10,000 units/day by default. Uploads are by far
 *    the most expensive call, search costs 100, most reads cost 1.
 *  - Videos uploaded through API projects that have not passed Google's YouTube
 *    API audit can be locked to Private. If that happens, link a standard
 *    Google Cloud project (Project Settings -> Change project) and request the
 *    audit, or publish the video manually in YouTube Studio.
 *  - Apps Script: 6 minutes per execution and 90 minutes/day of trigger
 *    runtime on consumer accounts. Large uploads are chunked and continue in
 *    the background across executions automatically.
 *  - Custom thumbnails require a phone-verified channel.
 */

var MCP_SERVER_INFO = {
  name: 'youtube-mcp-apps-script',
  title: 'YouTube MCP',
  version: '1.0.0',
};

var MCP_SUPPORTED_PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
var MCP_FALLBACK_PROTOCOL = '2025-06-18';

var TOOL_GROUPS = ['uploads', 'videos', 'playlists', 'comments', 'captions', 'channel', 'analytics', 'live', 'advanced'];

var CONFIG = {
  // Most MCP clients time out a tool call after 60s, so foreground work stops
  // well before that and the remainder continues on a background trigger.
  FOREGROUND_BUDGET_MS: 40 * 1000,
  // Apps Script hard limit is 6 minutes per execution.
  BACKGROUND_BUDGET_MS: 4.5 * 60 * 1000,
  // Resumable upload chunk. Must be a multiple of 256 KiB (262144 bytes).
  CHUNK_BYTES: 80 * 262144, // 20 MiB
  // Largest file we will hold in memory when the source cannot serve byte ranges.
  MAX_SINGLE_FETCH_BYTES: 48 * 1024 * 1024,
  // Largest decoded base64 payload accepted inline in a tool call.
  MAX_BASE64_BYTES: 30 * 1024 * 1024,
  MAX_THUMBNAIL_BYTES: 2 * 1024 * 1024,
  MAX_BANNER_BYTES: 6 * 1024 * 1024,
  MAX_CAPTION_BYTES: 10 * 1024 * 1024,
  JOB_RETENTION_MS: 7 * 24 * 60 * 60 * 1000,
  SHORTS_MAX_SECONDS: 180,
  DEFAULT_CATEGORY_ID: '22', // People & Blogs
  DEFAULT_REGION: 'IN',
  CHANNEL_CACHE_SECONDS: 6 * 60 * 60,
};

var PROP_API_KEY = 'MCP_API_KEY';

/**
 * Run once from the editor: authorizes YouTube access, creates the MCP key and
 * prints connection details to the execution log.
 */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty(PROP_API_KEY);
  if (!key) {
    key = newSecret_();
    props.setProperty(PROP_API_KEY, key);
  }
  var channel = getMyChannel_(true);
  console.log('Authorized channel: ' + channel.title + ' (' + channel.id + ')' + (channel.handle ? ' ' + channel.handle : ''));
  printConnectionInfo_(key);
  console.log('Next: Deploy -> New deployment -> Web app (Execute as: Me, Who has access: Anyone).');
}

/** Prints the MCP endpoint and key again. */
function showConnectionInfo() {
  var key = PropertiesService.getScriptProperties().getProperty(PROP_API_KEY);
  if (!key) {
    console.log('No key yet. Run setup first.');
    return;
  }
  printConnectionInfo_(key);
}

/** Invalidates the current key and prints a new one. Update your MCP clients afterwards. */
function rotateMcpKey() {
  var key = newSecret_();
  PropertiesService.getScriptProperties().setProperty(PROP_API_KEY, key);
  console.log('New MCP key created. The old key no longer works.');
  printConnectionInfo_(key);
}

/** Deletes all stored upload jobs and stops the background upload worker. */
function clearUploadJobs() {
  var props = PropertiesService.getScriptProperties();
  var removed = 0;
  props.getKeys().forEach(function (k) {
    if (k.indexOf(JOB_PREFIX) === 0) {
      props.deleteProperty(k);
      removed++;
    }
  });
  deleteWorkerTriggers_();
  console.log('Removed ' + removed + ' upload job(s).');
}

function printConnectionInfo_(key) {
  var url = null;
  try {
    url = ScriptApp.getService().getUrl();
  } catch (e) {
    url = null;
  }
  console.log('MCP key: ' + key);
  if (url && /\/exec$/.test(url)) {
    console.log('Raw server URL: ' + url + '?key=' + key);
    console.log('Relay deploy:   npx wrangler deploy --var APPS_SCRIPT_URL:' + url);
  } else {
    console.log('Raw server URL: <your Web app URL ending in /exec>?key=' + key);
    console.log('Find the Web app URL under Deploy -> Manage deployments.');
  }
  console.log('Connect through the Cloudflare relay or stdio-bridge.mjs (see the CONNECT section at the top of the file).');
}

function newSecret_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}
