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

/* ===== 01_Server.gs ===== */

/* MCP transport + JSON-RPC routing.
 *
 * Apps Script web apps cannot read request headers or set status codes, so:
 *  - auth uses ?key=... (or /exec/<key>) instead of an Authorization header;
 *  - every reply is HTTP 200 with a JSON body (allowed by Streamable HTTP);
 *  - the server is stateless (no Mcp-Session-Id), which the spec permits.
 */

var SERVER_INSTRUCTIONS = [
  'YouTube MCP for the channel authorized in this Google Apps Script project.',
  '- Upload with upload_video or upload_short. The file can be a public direct-download URL, a Google Drive file ID or share link, or small base64 data. Large files keep uploading in the background: poll get_upload_status with the returned upload_id (or call resume_upload to push it forward).',
  '- For a file on the user\'s own machine, call create_upload_session and PUT the file to the returned URL with curl, then call get_upload_status to finish thumbnail/playlist steps.',
  '- New uploads are private unless privacy_status or publish_at is given. Ask before making something public if the user did not say so.',
  '- Shorts are vertical or square videos up to 3 minutes. list_my_videos accepts type=shorts or type=long.',
  '- update_video and update_playlist only change the fields you pass and keep everything else.',
  '- Quota is 10,000 units/day by default. Uploads are the most expensive call and search_youtube costs 100 units, so use list_my_videos (1 unit per page) for the user\'s own videos.',
  '- Anything without a dedicated tool can be called through youtube_api_request.',
].join('\n');

function doPost(e) {
  var raw = e && e.postData ? e.postData.contents : '';
  var message;
  try {
    message = JSON.parse(raw || 'null');
  } catch (err) {
    return jsonOut_(rpcError_(null, -32700, 'Parse error: the request body must be JSON-RPC 2.0'));
  }
  if (message === null || typeof message !== 'object') {
    return jsonOut_(rpcError_(null, -32600, 'Invalid Request'));
  }

  var authError = checkAuth_(e);
  if (authError) {
    var id = !Array.isArray(message) && message.id !== undefined ? message.id : null;
    return jsonOut_(rpcError_(id, -32001, authError));
  }

  var ctx = requestContext_(e);
  if (Array.isArray(message)) {
    if (!message.length) return jsonOut_(rpcError_(null, -32600, 'Invalid Request: empty batch'));
    var replies = message
      .map(function (m) {
        return handleRpc_(m, ctx);
      })
      .filter(Boolean);
    return replies.length ? jsonOut_(replies) : emptyOut_();
  }
  var reply = handleRpc_(message, ctx);
  return reply ? jsonOut_(reply) : emptyOut_();
}

function doGet(e) {
  var authError = checkAuth_(e);
  var info = {
    name: MCP_SERVER_INFO.name,
    version: MCP_SERVER_INFO.version,
    transport: 'streamable-http (POST JSON-RPC to this URL)',
    authorized: !authError,
  };
  if (authError) {
    info.message = authError;
  } else {
    var ctx = requestContext_(e);
    info.tools = listToolDefs_(ctx).length;
    info.groups = ctx.groups || TOOL_GROUPS;
    info.mode = ctx.readOnly ? 'readonly' : 'full';
  }
  return jsonOut_(info);
}

function requestContext_(e) {
  var p = (e && e.parameter) || {};
  var groups = null;
  if (p.groups) {
    groups = String(p.groups)
      .split(',')
      .map(function (g) {
        return g.trim().toLowerCase();
      })
      .filter(function (g) {
        return TOOL_GROUPS.indexOf(g) >= 0;
      });
    if (!groups.length) groups = null;
  }
  var mode = String(p.mode || '').toLowerCase();
  return { groups: groups, readOnly: mode === 'readonly' || mode === 'read-only' || mode === 'ro' };
}

function checkAuth_(e) {
  var expected = PropertiesService.getScriptProperties().getProperty(PROP_API_KEY);
  if (!expected) return 'Server not configured: run setup() in the Apps Script editor first.';
  var p = (e && e.parameter) || {};
  var given = p.key || p.api_key || p.token || '';
  if (!given && e && e.pathInfo) given = String(e.pathInfo).split('/')[0];
  if (!given) return 'Unauthorized: append ?key=YOUR_MCP_KEY to the server URL (run showConnectionInfo in the editor).';
  if (!safeEqual_(String(given), expected)) return 'Unauthorized: the MCP key is invalid.';
  return null;
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function handleRpc_(msg, ctx) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return rpcError_(null, -32600, 'Invalid Request');
  if (typeof msg.method !== 'string') return null; // a response from the client: nothing to do
  var isRequest = msg.id !== undefined && msg.id !== null;
  if (!isRequest) return null; // notifications (initialized, cancelled, ...) need no reply
  var params = msg.params || {};
  try {
    switch (msg.method) {
      case 'initialize':
        return rpcResult_(msg.id, initializeResult_(params));
      case 'ping':
        return rpcResult_(msg.id, {});
      case 'tools/list':
        return rpcResult_(msg.id, { tools: listToolDefs_(ctx) });
      case 'tools/call':
        return rpcResult_(msg.id, callTool_(params, ctx));
      case 'resources/list':
        return rpcResult_(msg.id, { resources: [] });
      case 'resources/templates/list':
        return rpcResult_(msg.id, { resourceTemplates: [] });
      case 'prompts/list':
        return rpcResult_(msg.id, { prompts: [] });
      case 'logging/setLevel':
        return rpcResult_(msg.id, {});
      default:
        return rpcError_(msg.id, -32601, 'Method not found: ' + msg.method);
    }
  } catch (err) {
    if (err && err.rpcCode) return rpcError_(msg.id, err.rpcCode, err.message);
    console.error('RPC ' + msg.method + ' failed: ' + (err && err.stack ? err.stack : err));
    return rpcError_(msg.id, -32603, 'Internal error: ' + (err && err.message ? err.message : String(err)));
  }
}

function initializeResult_(params) {
  var requested = params && params.protocolVersion;
  var version = MCP_SUPPORTED_PROTOCOLS.indexOf(requested) >= 0 ? requested : MCP_FALLBACK_PROTOCOL;
  return {
    protocolVersion: version,
    capabilities: { tools: { listChanged: false } },
    serverInfo: MCP_SERVER_INFO,
    instructions: SERVER_INSTRUCTIONS,
  };
}

/* ----------------------------------------------------------------- tools -- */

var TOOL_REGISTRY_CACHE_ = null;

function toolRegistrars_() {
  return [
    registerUploadTools_,
    registerVideoTools_,
    registerPlaylistTools_,
    registerCommentTools_,
    registerCaptionTools_,
    registerChannelTools_,
    registerAnalyticsTools_,
    registerLiveTools_,
    registerAdvancedTools_,
  ];
}

function toolRegistry_() {
  if (TOOL_REGISTRY_CACHE_) return TOOL_REGISTRY_CACHE_;
  var reg = { order: [], byName: {} };
  var define = function (name, spec, handler) {
    if (reg.byName[name]) throw new Error('Duplicate tool name: ' + name);
    if (TOOL_GROUPS.indexOf(spec.group) < 0) throw new Error('Unknown group for ' + name + ': ' + spec.group);
    var schema = { type: 'object', properties: spec.input || {} };
    if (spec.required && spec.required.length) schema.required = spec.required;
    var annotations = { title: spec.title };
    Object.keys(spec.annotations || {}).forEach(function (k) {
      annotations[k] = spec.annotations[k];
    });
    reg.byName[name] = {
      group: spec.group,
      readOnly: !!(spec.annotations && spec.annotations.readOnlyHint),
      handler: handler,
      def: {
        name: name,
        title: spec.title,
        description: spec.description,
        inputSchema: schema,
        annotations: annotations,
      },
    };
    reg.order.push(name);
  };
  toolRegistrars_().forEach(function (register) {
    register(define);
  });
  TOOL_REGISTRY_CACHE_ = reg;
  return reg;
}

function toolEnabled_(entry, ctx) {
  if (ctx && ctx.groups && ctx.groups.indexOf(entry.group) < 0) return false;
  if (ctx && ctx.readOnly && !entry.readOnly) return false;
  return true;
}

function listToolDefs_(ctx) {
  var reg = toolRegistry_();
  return reg.order
    .filter(function (name) {
      return toolEnabled_(reg.byName[name], ctx);
    })
    .map(function (name) {
      return reg.byName[name].def;
    });
}

function callTool_(params, ctx) {
  var name = params && params.name;
  var entry = name ? toolRegistry_().byName[name] : null;
  if (!entry || !toolEnabled_(entry, ctx)) throw rpcException_(-32602, 'Unknown tool: ' + name);
  var args = params.arguments || {};
  try {
    validateArgs_(entry.def.inputSchema, args);
    var result = entry.handler(args, ctx);
    return toolResult_(result);
  } catch (err) {
    if (!err || !err.isToolError) console.error('Tool ' + name + ' failed: ' + (err && err.stack ? err.stack : err));
    return { content: [{ type: 'text', text: describeError_(err) }], isError: true };
  }
}

function toolResult_(result) {
  if (result && result.__mcpContent) return { content: result.__mcpContent };
  var text = typeof result === 'string' ? result : JSON.stringify(result === undefined ? { ok: true } : result);
  return { content: [{ type: 'text', text: text }] };
}

function describeError_(err) {
  if (!err) return 'Error: unknown failure';
  var out = 'Error: ' + (err.message || String(err));
  if (err.hint) out += '\nHint: ' + err.hint;
  if (err.details) out += '\nDetails: ' + JSON.stringify(err.details);
  return out;
}

/* Light JSON-schema validation with coercion of the usual LLM slips
 * ("5" for 5, "true" for true, "a,b" for ["a","b"]). */
function validateArgs_(schema, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw toolError_('Tool arguments must be a JSON object.');
  Object.keys(args).forEach(function (k) {
    var prop = schema.properties[k];
    if (!prop || args[k] === null || args[k] === undefined) return;
    args[k] = coerceArg_(prop, args[k], k);
  });
  (schema.required || []).forEach(function (k) {
    var v = args[k];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) {
      throw toolError_('Missing required argument: ' + k);
    }
  });
}

function coerceArg_(prop, v, key) {
  var type = prop.type;
  if (type === 'integer' || type === 'number') {
    if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) v = Number(v);
    if (typeof v !== 'number' || isNaN(v)) throw toolError_(key + ' must be a number.');
    if (type === 'integer') v = Math.round(v);
    if (prop.minimum !== undefined && v < prop.minimum) v = prop.minimum;
    if (prop.maximum !== undefined && v > prop.maximum) v = prop.maximum;
    return v;
  }
  if (type === 'boolean') {
    if (v === 'true' || v === 1) return true;
    if (v === 'false' || v === 0) return false;
    if (typeof v !== 'boolean') throw toolError_(key + ' must be true or false.');
    return v;
  }
  if (type === 'string') {
    if (typeof v === 'number' || typeof v === 'boolean') v = String(v);
    if (typeof v !== 'string') throw toolError_(key + ' must be a string.');
    if (prop.enum && prop.enum.indexOf(v) < 0) {
      var lower = v.toLowerCase();
      var match = prop.enum.filter(function (opt) {
        return String(opt).toLowerCase() === lower;
      })[0];
      if (match === undefined) throw toolError_(key + ' must be one of: ' + prop.enum.join(', '));
      v = match;
    }
    return v;
  }
  if (type === 'array') {
    if (typeof v === 'string') {
      var s = v.trim();
      if (s.charAt(0) === '[') {
        try {
          v = JSON.parse(s);
        } catch (e) {
          throw toolError_(key + ' must be an array.');
        }
      } else {
        v = s
          ? s.split(',').map(function (x) {
              return x.trim();
            })
          : [];
      }
    }
    if (!Array.isArray(v)) v = [v];
    if (prop.items) {
      v = v.map(function (item, i) {
        return coerceArg_(prop.items, item, key + '[' + i + ']');
      });
    }
    return v;
  }
  if (type === 'object') {
    if (typeof v === 'string') {
      try {
        v = JSON.parse(v);
      } catch (e) {
        throw toolError_(key + ' must be a JSON object.');
      }
    }
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw toolError_(key + ' must be an object.');
    return v;
  }
  return v;
}

/* ------------------------------------------------------- schema helpers -- */

function ext_(base, extra) {
  if (extra) {
    Object.keys(extra).forEach(function (k) {
      base[k] = extra[k];
    });
  }
  return base;
}
function sStr_(description, extra) {
  return ext_({ type: 'string', description: description }, extra);
}
function sInt_(description, extra) {
  return ext_({ type: 'integer', description: description }, extra);
}
function sBool_(description, extra) {
  return ext_({ type: 'boolean', description: description }, extra);
}
function sEnum_(values, description, extra) {
  return ext_({ type: 'string', enum: values, description: description }, extra);
}
function sArr_(items, description, extra) {
  return ext_({ type: 'array', items: items, description: description }, extra);
}
function sObj_(description, extra) {
  return ext_({ type: 'object', description: description }, extra);
}
function sMax_(max, dflt) {
  return sInt_('Max results per page (1-' + max + ', default ' + dflt + ').', { minimum: 1, maximum: max, default: dflt });
}
function sPageToken_() {
  return sStr_('next_page_token from a previous call, to fetch the next page.');
}

var ANN_READ = { readOnlyHint: true, openWorldHint: true };
var ANN_WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };
var ANN_UPDATE = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true };
var ANN_DELETE = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true };

/* ---------------------------------------------------------- JSON-RPC IO -- */

function rpcResult_(id, result) {
  return { jsonrpc: '2.0', id: id, result: result };
}

function rpcError_(id, code, message, data) {
  var error = { code: code, message: message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: '2.0', id: id === undefined ? null : id, error: error };
}

function rpcException_(code, message) {
  var err = new Error(message);
  err.rpcCode = code;
  return err;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function emptyOut_() {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.JSON);
}

/* ===== 02_Http.gs ===== */

/* Google API client, error mapping and shared helpers. */

var GOOGLE_API_ROOT = 'https://www.googleapis.com/';
var YT_API = 'https://www.googleapis.com/youtube/v3/';
var YT_UPLOAD_API = 'https://www.googleapis.com/upload/youtube/v3/';
var YT_ANALYTICS_API = 'https://youtubeanalytics.googleapis.com/v2/';
var YT_REPORTING_API = 'https://youtubereporting.googleapis.com/v1/';

var RETRYABLE_REASONS = ['rateLimitExceeded', 'userRateLimitExceeded', 'backendError', 'internalError'];

var API_ERROR_HINTS = {
  quotaExceeded:
    'The daily YouTube Data API quota is used up (default 10,000 units). It resets at midnight Pacific Time. You can request more quota in Google Cloud Console.',
  dailyLimitExceeded: 'The daily API quota is used up. It resets at midnight Pacific Time.',
  uploadLimitExceeded: 'The channel has hit its upload limit for now. Try again in about 24 hours.',
  youtubeSignupRequired:
    'The authorized Google account has no YouTube channel. Create one on youtube.com, or run setup() while signed in to the account that owns the channel.',
  insufficientPermissions:
    'The script lacks an OAuth scope. Make sure appsscript.json matches the shipped manifest, then run setup() again to re-authorize.',
  ACCESS_TOKEN_SCOPE_INSUFFICIENT:
    'The script lacks an OAuth scope. Make sure appsscript.json matches the shipped manifest, then run setup() again to re-authorize.',
  accessNotConfigured:
    'This API is disabled for the Apps Script project. In the editor open Services (+), add YouTube Data API, YouTube Analytics API and Drive API, save, then deploy a new version.',
  SERVICE_DISABLED:
    'This API is disabled for the Apps Script project. In the editor open Services (+), add YouTube Data API, YouTube Analytics API and Drive API, save, then deploy a new version.',
  forbidden: 'Only resources owned by the authorized channel can be changed.',
  videoNotFound: 'Check the video ID. Private videos are only visible to their owner.',
  playlistNotFound: 'Check the playlist ID.',
  commentNotFound: 'Check the comment ID.',
  channelNotFound: 'Check the channel ID or handle.',
  commentsDisabled: 'Comments are turned off for this video.',
  invalidTitle: 'Titles must be 1-100 characters and cannot contain < or >.',
  invalidDescription: 'Descriptions are limited to 5,000 bytes and cannot contain < or >.',
  invalidTags: 'All tags combined must stay under 500 characters.',
  invalidCategoryId: 'Use list_video_categories to find a valid category ID.',
  invalidPublishAt: 'publish_at must be a future ISO 8601 time and privacy_status must be private.',
  invalidRecordingDetails: 'recording_date must be an ISO 8601 date-time.',
  liveStreamingNotEnabled:
    'Live streaming is not enabled for this channel. Enable it at https://www.youtube.com/features (it can take up to 24 hours).',
  liveBroadcastNotFound: 'Check the broadcast ID.',
  invalidTransition: 'The broadcast cannot move to that state yet. Check its lifeCycleStatus and that a stream is bound and active.',
  authError: 'Authorization failed. Run setup() in the editor again.',
};

/**
 * Calls a Google API with the script owner's OAuth token.
 *  method  GET | POST | PUT | PATCH | DELETE
 *  url     absolute URL or a path relative to https://www.googleapis.com/
 *  opts    { query, body, payload, contentType, headers, text, raw, noRetry }
 */
function gapi_(method, url, opts) {
  opts = opts || {};
  var full = /^https:\/\//.test(url) ? url : GOOGLE_API_ROOT + String(url).replace(/^\//, '');
  var qs = queryString_(opts.query);
  if (qs) full += (full.indexOf('?') >= 0 ? '&' : '?') + qs;

  var headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  Object.keys(opts.headers || {}).forEach(function (k) {
    headers[k] = opts.headers[k];
  });
  var req = { method: String(method).toLowerCase(), headers: headers, muteHttpExceptions: true };
  if (opts.payload !== undefined) {
    req.payload = opts.payload;
    if (opts.contentType) req.contentType = opts.contentType;
  } else if (opts.body !== undefined) {
    req.payload = JSON.stringify(opts.body);
    req.contentType = 'application/json; charset=UTF-8';
  }

  var attempt = 0;
  for (;;) {
    var res = UrlFetchApp.fetch(full, req);
    var code = res.getResponseCode();
    if (code >= 200 && code < 300) {
      if (opts.raw) return res;
      var text = res.getContentText();
      if (opts.text) return text;
      if (!text) return {};
      try {
        return JSON.parse(text);
      } catch (e) {
        return { raw: text };
      }
    }
    var body = res.getContentText();
    var reason = apiErrorReason_(body);
    var retryable = code === 429 || code >= 500 || (code === 403 && RETRYABLE_REASONS.indexOf(reason) >= 0);
    if (retryable && !opts.noRetry && attempt < 3) {
      Utilities.sleep(Math.min(8000, 1000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 400));
      attempt++;
      continue;
    }
    throw apiError_(code, body, method, full);
  }
}

function apiErrorReason_(text) {
  try {
    var err = JSON.parse(text).error;
    if (!err) return '';
    if (err.errors && err.errors[0] && err.errors[0].reason) return err.errors[0].reason;
    var details = err.details || [];
    for (var i = 0; i < details.length; i++) if (details[i].reason) return details[i].reason;
    return err.status || '';
  } catch (e) {
    return '';
  }
}

function apiError_(code, text, method, url) {
  var parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    parsed = null;
  }
  var err = parsed && parsed.error;
  var reason = apiErrorReason_(text);
  var message = (err && (err.message || (typeof err === 'string' ? err : ''))) || String(text || '').slice(0, 300) || 'HTTP ' + code;
  var hint = API_ERROR_HINTS[reason] || '';
  if (!hint && code === 401) hint = API_ERROR_HINTS.authError;
  if (!hint && code === 403 && /thumbnail/i.test(message)) {
    hint = 'Custom thumbnails need a phone-verified channel: https://www.youtube.com/verify';
  }
  if (!hint && code === 404) hint = 'The resource was not found or is not visible to the authorized channel.';
  var endpoint = String(method).toUpperCase() + ' ' + String(url).split('?')[0].replace(/^https:\/\/[^/]+\//, '');
  return toolError_('YouTube API error ' + code + (reason ? ' (' + reason + ')' : '') + ': ' + message, hint, {
    status: code,
    reason: reason || undefined,
    endpoint: endpoint,
  });
}

function toolError_(message, hint, details) {
  var err = new Error(message);
  err.isToolError = true;
  if (hint) err.hint = hint;
  if (details) err.details = details;
  return err;
}

function queryString_(q) {
  if (!q) return '';
  var parts = [];
  Object.keys(q).forEach(function (k) {
    var v = q[k];
    if (v === undefined || v === null || v === '') return;
    (Array.isArray(v) ? v : [v]).forEach(function (item) {
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(item)));
    });
  });
  return parts.join('&');
}

/** Case-insensitive response header lookup. */
function header_(res, name) {
  var all = typeof res.getAllHeaders === 'function' ? res.getAllHeaders() : res.getHeaders();
  var want = name.toLowerCase();
  for (var k in all) {
    if (Object.prototype.hasOwnProperty.call(all, k) && k.toLowerCase() === want) {
      var v = all[k];
      return Array.isArray(v) ? v[0] : v;
    }
  }
  return null;
}

/** Builds a multipart/related body (JSON metadata + one media part). */
function multipartRelated_(metadata, blob) {
  var boundary = 'ytmcp' + Utilities.getUuid().replace(/-/g, '');
  var head =
    '--' +
    boundary +
    '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    '\r\n--' +
    boundary +
    '\r\nContent-Type: ' +
    (blob.getContentType() || 'application/octet-stream') +
    '\r\n\r\n';
  var tail = '\r\n--' + boundary + '--\r\n';
  var bytes = Utilities.newBlob(head).getBytes().concat(blob.getBytes(), Utilities.newBlob(tail).getBytes());
  return { contentType: 'multipart/related; boundary=' + boundary, payload: bytes };
}

/* ------------------------------------------------------ channel context -- */

/** Returns { id, title, handle, uploads } for the authorized channel (cached). */
function getMyChannel_(force) {
  var cache = CacheService.getScriptCache();
  if (!force) {
    var hit = cache.get('ytmcp:channel');
    if (hit) return JSON.parse(hit);
  }
  var res = gapi_('GET', YT_API + 'channels', { query: { part: 'snippet,contentDetails', mine: true } });
  var ch = res.items && res.items[0];
  if (!ch) {
    throw toolError_('The authorized Google account has no YouTube channel.', API_ERROR_HINTS.youtubeSignupRequired);
  }
  var info = {
    id: ch.id,
    title: ch.snippet.title,
    handle: ch.snippet.customUrl || null,
    uploads: ch.contentDetails && ch.contentDetails.relatedPlaylists ? ch.contentDetails.relatedPlaylists.uploads : null,
  };
  cache.put('ytmcp:channel', JSON.stringify(info), CONFIG.CHANNEL_CACHE_SECONDS);
  return info;
}

/* -------------------------------------------------------------- helpers -- */

function toIdList_(v) {
  if (!v) return [];
  var list = Array.isArray(v) ? v : String(v).split(',');
  return list
    .map(function (x) {
      return extractVideoId_(String(x).trim());
    })
    .filter(Boolean);
}

/** Accepts a bare ID or any youtube.com / youtu.be / shorts URL. */
function extractVideoId_(s) {
  if (!s) return '';
  var m = String(s).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : String(s).trim();
}

function isoDurationToSeconds_(iso) {
  if (!iso) return 0;
  var m = String(iso).match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/);
  if (!m) return 0;
  return Number(m[1] || 0) * 86400 + Number(m[2] || 0) * 3600 + Number(m[3] || 0) * 60 + Math.round(Number(m[4] || 0));
}

function toIsoTime_(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  var d = new Date(value);
  if (isNaN(d.getTime())) throw toolError_(field + ' must be an ISO 8601 date-time, e.g. 2026-12-01T18:30:00+05:30');
  return d.toISOString();
}

function utf8Length_(s) {
  return unescape(encodeURIComponent(String(s || ''))).length;
}

function num_(v) {
  return v === undefined || v === null ? null : Number(v);
}

function truncate_(s, n) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n - 1) + '\u2026' : s;
}

function bestThumb_(thumbs) {
  if (!thumbs) return null;
  var order = ['maxres', 'standard', 'high', 'medium', 'default'];
  for (var i = 0; i < order.length; i++) if (thumbs[order[i]]) return thumbs[order[i]].url;
  return null;
}

function dropEmpty_(obj) {
  Object.keys(obj).forEach(function (k) {
    if (obj[k] === undefined || obj[k] === null) delete obj[k];
  });
  return obj;
}

function pageOut_(res, key, items) {
  var out = {};
  out[key] = items;
  out.total_results = res.pageInfo ? res.pageInfo.totalResults : undefined;
  out.next_page_token = res.nextPageToken || null;
  out.prev_page_token = res.prevPageToken || undefined;
  return dropEmpty_(out);
}

/** Resolves 'today', 'yesterday', '7daysAgo' or YYYY-MM-DD to YYYY-MM-DD. */
function resolveDate_(value, fallback) {
  var v = String(value || fallback || 'today').trim();
  var tz = Session.getScriptTimeZone() || 'UTC';
  var d = new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (v === 'today') return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
  if (v === 'yesterday') return Utilities.formatDate(new Date(d.getTime() - 86400000), tz, 'yyyy-MM-dd');
  var m = v.match(/^(\d+)\s*days?\s*ago$/i) || v.match(/^(\d+)daysAgo$/i);
  if (m) return Utilities.formatDate(new Date(d.getTime() - Number(m[1]) * 86400000), tz, 'yyyy-MM-dd');
  var parsed = new Date(v);
  if (!isNaN(parsed.getTime())) return Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
  throw toolError_('Invalid date "' + v + '". Use YYYY-MM-DD, today, yesterday or NdaysAgo.');
}

/* ===== 03_Media.gs ===== */

/* Media sources: public URLs, Google Drive files and inline base64.
 *
 * A "media spec" is plain JSON so upload jobs can be persisted and resumed:
 *   { type: 'url', url, mime_type? } | { type: 'drive', drive_file_id, mime_type? }
 *   | { type: 'base64', data, mime_type?, filename? }   (never persisted)
 * openMedia_() turns a spec into a reader with size, mime type and read(start, end).
 */

var VIDEO_MIME_BY_EXT = {
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  '3gp': 'video/3gpp',
  mpg: 'video/mpeg',
  mpeg: 'video/mpeg',
  ts: 'video/mp2t',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  srt: 'application/octet-stream',
  vtt: 'text/vtt',
  sbv: 'application/octet-stream',
};

/** Builds a media spec from tool arguments. names = { url, drive, base64, mime } argument keys. */
function mediaSpecFromArgs_(args, names, required) {
  var url = args[names.url];
  var drive = args[names.drive];
  var b64 = args[names.base64];
  var given = [url, drive, b64].filter(function (v) {
    return v !== undefined && v !== null && v !== '';
  }).length;
  if (given > 1) throw toolError_('Provide only one of ' + [names.url, names.drive, names.base64].join(', ') + '.');
  if (!given) {
    if (required) throw toolError_('Provide one of ' + [names.url, names.drive, names.base64].join(', ') + '.');
    return null;
  }
  var mime = names.mime ? args[names.mime] : undefined;
  if (drive) return { type: 'drive', drive_file_id: parseDriveId_(drive) || String(drive).trim(), mime_type: mime };
  if (b64) return { type: 'base64', data: String(b64), mime_type: mime, filename: args.filename };
  var driveId = parseDriveId_(url);
  if (driveId) return { type: 'drive', drive_file_id: driveId, mime_type: mime };
  if (!/^https?:\/\//i.test(String(url))) throw toolError_(names.url + ' must be an http(s) URL.');
  return { type: 'url', url: normalizeSourceUrl_(String(url).trim()), mime_type: mime };
}

function parseDriveId_(value) {
  var s = String(value || '');
  var m =
    s.match(/drive\.google\.com\/file\/d\/([\w-]{20,})/) ||
    s.match(/drive\.google\.com\/(?:open|uc|u\/\d+\/uc)\?(?:[^#]*&)?id=([\w-]{20,})/) ||
    s.match(/docs\.google\.com\/[\w]+\/d\/([\w-]{20,})/) ||
    s.match(/drive\.usercontent\.google\.com\/download\?(?:[^#]*&)?id=([\w-]{20,})/);
  return m ? m[1] : null;
}

function normalizeSourceUrl_(url) {
  if (/^https?:\/\/(www\.)?dropbox\.com\//i.test(url)) {
    if (/[?&]dl=0/.test(url)) return url.replace(/([?&])dl=0/, '$1dl=1');
    if (!/[?&](dl|raw)=1/.test(url)) return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'dl=1';
  }
  return url;
}

function guessMime_(name, fallback) {
  var m = String(name || '')
    .split('?')[0]
    .match(/\.([a-z0-9]+)$/i);
  return (m && VIDEO_MIME_BY_EXT[m[1].toLowerCase()]) || fallback;
}

function fileNameFromUrl_(url) {
  var path = String(url).split('?')[0].split('#')[0];
  var name = decodeURIComponent(path.substring(path.lastIndexOf('/') + 1) || '');
  return name || 'upload';
}

/** Picks a usable content type: explicit hint > server header > extension > fallback. */
function pickMime_(hint, headerType, name, kind) {
  if (hint) return hint;
  var h = String(headerType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (h && h !== 'application/octet-stream' && h !== 'binary/octet-stream' && h.indexOf(kind + '/') === 0) return h;
  return guessMime_(name, kind === 'video' ? 'video/*' : 'application/octet-stream');
}

/**
 * Opens a media spec. Returns
 *   { spec, name, size, mimeType, rangeable, read(start, endInclusive) -> { blob, end } }
 * kind is 'video' | 'image' | 'text' (only used for mime guessing and checks).
 */
function openMedia_(spec, kind) {
  kind = kind || 'video';
  if (spec.type === 'drive') return openDriveMedia_(spec, kind);
  if (spec.type === 'base64') return openBase64Media_(spec, kind);
  return openUrlMedia_(spec, kind);
}

function openUrlMedia_(spec, kind) {
  var url = spec.url;
  var res;
  try {
    res = UrlFetchApp.fetch(url, { headers: { Range: 'bytes=0-0' }, muteHttpExceptions: true, followRedirects: true });
  } catch (e) {
    throw toolError_('Could not download ' + url + ': ' + e.message, 'Use a direct, publicly reachable file link (or a Google Drive file).');
  }
  var code = res.getResponseCode();
  var name = fileNameFromUrl_(url);
  var contentType = header_(res, 'Content-Type');
  if (code !== 200 && code !== 206) {
    throw toolError_('Could not download ' + url + ' (HTTP ' + code + ').', 'The link must be a direct download that works without logging in.');
  }
  if (/^text\/html/i.test(String(contentType || '')) && kind !== 'text') {
    throw toolError_(
      'The URL returned a web page, not a media file.',
      'Use a direct download link (for Drive pass the file ID or share link; for Dropbox use dl=1).'
    );
  }
  var mime = pickMime_(spec.mime_type, contentType, name, kind);

  if (code === 206) {
    var cr = String(header_(res, 'Content-Range') || '');
    var total = Number(cr.split('/')[1]);
    if (!total) throw toolError_('The server did not report the file size for ' + url + '.');
    return {
      spec: spec,
      name: name,
      size: total,
      mimeType: mime,
      rangeable: true,
      read: function (start, end) {
        return fetchRange_(url, start, end, false);
      },
    };
  }

  // 200: the server ignored the Range header and sent the whole file.
  var blob = res.getBlob();
  var size = Number(header_(res, 'Content-Length')) || blob.getBytes().length;
  if (size > CONFIG.MAX_SINGLE_FETCH_BYTES) {
    throw toolError_(
      'The file is too large to fetch in one request and the server does not support byte ranges.',
      'Host it on Google Drive (pass drive_file_id) or a server/CDN that supports Range requests.'
    );
  }
  blob.setContentType(mime);
  return {
    spec: spec,
    name: name,
    size: size,
    mimeType: mime,
    rangeable: false,
    read: function (start, end) {
      if (start === 0 && end >= size - 1) return { blob: blob, end: size - 1 };
      var last = Math.min(end, size - 1);
      return { blob: Utilities.newBlob(blob.getBytes().slice(start, last + 1), mime, name), end: last };
    },
  };
}

function openDriveMedia_(spec, kind) {
  var id = spec.drive_file_id;
  var meta;
  try {
    meta = gapi_('GET', 'drive/v3/files/' + encodeURIComponent(id), {
      query: { fields: 'id,name,mimeType,size', supportsAllDrives: true },
    });
  } catch (e) {
    if (e.details && e.details.status === 404) {
      throw toolError_('Drive file ' + id + ' was not found.', 'The file must be in, or shared with, the Google account that runs this script.');
    }
    throw e;
  }
  if (!meta.size) {
    throw toolError_('Drive file "' + meta.name + '" has no downloadable content (Google Docs, Sheets and folders cannot be used).');
  }
  var url = GOOGLE_API_ROOT + 'drive/v3/files/' + encodeURIComponent(id) + '?alt=media&supportsAllDrives=true';
  return {
    spec: spec,
    name: meta.name,
    size: Number(meta.size),
    mimeType: pickMime_(spec.mime_type, meta.mimeType, meta.name, kind),
    rangeable: true,
    read: function (start, end) {
      return fetchRange_(url, start, end, true);
    },
  };
}

function openBase64Media_(spec, kind) {
  var raw = String(spec.data);
  var dataUrl = raw.match(/^data:([^;,]+)[^,]*,/);
  var clean = raw.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
  var bytes;
  try {
    bytes = Utilities.base64Decode(clean);
  } catch (e) {
    try {
      bytes = Utilities.base64DecodeWebSafe(clean);
    } catch (e2) {
      throw toolError_('base64 data could not be decoded.');
    }
  }
  if (bytes.length > CONFIG.MAX_BASE64_BYTES) {
    throw toolError_(
      'Inline base64 is limited to ' + Math.round(CONFIG.MAX_BASE64_BYTES / 1048576) + ' MB.',
      'Use a URL, a Google Drive file or create_upload_session for larger files.'
    );
  }
  var name = spec.filename || 'upload';
  var mime = pickMime_(spec.mime_type || (dataUrl && dataUrl[1]), null, name, kind);
  var blob = Utilities.newBlob(bytes, mime, name);
  var size = bytes.length;
  return {
    spec: spec,
    name: name,
    size: size,
    mimeType: mime,
    rangeable: false,
    read: function (start, end) {
      if (start === 0 && end === size - 1) return { blob: blob, end: end };
      return { blob: Utilities.newBlob(bytes.slice(start, end + 1), mime, name), end: end };
    },
  };
}

/** Downloads bytes [start, end] (inclusive). Returns { blob, end } with the end actually served. */
function fetchRange_(url, start, end, withAuth) {
  var attempt = 0;
  for (;;) {
    var headers = { Range: 'bytes=' + start + '-' + end };
    if (withAuth) headers.Authorization = 'Bearer ' + ScriptApp.getOAuthToken();
    var res = UrlFetchApp.fetch(url, { headers: headers, muteHttpExceptions: true, followRedirects: true });
    var code = res.getResponseCode();
    if (code === 206) {
      var cr = String(header_(res, 'Content-Range') || '');
      var m = cr.match(/bytes\s+(\d+)-(\d+)\//);
      var servedEnd = m ? Number(m[2]) : end;
      if (m && Number(m[1]) !== start) throw toolError_('Source returned an unexpected byte range (' + cr + ').');
      return { blob: res.getBlob(), end: servedEnd };
    }
    if (code === 200 && start === 0) return { blob: res.getBlob(), end: end };
    if ((code >= 500 || code === 429) && attempt < 3) {
      Utilities.sleep(1000 * Math.pow(2, attempt));
      attempt++;
      continue;
    }
    throw toolError_(
      'Downloading bytes ' + start + '-' + end + ' of the source failed (HTTP ' + code + ').',
      'Signed or temporary links can expire; start a new upload with a fresh link.'
    );
  }
}

/** Reads a small file completely (thumbnails, banners, captions). */
function loadSmallBlob_(spec, kind, maxBytes, label) {
  var media = openMedia_(spec, kind);
  if (media.size > maxBytes) {
    throw toolError_(label + ' is ' + (media.size / 1048576).toFixed(1) + ' MB; the limit is ' + (maxBytes / 1048576).toFixed(0) + ' MB.');
  }
  var blob = media.read(0, media.size - 1).blob;
  blob.setContentType(media.mimeType);
  blob.setName(media.name);
  return blob;
}

/* ===== 04_Uploads.gs ===== */

/* Resumable upload engine.
 *
 * Each upload is a job persisted in Script Properties. A job owns a YouTube
 * resumable session (valid for about a week) and streams the source in chunks:
 *   source --(Range GET)--> Apps Script --(PUT Content-Range)--> YouTube
 * The calling tool works for CONFIG.FOREGROUND_BUDGET_MS, then a time-driven
 * trigger (processUploadQueue) continues in the background until done.
 * A lease on the job stops two executions from pushing the same upload.
 */

var JOB_PREFIX = 'ytjob:';
var WORKER_HANDLER = 'processUploadQueue';
var ACTIVE_JOB_STATES = ['uploading', 'finalizing'];

/* ------------------------------------------------------------ job store -- */

function saveJob_(job) {
  job.updated_at = new Date().toISOString();
  PropertiesService.getScriptProperties().setProperty(JOB_PREFIX + job.id, JSON.stringify(job));
}

function loadJob_(id) {
  var raw = PropertiesService.getScriptProperties().getProperty(JOB_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

function requireJob_(id) {
  var job = loadJob_(String(id || '').trim());
  if (!job) throw toolError_('No upload found with upload_id ' + id + '.', 'Use list_upload_jobs to see recent uploads.');
  return job;
}

function listJobs_() {
  var all = PropertiesService.getScriptProperties().getProperties();
  return Object.keys(all)
    .filter(function (k) {
      return k.indexOf(JOB_PREFIX) === 0;
    })
    .map(function (k) {
      return JSON.parse(all[k]);
    })
    .sort(function (a, b) {
      return a.created_at < b.created_at ? 1 : -1;
    });
}

function pruneJobs_() {
  var props = PropertiesService.getScriptProperties();
  var cutoff = Date.now() - CONFIG.JOB_RETENTION_MS;
  listJobs_().forEach(function (job) {
    var done = ACTIVE_JOB_STATES.indexOf(job.status) < 0;
    if (done && new Date(job.updated_at).getTime() < cutoff) props.deleteProperty(JOB_PREFIX + job.id);
  });
}

function acquireLease_(jobId, ms) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { busy: true, job: loadJob_(jobId) };
  try {
    var job = loadJob_(jobId);
    if (!job) return null;
    if (job.lease_until && job.lease_until > Date.now()) return { busy: true, job: job };
    job.lease_until = Date.now() + ms;
    saveJob_(job);
    return { busy: false, job: job };
  } finally {
    lock.releaseLock();
  }
}

function releaseLease_(job) {
  job.lease_until = 0;
  saveJob_(job);
}

/* --------------------------------------------------------- start upload -- */

/** Shared implementation of upload_video and upload_short. */
function startUpload_(args, isShort) {
  var started = Date.now();
  var spec = mediaSpecFromArgs_(args, { url: 'source_url', drive: 'drive_file_id', base64: 'base64_data', mime: 'mime_type' }, true);
  var thumb = mediaSpecFromArgs_(args, { url: 'thumbnail_url', drive: 'thumbnail_drive_file_id' }, false);
  var built = buildVideoResource_(args, isShort);
  var playlists = (args.playlist_ids || []).map(String).filter(Boolean);

  var media = openMedia_(spec, 'video');
  if (!media.size) throw toolError_('The source file is empty.');
  var session = createUploadSession_(built.resource, built.parts, media.size, media.mimeType, args.notify_subscribers !== false);

  var job = {
    id: 'up_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12),
    kind: 'managed',
    status: 'uploading',
    is_short: !!isShort,
    title: built.resource.snippet.title,
    privacy_status: built.resource.status.privacyStatus,
    publish_at: built.resource.status.publishAt,
    source: spec.type === 'base64' ? { type: 'base64' } : spec,
    file: { name: args.filename || media.name, size: media.size, mime_type: media.mimeType },
    session_uri: session,
    bytes_uploaded: 0,
    extras: { thumbnail: thumb, playlist_ids: playlists },
    warnings: built.warnings,
    attempts: 0,
    created_at: new Date().toISOString(),
    lease_until: Date.now() + CONFIG.FOREGROUND_BUDGET_MS + 60000,
  };
  saveJob_(job);

  runUploadJob_(job, media, started + CONFIG.FOREGROUND_BUDGET_MS);
  afterForegroundRun_(job);
  return jobView_(job, false);
}

/** Creates a YouTube resumable upload session and returns its URI. */
function createUploadSession_(resource, parts, size, mimeType, notify) {
  var url =
    YT_UPLOAD_API +
    'videos?' +
    queryString_({ uploadType: 'resumable', part: parts.join(','), notifySubscribers: notify !== false ? 'true' : 'false' });
  var headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': mimeType || 'video/*' };
  if (size) headers['X-Upload-Content-Length'] = String(size);
  var attempt = 0;
  for (;;) {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      payload: JSON.stringify(resource),
      headers: headers,
      muteHttpExceptions: true,
    });
    var code = res.getResponseCode();
    if (code === 200 || code === 201) {
      var location = header_(res, 'Location');
      if (!location) throw toolError_('YouTube did not return an upload session URL.');
      return location;
    }
    if ((code >= 500 || code === 429) && attempt < 2) {
      Utilities.sleep(1500 * (attempt + 1));
      attempt++;
      continue;
    }
    throw apiError_(code, res.getContentText(), 'POST', url);
  }
}

/* ------------------------------------------------------------ run a job -- */

/**
 * Pushes a job forward until it completes, fails or the deadline passes.
 * Never throws: failures are recorded on the job.
 */
function runUploadJob_(job, media, deadline) {
  try {
    if (job.status === 'finalizing') {
      finalizeJob_(job);
      return job;
    }
    if (job.status !== 'uploading') return job;
    if (!media) media = reopenJobMedia_(job);

    if (job.needs_sync) {
      var synced = querySession_(job);
      if (synced.video) return completeUpload_(job, synced.video);
      job.bytes_uploaded = synced.offset;
      job.needs_sync = false;
      saveJob_(job);
    }

    var avgMs = 0;
    var chunks = 0;
    while (job.bytes_uploaded < job.file.size) {
      var now = Date.now();
      if (now >= deadline || (chunks > 0 && now + avgMs * 1.25 > deadline)) break;
      var t0 = now;
      var start = job.bytes_uploaded;
      var end = media.rangeable ? Math.min(start + CONFIG.CHUNK_BYTES, job.file.size) - 1 : job.file.size - 1;
      var piece = media.read(start, end);
      var result = putUploadChunk_(job, piece.blob, start, piece.end);
      if (result.video) return completeUpload_(job, result.video);
      if (result.retry) {
        job.attempts = (job.attempts || 0) + 1;
        if (job.attempts > 8) throw toolError_('YouTube kept rejecting the upload chunks: ' + (result.message || 'server error'));
        Utilities.sleep(Math.min(16000, 1000 * Math.pow(2, job.attempts)));
        var state = querySession_(job);
        if (state.video) return completeUpload_(job, state.video);
        job.bytes_uploaded = state.offset;
      } else {
        job.bytes_uploaded = result.offset;
        job.attempts = 0;
      }
      chunks++;
      avgMs = (avgMs * (chunks - 1) + (Date.now() - t0)) / chunks;
      saveJob_(job);
    }

    if (job.bytes_uploaded >= job.file.size && job.status === 'uploading') {
      var last = querySession_(job);
      if (last.video) return completeUpload_(job, last.video);
      job.bytes_uploaded = last.offset;
    }
    saveJob_(job);
  } catch (err) {
    job.status = 'failed';
    job.error = err.message + (err.hint ? ' ' + err.hint : '');
    saveJob_(job);
  }
  return job;
}

function reopenJobMedia_(job) {
  if (!job.source || job.source.type === 'base64') {
    throw toolError_('Uploads sent as inline base64 cannot be resumed.', 'Start a new upload; for larger files use a URL or Google Drive.');
  }
  var media = openMedia_(job.source, 'video');
  if (media.size !== job.file.size) {
    throw toolError_('The source file changed size since the upload started (' + job.file.size + ' -> ' + media.size + ' bytes).');
  }
  return media;
}

function putUploadChunk_(job, blob, start, end) {
  var res;
  try {
    res = UrlFetchApp.fetch(job.session_uri, {
      method: 'put',
      contentType: job.file.mime_type,
      payload: blob,
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Range': 'bytes ' + start + '-' + end + '/' + job.file.size,
      },
      muteHttpExceptions: true,
      followRedirects: false,
    });
  } catch (e) {
    return { retry: true, message: e.message };
  }
  var code = res.getResponseCode();
  if (code === 200 || code === 201) return { video: JSON.parse(res.getContentText()) };
  if (code === 308) return { offset: rangeToOffset_(header_(res, 'Range')) };
  if (code === 404 || code === 410) throw sessionExpired_();
  if (code >= 500 || code === 429) return { retry: true, message: 'HTTP ' + code };
  throw apiError_(code, res.getContentText(), 'PUT', 'upload/youtube/v3/videos');
}

/** Asks YouTube how much of the upload it has. Returns { video } or { offset }. */
function querySession_(job) {
  var total = job.file && job.file.size ? job.file.size : '*';
  var res = UrlFetchApp.fetch(job.session_uri, {
    method: 'put',
    payload: '',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'Content-Range': 'bytes */' + total },
    muteHttpExceptions: true,
    followRedirects: false,
  });
  var code = res.getResponseCode();
  if (code === 200 || code === 201) return { video: JSON.parse(res.getContentText()) };
  if (code === 308) return { offset: rangeToOffset_(header_(res, 'Range')) };
  if (code === 404 || code === 410) throw sessionExpired_();
  throw apiError_(code, res.getContentText(), 'PUT', 'upload/youtube/v3/videos (status)');
}

function rangeToOffset_(range) {
  var m = String(range || '').match(/(\d+)-(\d+)/);
  return m ? Number(m[2]) + 1 : 0;
}

function sessionExpired_() {
  return toolError_('The YouTube upload session expired or was cancelled.', 'Start a new upload.');
}

function completeUpload_(job, video) {
  job.video_id = video.id;
  job.bytes_uploaded = job.file.size || job.bytes_uploaded;
  job.status = 'finalizing';
  job.error = undefined;
  if (video.status) job.privacy_status = video.status.privacyStatus || job.privacy_status;
  saveJob_(job);
  finalizeJob_(job);
  return job;
}

/** Post-upload steps: thumbnail and playlists. Failures become warnings. */
function finalizeJob_(job) {
  var extras = job.extras || {};
  job.extras_result = job.extras_result || {};
  job.warnings = job.warnings || [];
  if (extras.thumbnail && !job.extras_result.thumbnail) {
    try {
      setThumbnail_(job.video_id, extras.thumbnail);
      job.extras_result.thumbnail = 'set';
    } catch (e) {
      job.extras_result.thumbnail = 'failed';
      job.warnings.push('Thumbnail not set: ' + e.message + (e.hint ? ' ' + e.hint : ''));
    }
  }
  if (extras.playlist_ids && extras.playlist_ids.length && !job.extras_result.playlists) {
    job.extras_result.playlists = extras.playlist_ids.map(function (pid) {
      try {
        insertPlaylistItem_(pid, job.video_id);
        return { playlist_id: pid, added: true };
      } catch (e) {
        job.warnings.push('Not added to playlist ' + pid + ': ' + e.message);
        return { playlist_id: pid, added: false };
      }
    });
  }
  job.status = 'completed';
  job.completed_at = new Date().toISOString();
  job.lease_until = 0;
  saveJob_(job);
}

/* ---------------------------------------------------- background worker -- */

function afterForegroundRun_(job) {
  if (job.status === 'uploading' || job.status === 'finalizing') {
    job.lease_until = 0;
    job.background = ensureUploadWorker_();
    saveJob_(job);
  } else if (job.lease_until) {
    releaseLease_(job);
  }
}

function ensureUploadWorker_() {
  try {
    var exists = ScriptApp.getProjectTriggers().some(function (t) {
      return t.getHandlerFunction() === WORKER_HANDLER;
    });
    if (!exists) ScriptApp.newTrigger(WORKER_HANDLER).timeBased().after(10 * 1000).create();
    return true;
  } catch (e) {
    console.warn('Could not schedule the background upload worker: ' + e.message);
    return false;
  }
}

function deleteWorkerTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === WORKER_HANDLER) ScriptApp.deleteTrigger(t);
  });
}

/** Time-driven trigger entry point: continues every unfinished upload. */
function processUploadQueue() {
  deleteWorkerTriggers_();
  var deadline = Date.now() + CONFIG.BACKGROUND_BUDGET_MS;
  listJobs_().forEach(function (job) {
    if (ACTIVE_JOB_STATES.indexOf(job.status) < 0 || job.kind !== 'managed') return;
    if (Date.now() > deadline - 20000) return;
    var lease = acquireLease_(job.id, CONFIG.BACKGROUND_BUDGET_MS + 60000);
    if (!lease || lease.busy) return;
    runUploadJob_(lease.job, null, deadline);
    if (lease.job.lease_until) releaseLease_(lease.job);
  });
  var pending = listJobs_().some(function (job) {
    return job.kind === 'managed' && ACTIVE_JOB_STATES.indexOf(job.status) >= 0;
  });
  if (pending) ensureUploadWorker_();
  pruneJobs_();
}

/* ---------------------------------------------------------- job outputs -- */

function jobView_(job, withProcessing) {
  var total = job.file && job.file.size ? job.file.size : null;
  var view = {
    upload_id: job.id,
    status: job.status,
    title: job.title,
    is_short: job.is_short || undefined,
    privacy_status: job.privacy_status,
    publish_at: job.publish_at,
    file: job.file && job.file.name ? { name: job.file.name, size_mb: total ? Math.round((total / 1048576) * 10) / 10 : undefined } : undefined,
    progress:
      job.status === 'completed'
        ? undefined
        : {
            bytes_uploaded: job.bytes_uploaded || 0,
            total_bytes: total,
            percent: total ? Math.floor(((job.bytes_uploaded || 0) / total) * 1000) / 10 : null,
          },
    video_id: job.video_id,
    watch_url: job.video_id ? 'https://www.youtube.com/watch?v=' + job.video_id : undefined,
    shorts_url: job.video_id && job.is_short ? 'https://www.youtube.com/shorts/' + job.video_id : undefined,
    studio_url: job.video_id ? 'https://studio.youtube.com/video/' + job.video_id + '/edit' : undefined,
    extras: job.extras_result && Object.keys(job.extras_result).length ? job.extras_result : undefined,
    warnings: job.warnings && job.warnings.length ? job.warnings : undefined,
    error: job.error,
    created_at: job.created_at,
    updated_at: job.updated_at,
  };
  if (job.kind === 'external' && job.status === 'awaiting_client') view.upload_url = job.session_uri;
  if (withProcessing && job.video_id) {
    try {
      var v = fetchVideos_([job.video_id], 'status,processingDetails')[0];
      if (v) {
        view.processing = dropEmpty_({
          upload_status: v.status && v.status.uploadStatus,
          privacy_status: v.status && v.status.privacyStatus,
          failure_reason: v.status && v.status.failureReason,
          rejection_reason: v.status && v.status.rejectionReason,
          processing_status: v.processingDetails && v.processingDetails.processingStatus,
          progress: v.processingDetails && v.processingDetails.processingProgress,
        });
        var requestedPublic = job.privacy_status === 'public' || job.privacy_status === 'unlisted';
        if (requestedPublic && v.status && v.status.privacyStatus === 'private' && !job.publish_at) {
          view.warnings = (view.warnings || []).concat(
            'YouTube kept this video private. Uploads from API projects that have not passed the YouTube API audit are locked to private; publish it manually in YouTube Studio or get the project audited.'
          );
        }
      }
    } catch (e) {
      view.processing = { error: e.message };
    }
  }
  view.next_step = nextStep_(job);
  return dropEmpty_(view);
}

function nextStep_(job) {
  switch (job.status) {
    case 'uploading':
      return job.background === false
        ? 'Not finished yet. Call resume_upload with this upload_id to continue.'
        : 'Still uploading in the background. Check get_upload_status in about a minute, or call resume_upload to push it now.';
    case 'finalizing':
      return 'Video received; setting thumbnail/playlists. Check get_upload_status shortly.';
    case 'completed':
      return 'Uploaded. YouTube may still be processing it; get_upload_status shows processing progress.';
    case 'failed':
      return job.source && job.source.type === 'base64'
        ? 'Start a new upload.'
        : 'Call resume_upload to retry from the last byte YouTube confirmed, or start a new upload.';
    case 'awaiting_client':
      return 'PUT the file to upload_url (see create_upload_session), then call get_upload_status to finish.';
    case 'cancelled':
      return 'Cancelled.';
    default:
      return undefined;
  }
}

/* ===== 05_Format.gs ===== */

/* Video metadata building/validation and compact output shapes. */

/** Tool input properties shared by upload_video, upload_short and create_upload_session. */
function videoMetadataInputs_() {
  return {
    title: sStr_('Video title, max 100 characters, no < or >.'),
    description: sStr_('Description, max 5,000 bytes. The first three hashtags show above the title.'),
    tags: sArr_(sStr_('Tag'), 'Tags/keywords. Combined length must stay under 500 characters; extras are dropped with a warning.'),
    category_id: sStr_(
      'Category ID. Default 22 (People & Blogs). Common: 1 Film & Animation, 10 Music, 17 Sports, 20 Gaming, 23 Comedy, 24 Entertainment, 25 News & Politics, 26 Howto & Style, 27 Education, 28 Science & Technology. See list_video_categories.'
    ),
    privacy_status: sEnum_(['private', 'unlisted', 'public'], 'Visibility. Default private.'),
    publish_at: sStr_('Schedule the release at this ISO 8601 time, e.g. 2026-12-01T18:30:00+05:30. The video stays private until then.'),
    made_for_kids: sBool_('Self-declare the video as made for kids (COPPA). Default false.'),
    contains_synthetic_media: sBool_('Disclose realistic altered or AI-generated content (YouTube label).'),
    default_language: sStr_('Language of the title and description, BCP-47 code such as en or hi.'),
    default_audio_language: sStr_('Spoken language of the video, BCP-47 code.'),
    license: sEnum_(['youtube', 'creativeCommon'], 'License. Default youtube.'),
    embeddable: sBool_('Allow embedding on other websites. Default true.'),
    public_stats_viewable: sBool_('Show the like count publicly. Default true.'),
    recording_date: sStr_('ISO 8601 date-time when the video was recorded.'),
    localizations: sObj_('Translated metadata, e.g. {"hi": {"title": "...", "description": "..."}}. Requires default_language.'),
    notify_subscribers: sBool_('Notify subscribers about the new upload. Default true.'),
  };
}

/** Builds the video resource for videos.insert. Returns { resource, parts, warnings }. */
function buildVideoResource_(args, isShort) {
  var warnings = [];
  var title = cleanTitle_(args.title, warnings);
  if (!title) throw toolError_('title is required.');
  var description = cleanText_(args.description || '', 'description', warnings);
  if (isShort && args.add_shorts_hashtag !== false && !/#shorts\b/i.test(title + ' ' + description)) {
    description = description ? description + '\n\n#Shorts' : '#Shorts';
  }
  checkDescription_(description);
  var tags = normalizeTags_(args.tags, warnings);

  var snippet = dropEmpty_({
    title: title,
    description: description,
    tags: tags.length ? tags : undefined,
    categoryId: String(args.category_id || CONFIG.DEFAULT_CATEGORY_ID),
    defaultLanguage: args.default_language,
    defaultAudioLanguage: args.default_audio_language,
  });

  var status = dropEmpty_({
    privacyStatus: args.privacy_status || 'private',
    selfDeclaredMadeForKids: args.made_for_kids === true,
    containsSyntheticMedia: typeof args.contains_synthetic_media === 'boolean' ? args.contains_synthetic_media : undefined,
    license: args.license,
    embeddable: typeof args.embeddable === 'boolean' ? args.embeddable : undefined,
    publicStatsViewable: typeof args.public_stats_viewable === 'boolean' ? args.public_stats_viewable : undefined,
  });
  if (args.publish_at) {
    status.publishAt = futureIso_(args.publish_at);
    if (status.privacyStatus !== 'private') warnings.push('privacy_status was set to private because publish_at schedules the release.');
    status.privacyStatus = 'private';
  }

  var resource = { snippet: snippet, status: status };
  var parts = ['snippet', 'status'];
  if (args.recording_date) {
    resource.recordingDetails = { recordingDate: toIsoTime_(args.recording_date, 'recording_date') };
    parts.push('recordingDetails');
  }
  if (args.localizations) {
    if (!snippet.defaultLanguage) throw toolError_('localizations require default_language.');
    resource.localizations = normalizeLocalizations_(args.localizations);
    parts.push('localizations');
  }
  return { resource: resource, parts: parts, warnings: warnings };
}

function futureIso_(value) {
  var iso = toIsoTime_(value, 'publish_at');
  if (new Date(iso).getTime() < Date.now() + 60 * 1000) throw toolError_('publish_at must be in the future.');
  return iso;
}

function cleanTitle_(title, warnings) {
  var t = String(title || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (/[<>]/.test(t)) {
    t = t.replace(/[<>]/g, '');
    if (warnings) warnings.push('Removed < and > from the title (YouTube rejects them).');
  }
  if (t.length > 100) throw toolError_('The title is ' + t.length + ' characters; YouTube allows at most 100.');
  return t;
}

function cleanText_(text, field, warnings) {
  var t = String(text || '');
  if (/[<>]/.test(t)) {
    t = t.replace(/</g, '\u2039').replace(/>/g, '\u203a');
    if (warnings) warnings.push('Replaced < and > in the ' + field + ' with \u2039 and \u203a (YouTube rejects them).');
  }
  return t;
}

function checkDescription_(description) {
  var bytes = utf8Length_(description);
  if (bytes > 5000) throw toolError_('The description is ' + bytes + ' bytes; YouTube allows at most 5,000.');
}

function normalizeTags_(tags, warnings) {
  if (!tags) return [];
  var list = Array.isArray(tags) ? tags : String(tags).split(',');
  var seen = {};
  var out = [];
  var used = 0;
  var dropped = 0;
  list.forEach(function (raw) {
    var tag = String(raw)
      .replace(/^#/, '')
      .replace(/[<>,]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!tag || seen[tag.toLowerCase()]) return;
    var cost = tag.length + (/\s/.test(tag) ? 2 : 0) + (out.length ? 1 : 0);
    if (used + cost > 500) {
      dropped++;
      return;
    }
    seen[tag.toLowerCase()] = true;
    used += cost;
    out.push(tag);
  });
  if (dropped && warnings) warnings.push('Dropped ' + dropped + ' tag(s) to stay within the 500 character limit.');
  return out;
}

function normalizeLocalizations_(loc) {
  var out = {};
  Object.keys(loc || {}).forEach(function (lang) {
    var v = loc[lang] || {};
    out[lang] = dropEmpty_({
      title: v.title !== undefined ? cleanTitle_(v.title) : undefined,
      description: v.description !== undefined ? cleanText_(v.description, 'localized description') : undefined,
    });
  });
  return out;
}

/* ------------------------------------------------------- compact shapes -- */

/** true / false, or null when there is not enough information yet. */
function classifyShort_(v) {
  var cd = v.contentDetails || {};
  if (!cd.duration) return null;
  if (v.liveStreamingDetails) return false;
  var seconds = isoDurationToSeconds_(cd.duration);
  if (!seconds || seconds > CONFIG.SHORTS_MAX_SECONDS) return false;
  var stream = v.fileDetails && v.fileDetails.videoStreams && v.fileDetails.videoStreams[0];
  if (stream && stream.widthPixels && stream.heightPixels) {
    var w = stream.widthPixels;
    var h = stream.heightPixels;
    if (stream.rotation === 'clockwise' || stream.rotation === 'counterClockwise') {
      var tmp = w;
      w = h;
      h = tmp;
    }
    return h >= w;
  }
  return seconds <= 60;
}

function compactVideo_(v, full) {
  var sn = v.snippet || {};
  var st = v.status || {};
  var cd = v.contentDetails || {};
  var stats = v.statistics || {};
  var isShort = classifyShort_(v);
  var out = {
    id: v.id,
    title: sn.title,
    url: 'https://www.youtube.com/watch?v=' + v.id,
    shorts_url: isShort ? 'https://www.youtube.com/shorts/' + v.id : undefined,
    is_short: isShort === null ? undefined : isShort,
    duration_seconds: cd.duration ? isoDurationToSeconds_(cd.duration) : undefined,
    published_at: sn.publishedAt,
    privacy_status: st.privacyStatus,
    publish_at: st.publishAt,
    upload_status: st.uploadStatus && st.uploadStatus !== 'processed' ? st.uploadStatus : undefined,
    views: num_(stats.viewCount),
    likes: num_(stats.likeCount),
    comments: num_(stats.commentCount),
    live: sn.liveBroadcastContent && sn.liveBroadcastContent !== 'none' ? sn.liveBroadcastContent : undefined,
    thumbnail: bestThumb_(sn.thumbnails),
    description: full ? sn.description : truncate_(sn.description, 160) || undefined,
  };
  if (full) {
    out.channel_id = sn.channelId;
    out.channel_title = sn.channelTitle;
    out.tags = sn.tags;
    out.category_id = sn.categoryId;
    out.default_language = sn.defaultLanguage;
    out.default_audio_language = sn.defaultAudioLanguage;
    out.made_for_kids = st.madeForKids;
    out.self_declared_made_for_kids = st.selfDeclaredMadeForKids;
    out.contains_synthetic_media = st.containsSyntheticMedia;
    out.license = st.license;
    out.embeddable = st.embeddable;
    out.public_stats_viewable = st.publicStatsViewable;
    out.definition = cd.definition;
    out.caption = cd.caption === 'true' ? true : cd.caption === 'false' ? false : undefined;
    out.licensed_content = cd.licensedContent;
    out.region_restriction = cd.regionRestriction;
    out.favorites = num_(stats.favoriteCount) || undefined;
    out.recording_date = v.recordingDetails ? v.recordingDetails.recordingDate : undefined;
    out.localizations = v.localizations;
    out.topics = v.topicDetails ? v.topicDetails.topicCategories : undefined;
    out.failure_reason = st.failureReason;
    out.rejection_reason = st.rejectionReason;
    if (v.processingDetails) {
      out.processing = dropEmpty_({
        status: v.processingDetails.processingStatus,
        progress: v.processingDetails.processingProgress,
        failure_reason: v.processingDetails.processingFailureReason,
      });
    }
    if (v.fileDetails) {
      var vs = (v.fileDetails.videoStreams || [])[0] || {};
      out.file = dropEmpty_({
        name: v.fileDetails.fileName,
        size_bytes: num_(v.fileDetails.fileSize),
        width: vs.widthPixels,
        height: vs.heightPixels,
        fps: vs.frameRateFps,
        codec: vs.codec,
        container: v.fileDetails.container,
      });
    }
    if (v.liveStreamingDetails) out.live_details = v.liveStreamingDetails;
    out.studio_url = 'https://studio.youtube.com/video/' + v.id + '/edit';
  }
  return dropEmpty_(out);
}

/** Fetches videos by ID in batches of 50, preserving input order. */
function fetchVideos_(ids, parts) {
  var out = [];
  for (var i = 0; i < ids.length; i += 50) {
    var batch = ids.slice(i, i + 50);
    var res = gapi_('GET', YT_API + 'videos', { query: { part: parts, id: batch.join(','), maxResults: 50 } });
    var byId = {};
    (res.items || []).forEach(function (v) {
      byId[v.id] = v;
    });
    batch.forEach(function (id) {
      if (byId[id]) out.push(byId[id]);
    });
  }
  return out;
}

/* ===== 10_ToolsUploads.gs ===== */

/* Tools: uploads (videos and Shorts). */

function registerUploadTools_(tool) {
  var sourceInputs = {
    source_url: sStr_(
      'Public direct-download URL of the video file (mp4, mov, webm, ...). Google Drive share links and Dropbox links are converted automatically.'
    ),
    drive_file_id: sStr_('Google Drive file ID or share link of a video in the Drive of the account running this server.'),
    base64_data: sStr_('Whole video as base64 (or a data: URL). Only for small files, max 30 MB.'),
    mime_type: sStr_('Override the file content type, e.g. video/mp4. Usually detected automatically.'),
    filename: sStr_('Original file name, informational only.'),
  };
  var extrasInputs = {
    thumbnail_url: sStr_('Custom thumbnail image URL (JPEG/PNG, max 2 MB, 1280x720 recommended). Set after the upload finishes.'),
    thumbnail_drive_file_id: sStr_('Custom thumbnail from Google Drive (file ID or share link).'),
    playlist_ids: sArr_(sStr_('Playlist ID'), 'Add the video to these playlists once uploaded.'),
  };

  var videoInput = ext_(ext_(ext_({}, sourceInputs), videoMetadataInputs_()), extrasInputs);
  tool(
    'upload_video',
    {
      group: 'uploads',
      title: 'Upload video',
      description:
        'Upload a video to the channel from a public URL, a Google Drive file or small base64 data. Any file size works: about 40 seconds of transfer happen in this call and the rest continues in the background (poll get_upload_status with the returned upload_id). Can set a custom thumbnail and add the video to playlists when done. New videos are private unless privacy_status or publish_at is given. For a file on the user\'s computer use create_upload_session instead.',
      input: videoInput,
      required: ['title'],
      annotations: ANN_WRITE,
    },
    function (args) {
      return startUpload_(args, false);
    }
  );

  var shortInput = ext_(ext_({}, sourceInputs), videoMetadataInputs_());
  shortInput.playlist_ids = extrasInputs.playlist_ids;
  shortInput.add_shorts_hashtag = sBool_('Append #Shorts to the description if it is not already in the title or description. Default true.');
  tool(
    'upload_short',
    {
      group: 'uploads',
      title: 'Upload Short',
      description:
        'Upload a YouTube Short: a vertical (9:16) or square video up to 3 minutes long. YouTube decides Shorts by shape and length; this tool also adds #Shorts to the description. Same sources and behaviour as upload_video (URL, Google Drive or base64; background continuation; private by default). Returns the shorts_url once uploaded.',
      input: shortInput,
      required: ['title'],
      annotations: ANN_WRITE,
    },
    function (args) {
      return startUpload_(args, true);
    }
  );

  tool(
    'get_upload_status',
    {
      group: 'uploads',
      title: 'Get upload status',
      description:
        'Progress of an upload started with upload_video, upload_short or create_upload_session: bytes transferred, video ID and URLs once done, thumbnail/playlist results, and YouTube processing status.',
      input: {
        upload_id: sStr_('upload_id returned when the upload started.'),
        video_id: sStr_(
          'Only for create_upload_session uploads: the video ID returned by your PUT, if YouTube no longer reports the finished session.'
        ),
        include_processing: sBool_('Also fetch YouTube processing status for finished uploads. Default true.'),
      },
      required: ['upload_id'],
      annotations: ANN_READ,
    },
    function (args) {
      var job = requireJob_(args.upload_id);
      if (job.kind === 'external' && job.status === 'awaiting_client') job = checkExternalUpload_(job, args.video_id);
      if (job.status === 'finalizing' && !(job.lease_until > Date.now())) finalizeJob_(job);
      return jobView_(job, args.include_processing !== false);
    }
  );

  tool(
    'resume_upload',
    {
      group: 'uploads',
      title: 'Resume upload',
      description:
        'Continue an unfinished or failed upload right now from the last byte YouTube confirmed. Background uploads continue on their own, so this is only needed to speed things up or to retry a failed upload.',
      input: {
        upload_id: sStr_('upload_id of the upload.'),
        time_budget_seconds: sInt_('Seconds to spend in this call (10-300, default 40). Keep under your client\'s tool timeout.', {
          minimum: 10,
          maximum: 300,
        }),
      },
      required: ['upload_id'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var started = Date.now();
      var job = requireJob_(args.upload_id);
      if (job.kind === 'external') throw toolError_('This upload is sent by your client via create_upload_session; use get_upload_status.');
      if (job.status === 'completed' || job.status === 'cancelled') return jobView_(job, false);
      var budget = (args.time_budget_seconds || CONFIG.FOREGROUND_BUDGET_MS / 1000) * 1000;
      var lease = acquireLease_(job.id, budget + 60000);
      if (!lease) throw toolError_('Upload ' + args.upload_id + ' no longer exists.');
      if (lease.busy) {
        var view = jobView_(lease.job || job, false);
        view.note = 'Another execution (probably the background worker) is uploading this right now.';
        return view;
      }
      job = lease.job;
      if (job.status === 'failed') {
        job.status = 'uploading';
        job.error = undefined;
        job.attempts = 0;
        job.needs_sync = true;
      } else if (job.bytes_uploaded > 0) {
        job.needs_sync = true;
      }
      runUploadJob_(job, null, started + budget);
      afterForegroundRun_(job);
      return jobView_(job, false);
    }
  );

  tool(
    'cancel_upload',
    {
      group: 'uploads',
      title: 'Cancel upload',
      description: 'Stop an unfinished upload and discard its YouTube upload session. Finished uploads are not affected (use delete_video).',
      input: { upload_id: sStr_('upload_id of the upload.') },
      required: ['upload_id'],
      annotations: ANN_DELETE,
    },
    function (args) {
      var job = requireJob_(args.upload_id);
      if (job.status === 'completed' || job.status === 'finalizing') {
        throw toolError_('This upload already finished (video ' + job.video_id + ').', 'Use delete_video to remove the video.');
      }
      try {
        UrlFetchApp.fetch(job.session_uri, {
          method: 'delete',
          headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
          muteHttpExceptions: true,
        });
      } catch (e) {
        // The session simply expires if YouTube does not accept the DELETE.
      }
      job.status = 'cancelled';
      job.lease_until = 0;
      saveJob_(job);
      return jobView_(job, false);
    }
  );

  tool(
    'list_upload_jobs',
    {
      group: 'uploads',
      title: 'List upload jobs',
      description: 'Recent uploads handled by this server (kept for 7 days) with their status and progress.',
      input: { active_only: sBool_('Only uploads that are still in progress. Default false.') },
      annotations: ANN_READ,
    },
    function (args) {
      var jobs = listJobs_().filter(function (j) {
        return !args.active_only || ACTIVE_JOB_STATES.indexOf(j.status) >= 0 || j.status === 'awaiting_client';
      });
      return {
        uploads: jobs.map(function (j) {
          return jobView_(j, false);
        }),
      };
    }
  );

  var sessionInput = ext_({}, videoMetadataInputs_());
  sessionInput.file_size_bytes = sInt_('Exact file size in bytes (optional but recommended).', { minimum: 1 });
  sessionInput.mime_type = sStr_('Content type of the file, e.g. video/mp4. Default video/*.');
  sessionInput.is_short = sBool_('Treat as a Short (adds #Shorts to the description). Default false.');
  sessionInput.thumbnail_url = extrasInputs.thumbnail_url;
  sessionInput.thumbnail_drive_file_id = extrasInputs.thumbnail_drive_file_id;
  sessionInput.playlist_ids = extrasInputs.playlist_ids;
  tool(
    'create_upload_session',
    {
      group: 'uploads',
      title: 'Create direct upload session',
      description:
        'For files on the user\'s machine: creates a YouTube resumable upload session with the given metadata and returns an upload_url. Upload the raw file bytes with an HTTP PUT to that URL (a curl command is included); the response contains the new video. Then call get_upload_status with the upload_id to apply the thumbnail/playlists. The upload_url acts as a one-time upload credential, so do not share it.',
      input: sessionInput,
      required: ['title'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var built = buildVideoResource_(args, !!args.is_short);
      var mime = args.mime_type || 'video/*';
      var session = createUploadSession_(built.resource, built.parts, args.file_size_bytes || null, mime, args.notify_subscribers !== false);
      var job = {
        id: 'up_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12),
        kind: 'external',
        status: 'awaiting_client',
        is_short: !!args.is_short,
        title: built.resource.snippet.title,
        privacy_status: built.resource.status.privacyStatus,
        publish_at: built.resource.status.publishAt,
        file: { size: args.file_size_bytes || null, mime_type: mime },
        session_uri: session,
        bytes_uploaded: 0,
        extras: {
          thumbnail: mediaSpecFromArgs_(args, { url: 'thumbnail_url', drive: 'thumbnail_drive_file_id' }, false),
          playlist_ids: (args.playlist_ids || []).map(String),
        },
        warnings: built.warnings,
        created_at: new Date().toISOString(),
      };
      saveJob_(job);
      var contentType = mime === 'video/*' ? 'video/mp4' : mime;
      return dropEmpty_({
        upload_id: job.id,
        upload_url: session,
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        curl: 'curl -X PUT -H "Content-Type: ' + contentType + '" --upload-file "/path/to/video.mp4" "' + session + '"',
        resumable_tip:
          'For an interrupted transfer, PUT an empty body with header "Content-Range: bytes */TOTAL" to learn the confirmed byte range, then send the rest with "Content-Range: bytes START-END/TOTAL".',
        next_step: 'After the PUT returns the video JSON, call get_upload_status with this upload_id.',
        warnings: built.warnings.length ? built.warnings : undefined,
      });
    }
  );
}

/** Checks a client-driven (create_upload_session) upload and finalizes it when done. */
function checkExternalUpload_(job, videoId) {
  if (videoId) return completeUpload_(job, { id: extractVideoId_(videoId) });
  try {
    var state = querySession_(job);
    if (state.video) return completeUpload_(job, state.video);
    job.bytes_uploaded = state.offset;
    saveJob_(job);
  } catch (e) {
    job.warnings = (job.warnings || []).concat(
      'Could not query the upload session (' + e.message + '). If your PUT already returned a video ID, pass it as video_id.'
    );
  }
  return job;
}

function setThumbnail_(videoId, spec) {
  var blob = loadSmallBlob_(spec, 'image', CONFIG.MAX_THUMBNAIL_BYTES, 'The thumbnail');
  var type = /^image\/(jpeg|png|bmp|gif)$/.test(blob.getContentType()) ? blob.getContentType() : 'application/octet-stream';
  return gapi_('POST', YT_UPLOAD_API + 'thumbnails/set', {
    query: { videoId: videoId, uploadType: 'media' },
    payload: blob,
    contentType: type,
  });
}

/* ===== 11_ToolsVideos.gs ===== */

/* Tools: videos and Shorts (read, update, delete, thumbnails, ratings, search). */

function registerVideoTools_(tool) {
  tool(
    'list_my_videos',
    {
      group: 'videos',
      title: 'List my videos and Shorts',
      description:
        'List the channel\'s uploads, newest first, including private and unlisted ones, with views, likes, comments, duration and whether each is a Short. Filter by type (shorts/long), privacy or a title search. Costs about 2 quota units per page.',
      input: {
        type: sEnum_(['all', 'shorts', 'long'], 'all (default), shorts (vertical/square up to 3 min) or long (regular videos).'),
        privacy_status: sEnum_(['public', 'unlisted', 'private'], 'Only videos with this visibility.'),
        title_contains: sStr_('Case-insensitive text the title must contain.'),
        max_results: sMax_(50, 25),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var ch = getMyChannel_();
      if (!ch.uploads) throw toolError_('Could not find the channel\'s uploads playlist.');
      var want = args.max_results || 25;
      var type = args.type || 'all';
      var needle = args.title_contains ? String(args.title_contains).toLowerCase() : '';
      var filtering = type !== 'all' || !!args.privacy_status || !!needle;
      var collected = [];
      var token = args.page_token;
      var pages = 0;
      var scanned = 0;
      do {
        var page = gapi_('GET', YT_API + 'playlistItems', {
          query: { part: 'contentDetails', playlistId: ch.uploads, maxResults: filtering ? 50 : want, pageToken: token },
        });
        var ids = (page.items || []).map(function (i) {
          return i.contentDetails.videoId;
        });
        scanned += ids.length;
        fetchVideos_(ids, 'snippet,contentDetails,statistics,status,fileDetails').forEach(function (v) {
          var c = compactVideo_(v, false);
          if (type === 'shorts' && c.is_short !== true) return;
          if (type === 'long' && c.is_short === true) return;
          if (args.privacy_status && c.privacy_status !== args.privacy_status) return;
          if (needle && String(c.title || '').toLowerCase().indexOf(needle) < 0) return;
          collected.push(c);
        });
        token = page.nextPageToken;
        pages++;
      } while (filtering && token && collected.length < want && pages < 6);
      return dropEmpty_({
        channel: ch.title,
        videos: collected,
        scanned: filtering ? scanned : undefined,
        next_page_token: token || null,
      });
    }
  );

  tool(
    'get_videos',
    {
      group: 'videos',
      title: 'Get video details',
      description:
        'Full details for up to 50 videos by ID or URL: title, description, tags, category, privacy, schedule, stats, duration, Short detection, captions flag, and for your own videos file and processing info.',
      input: {
        video_ids: sArr_(sStr_('Video ID or youtube.com / youtu.be / shorts URL'), 'Videos to fetch (max 50).'),
        include_owner_details: sBool_('Include file and processing details (only for your own videos). Default true.'),
        raw: sBool_('Return the raw YouTube API resources instead of the compact shape. Default false.'),
      },
      required: ['video_ids'],
      annotations: ANN_READ,
    },
    function (args) {
      var ids = toIdList_(args.video_ids).slice(0, 50);
      var parts = 'snippet,contentDetails,statistics,status,topicDetails,recordingDetails,localizations,liveStreamingDetails';
      var items;
      if (args.include_owner_details !== false) {
        try {
          items = fetchVideos_(ids, parts + ',fileDetails,processingDetails');
        } catch (e) {
          items = fetchVideos_(ids, parts);
        }
      } else {
        items = fetchVideos_(ids, parts);
      }
      var found = items.map(function (v) {
        return v.id;
      });
      var missing = ids.filter(function (id) {
        return found.indexOf(id) < 0;
      });
      return dropEmpty_({
        videos: args.raw
          ? items
          : items.map(function (v) {
              return compactVideo_(v, true);
            }),
        not_found: missing.length ? missing : undefined,
      });
    }
  );

  tool(
    'update_video',
    {
      group: 'videos',
      title: 'Update video',
      description:
        'Edit a video or Short you own. Only the fields you pass change; everything else (tags, description, schedule, ...) is preserved. Use publish_at to schedule, privacy_status to publish/unpublish, publish_at "" to clear a schedule.',
      input: {
        video_id: sStr_('Video ID or URL.'),
        title: sStr_('New title (max 100 characters).'),
        description: sStr_('New description (replaces the old one).'),
        append_to_description: sStr_('Text appended to the end of the current description.'),
        tags: sArr_(sStr_('Tag'), 'New tag list (replaces the old one).'),
        add_tags: sArr_(sStr_('Tag'), 'Tags to add to the existing ones.'),
        category_id: sStr_('Category ID.'),
        default_language: sStr_('Language of title/description (BCP-47).'),
        default_audio_language: sStr_('Spoken language (BCP-47).'),
        privacy_status: sEnum_(['private', 'unlisted', 'public'], 'Visibility.'),
        publish_at: sStr_('ISO 8601 time to publish (keeps the video private until then). Pass an empty string to remove the schedule.'),
        made_for_kids: sBool_('Self-declared made for kids.'),
        contains_synthetic_media: sBool_('Altered or synthetic content disclosure.'),
        embeddable: sBool_('Allow embedding.'),
        license: sEnum_(['youtube', 'creativeCommon'], 'License.'),
        public_stats_viewable: sBool_('Show like count publicly.'),
        recording_date: sStr_('ISO 8601 recording date-time.'),
        localizations: sObj_('Translations to add or replace, e.g. {"hi": {"title": "...", "description": "..."}}.'),
      },
      required: ['video_id'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      return updateVideo_(args);
    }
  );

  tool(
    'delete_video',
    {
      group: 'videos',
      title: 'Delete video',
      description: 'Permanently delete a video or Short from the channel. This cannot be undone.',
      input: { video_id: sStr_('Video ID or URL.') },
      required: ['video_id'],
      annotations: ANN_DELETE,
    },
    function (args) {
      var id = extractVideoId_(args.video_id);
      gapi_('DELETE', YT_API + 'videos', { query: { id: id } });
      return { deleted: true, video_id: id };
    }
  );

  tool(
    'set_video_thumbnail',
    {
      group: 'videos',
      title: 'Set custom thumbnail',
      description:
        'Upload a custom thumbnail (JPEG/PNG, max 2 MB, 1280x720 recommended) for a video. The channel must be phone-verified. Shorts generally show a frame chosen in the YouTube app instead.',
      input: {
        video_id: sStr_('Video ID or URL.'),
        image_url: sStr_('Public image URL.'),
        drive_file_id: sStr_('Google Drive file ID or share link of the image.'),
        base64_data: sStr_('Image as base64 or a data: URL.'),
        mime_type: sStr_('image/jpeg or image/png (auto-detected).'),
      },
      required: ['video_id'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var spec = mediaSpecFromArgs_(args, { url: 'image_url', drive: 'drive_file_id', base64: 'base64_data', mime: 'mime_type' }, true);
      var id = extractVideoId_(args.video_id);
      var res = setThumbnail_(id, spec);
      var t = res.items && res.items[0];
      return { video_id: id, thumbnail_url: t ? bestThumb_(t) : undefined, set: true };
    }
  );

  tool(
    'rate_video',
    {
      group: 'videos',
      title: 'Like / dislike video',
      description: 'Like, dislike or remove your rating from any video as the authorized channel.',
      input: {
        video_id: sStr_('Video ID or URL.'),
        rating: sEnum_(['like', 'dislike', 'none'], 'none removes the rating.'),
      },
      required: ['video_id', 'rating'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var id = extractVideoId_(args.video_id);
      gapi_('POST', YT_API + 'videos/rate', { query: { id: id, rating: args.rating } });
      return { video_id: id, rating: args.rating };
    }
  );

  tool(
    'get_my_ratings',
    {
      group: 'videos',
      title: 'Get my ratings',
      description: 'Whether the authorized channel liked or disliked the given videos.',
      input: { video_ids: sArr_(sStr_('Video ID or URL'), 'Up to 50 videos.') },
      required: ['video_ids'],
      annotations: ANN_READ,
    },
    function (args) {
      var res = gapi_('GET', YT_API + 'videos/getRating', { query: { id: toIdList_(args.video_ids).slice(0, 50).join(',') } });
      return {
        ratings: (res.items || []).map(function (i) {
          return { video_id: i.videoId, rating: i.rating };
        }),
      };
    }
  );

  tool(
    'search_youtube',
    {
      group: 'videos',
      title: 'Search YouTube',
      description:
        'Search all of YouTube (or only your channel with for_mine) for videos, channels or playlists. Costs 100 quota units per call, so prefer list_my_videos for your own uploads.',
      input: {
        query: sStr_('Search text. Supports | (OR) and - (NOT).'),
        type: sEnum_(['video', 'channel', 'playlist'], 'Result type. Default video.'),
        for_mine: sBool_('Only search the authorized channel\'s videos (type must be video).'),
        channel_id: sStr_('Only results from this channel.'),
        order: sEnum_(['relevance', 'date', 'viewCount', 'rating', 'title', 'videoCount'], 'Sort order. Default relevance.'),
        published_after: sStr_('ISO 8601 date-time lower bound.'),
        published_before: sStr_('ISO 8601 date-time upper bound.'),
        video_duration: sEnum_(['any', 'short', 'medium', 'long'], 'short < 4 min, medium 4-20 min, long > 20 min.'),
        event_type: sEnum_(['live', 'upcoming', 'completed'], 'Only live broadcasts in this state.'),
        region_code: sStr_('ISO 3166-1 alpha-2 region, e.g. IN.'),
        relevance_language: sStr_('Prefer results in this language (ISO 639-1).'),
        safe_search: sEnum_(['moderate', 'none', 'strict'], 'Safe search level.'),
        max_results: sMax_(50, 10),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var type = args.type || 'video';
      var q = {
        part: 'snippet',
        q: args.query,
        type: type,
        maxResults: args.max_results || 10,
        pageToken: args.page_token,
        order: args.order,
        channelId: args.channel_id,
        publishedAfter: toIsoTime_(args.published_after, 'published_after'),
        publishedBefore: toIsoTime_(args.published_before, 'published_before'),
        regionCode: args.region_code,
        relevanceLanguage: args.relevance_language,
        safeSearch: args.safe_search,
      };
      if (args.for_mine) {
        q.forMine = true;
        q.type = 'video';
      }
      if (type === 'video') {
        if (args.video_duration) q.videoDuration = args.video_duration;
        if (args.event_type) q.eventType = args.event_type;
      }
      var res = gapi_('GET', YT_API + 'search', { query: q });
      var items = (res.items || []).map(function (i) {
        var sn = i.snippet || {};
        var id = i.id.videoId || i.id.channelId || i.id.playlistId;
        var kind = i.id.kind.replace('youtube#', '');
        var url =
          kind === 'video'
            ? 'https://www.youtube.com/watch?v=' + id
            : kind === 'channel'
              ? 'https://www.youtube.com/channel/' + id
              : 'https://www.youtube.com/playlist?list=' + id;
        return dropEmpty_({
          kind: kind,
          id: id,
          title: sn.title,
          channel_title: sn.channelTitle,
          channel_id: sn.channelId,
          published_at: sn.publishedAt,
          description: truncate_(sn.description, 160) || undefined,
          live: sn.liveBroadcastContent && sn.liveBroadcastContent !== 'none' ? sn.liveBroadcastContent : undefined,
          url: url,
          thumbnail: bestThumb_(sn.thumbnails),
        });
      });
      return pageOut_(res, 'results', items);
    }
  );

  tool(
    'list_video_categories',
    {
      group: 'videos',
      title: 'List video categories',
      description: 'Video category IDs and names available for a region (use the ID as category_id).',
      input: {
        region_code: sStr_('ISO 3166-1 alpha-2 region. Default ' + CONFIG.DEFAULT_REGION + '.'),
        language: sStr_('Language for the names, e.g. en or hi.'),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var res = gapi_('GET', YT_API + 'videoCategories', {
        query: { part: 'snippet', regionCode: args.region_code || CONFIG.DEFAULT_REGION, hl: args.language },
      });
      return {
        categories: (res.items || [])
          .filter(function (c) {
            return c.snippet.assignable;
          })
          .map(function (c) {
            return { id: c.id, title: c.snippet.title };
          }),
      };
    }
  );
}

/** Read-modify-write update so omitted fields are never wiped. */
function updateVideo_(args) {
  var id = extractVideoId_(args.video_id);
  var cur = fetchVideos_([id], 'snippet,status,recordingDetails,localizations')[0];
  if (!cur) throw toolError_('Video ' + id + ' not found.', API_ERROR_HINTS.videoNotFound);
  var warnings = [];
  var parts = [];
  var body = { id: id };
  var has = function (k) {
    return args[k] !== undefined && args[k] !== null;
  };

  var snippetKeys = [
    'title',
    'description',
    'append_to_description',
    'tags',
    'add_tags',
    'category_id',
    'default_language',
    'default_audio_language',
  ];
  if (snippetKeys.some(has)) {
    var s = cur.snippet;
    var snippet = dropEmpty_({
      title: s.title,
      description: s.description,
      tags: s.tags,
      categoryId: s.categoryId,
      defaultLanguage: s.defaultLanguage,
      defaultAudioLanguage: s.defaultAudioLanguage,
    });
    if (has('title')) snippet.title = cleanTitle_(args.title, warnings);
    if (has('description')) snippet.description = cleanText_(args.description, 'description', warnings);
    if (has('append_to_description')) {
      var extra = cleanText_(args.append_to_description, 'description', warnings);
      snippet.description = snippet.description ? snippet.description + '\n\n' + extra : extra;
    }
    if (snippet.description !== undefined) checkDescription_(snippet.description);
    if (has('tags')) snippet.tags = normalizeTags_(args.tags, warnings);
    if (has('add_tags')) snippet.tags = normalizeTags_((snippet.tags || []).concat(args.add_tags), warnings);
    if (has('category_id')) snippet.categoryId = String(args.category_id);
    if (has('default_language')) snippet.defaultLanguage = args.default_language;
    if (has('default_audio_language')) snippet.defaultAudioLanguage = args.default_audio_language;
    if (!snippet.title) throw toolError_('The video has no title; pass title.');
    body.snippet = snippet;
    parts.push('snippet');
  }

  var statusKeys = [
    'privacy_status',
    'publish_at',
    'made_for_kids',
    'contains_synthetic_media',
    'embeddable',
    'license',
    'public_stats_viewable',
  ];
  if (statusKeys.some(has)) {
    var st = cur.status;
    var status = dropEmpty_({
      privacyStatus: st.privacyStatus,
      publishAt: st.publishAt,
      license: st.license,
      embeddable: st.embeddable,
      publicStatsViewable: st.publicStatsViewable,
      selfDeclaredMadeForKids: st.selfDeclaredMadeForKids,
      containsSyntheticMedia: st.containsSyntheticMedia,
    });
    if (has('privacy_status')) {
      status.privacyStatus = args.privacy_status;
      if (args.privacy_status !== 'private' && !has('publish_at')) delete status.publishAt;
    }
    if (has('publish_at')) {
      if (args.publish_at === '') {
        delete status.publishAt;
      } else {
        status.publishAt = futureIso_(args.publish_at);
        if (status.privacyStatus !== 'private') warnings.push('privacy_status set to private because publish_at schedules the release.');
        status.privacyStatus = 'private';
      }
    }
    if (has('made_for_kids')) status.selfDeclaredMadeForKids = args.made_for_kids;
    if (has('contains_synthetic_media')) status.containsSyntheticMedia = args.contains_synthetic_media;
    if (has('embeddable')) status.embeddable = args.embeddable;
    if (has('license')) status.license = args.license;
    if (has('public_stats_viewable')) status.publicStatsViewable = args.public_stats_viewable;
    body.status = status;
    parts.push('status');
  }

  if (has('recording_date')) {
    body.recordingDetails = { recordingDate: toIsoTime_(args.recording_date, 'recording_date') };
    parts.push('recordingDetails');
  }

  if (has('localizations')) {
    var lang = (body.snippet && body.snippet.defaultLanguage) || cur.snippet.defaultLanguage;
    if (!lang) throw toolError_('Set default_language before adding localizations.');
    if (!body.snippet) {
      // localizations require snippet.defaultLanguage in the same request.
      body.snippet = dropEmpty_({
        title: cur.snippet.title,
        description: cur.snippet.description,
        tags: cur.snippet.tags,
        categoryId: cur.snippet.categoryId,
        defaultLanguage: lang,
        defaultAudioLanguage: cur.snippet.defaultAudioLanguage,
      });
      parts.push('snippet');
    }
    var merged = {};
    Object.keys(cur.localizations || {}).forEach(function (k) {
      merged[k] = cur.localizations[k];
    });
    var incoming = normalizeLocalizations_(args.localizations);
    Object.keys(incoming).forEach(function (k) {
      merged[k] = incoming[k];
    });
    body.localizations = merged;
    parts.push('localizations');
  }

  if (!parts.length) throw toolError_('Nothing to update: pass at least one field to change.');
  var updated = gapi_('PUT', YT_API + 'videos', { query: { part: parts.join(',') }, body: body });
  var out = compactVideo_(updated, true);
  out.updated_parts = parts;
  if (warnings.length) out.warnings = warnings;
  return out;
}

/* ===== 12_ToolsPlaylists.gs ===== */

/* Tools: playlists and playlist items. */

function registerPlaylistTools_(tool) {
  tool(
    'list_playlists',
    {
      group: 'playlists',
      title: 'List playlists',
      description: 'List your playlists (default), another channel\'s playlists, or specific playlists by ID.',
      input: {
        channel_id: sStr_('List this channel\'s public playlists instead of yours.'),
        playlist_ids: sArr_(sStr_('Playlist ID'), 'Fetch these playlists (max 50).'),
        max_results: sMax_(50, 25),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var q = { part: 'snippet,contentDetails,status', maxResults: args.max_results || 25, pageToken: args.page_token };
      if (args.playlist_ids && args.playlist_ids.length) q.id = args.playlist_ids.slice(0, 50).join(',');
      else if (args.channel_id) q.channelId = args.channel_id;
      else q.mine = true;
      var res = gapi_('GET', YT_API + 'playlists', { query: q });
      return pageOut_(res, 'playlists', (res.items || []).map(compactPlaylist_));
    }
  );

  tool(
    'create_playlist',
    {
      group: 'playlists',
      title: 'Create playlist',
      description: 'Create a playlist on the channel, optionally adding videos to it right away.',
      input: {
        title: sStr_('Playlist title (max 150 characters).'),
        description: sStr_('Playlist description (max 5,000 characters).'),
        privacy_status: sEnum_(['private', 'unlisted', 'public'], 'Visibility. Default private.'),
        default_language: sStr_('Language of title/description (BCP-47).'),
        video_ids: sArr_(sStr_('Video ID or URL'), 'Videos to add, in order.'),
      },
      required: ['title'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var created = gapi_('POST', YT_API + 'playlists', {
        query: { part: 'snippet,status' },
        body: {
          snippet: dropEmpty_({
            title: cleanTitle150_(args.title),
            description: args.description ? cleanText_(args.description, 'description') : undefined,
            defaultLanguage: args.default_language,
          }),
          status: { privacyStatus: args.privacy_status || 'private' },
        },
      });
      var out = compactPlaylist_(created);
      var ids = toIdList_(args.video_ids);
      if (ids.length) out.added = addVideosToPlaylist_(created.id, ids, undefined);
      return out;
    }
  );

  tool(
    'update_playlist',
    {
      group: 'playlists',
      title: 'Update playlist',
      description: 'Change a playlist\'s title, description, visibility or language. Fields you omit stay unchanged.',
      input: {
        playlist_id: sStr_('Playlist ID.'),
        title: sStr_('New title.'),
        description: sStr_('New description.'),
        privacy_status: sEnum_(['private', 'unlisted', 'public'], 'Visibility.'),
        default_language: sStr_('Language (BCP-47).'),
      },
      required: ['playlist_id'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var cur = gapi_('GET', YT_API + 'playlists', { query: { part: 'snippet,status', id: args.playlist_id } }).items;
      if (!cur || !cur[0]) throw toolError_('Playlist ' + args.playlist_id + ' not found.');
      cur = cur[0];
      var body = {
        id: args.playlist_id,
        snippet: dropEmpty_({
          title: args.title !== undefined ? cleanTitle150_(args.title) : cur.snippet.title,
          description: args.description !== undefined ? cleanText_(args.description, 'description') : cur.snippet.description,
          defaultLanguage: args.default_language || cur.snippet.defaultLanguage,
        }),
        status: { privacyStatus: args.privacy_status || cur.status.privacyStatus },
      };
      var updated = gapi_('PUT', YT_API + 'playlists', { query: { part: 'snippet,status' }, body: body });
      return compactPlaylist_(updated);
    }
  );

  tool(
    'delete_playlist',
    {
      group: 'playlists',
      title: 'Delete playlist',
      description: 'Delete a playlist. The videos in it are not deleted.',
      input: { playlist_id: sStr_('Playlist ID.') },
      required: ['playlist_id'],
      annotations: ANN_DELETE,
    },
    function (args) {
      gapi_('DELETE', YT_API + 'playlists', { query: { id: args.playlist_id } });
      return { deleted: true, playlist_id: args.playlist_id };
    }
  );

  tool(
    'list_playlist_items',
    {
      group: 'playlists',
      title: 'List playlist items',
      description: 'Videos in a playlist in playlist order, with the playlist_item_id needed to move or remove them. Use playlist_id "uploads" for the channel\'s uploads.',
      input: {
        playlist_id: sStr_('Playlist ID, or "uploads".'),
        max_results: sMax_(50, 50),
        page_token: sPageToken_(),
      },
      required: ['playlist_id'],
      annotations: ANN_READ,
    },
    function (args) {
      var pid = args.playlist_id === 'uploads' ? getMyChannel_().uploads : args.playlist_id;
      var res = gapi_('GET', YT_API + 'playlistItems', {
        query: { part: 'snippet,contentDetails,status', playlistId: pid, maxResults: args.max_results || 50, pageToken: args.page_token },
      });
      var items = (res.items || []).map(function (i) {
        var sn = i.snippet || {};
        var vid = i.contentDetails ? i.contentDetails.videoId : sn.resourceId && sn.resourceId.videoId;
        return dropEmpty_({
          playlist_item_id: i.id,
          video_id: vid,
          title: sn.title,
          position: sn.position,
          video_owner: sn.videoOwnerChannelTitle,
          video_published_at: i.contentDetails ? i.contentDetails.videoPublishedAt : undefined,
          added_at: sn.publishedAt,
          privacy_status: i.status ? i.status.privacyStatus : undefined,
          note: i.contentDetails ? i.contentDetails.note : undefined,
          url: 'https://www.youtube.com/watch?v=' + vid + '&list=' + pid,
        });
      });
      var out = pageOut_(res, 'items', items);
      out.playlist_id = pid;
      return out;
    }
  );

  tool(
    'add_to_playlist',
    {
      group: 'playlists',
      title: 'Add videos to playlist',
      description: 'Add one or more videos (yours or anyone\'s) to one of your playlists, optionally at a position.',
      input: {
        playlist_id: sStr_('Playlist ID.'),
        video_ids: sArr_(sStr_('Video ID or URL'), 'Videos to add, in order.'),
        position: sInt_('Zero-based position for the first video (manual-order playlists only). Default: end.', { minimum: 0 }),
      },
      required: ['playlist_id', 'video_ids'],
      annotations: ANN_WRITE,
    },
    function (args) {
      return { playlist_id: args.playlist_id, results: addVideosToPlaylist_(args.playlist_id, toIdList_(args.video_ids), args.position) };
    }
  );

  tool(
    'move_playlist_item',
    {
      group: 'playlists',
      title: 'Move playlist item',
      description: 'Move a video to a new position in a manually ordered playlist.',
      input: {
        playlist_item_id: sStr_('playlist_item_id from list_playlist_items.'),
        position: sInt_('New zero-based position.', { minimum: 0 }),
      },
      required: ['playlist_item_id', 'position'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var items = gapi_('GET', YT_API + 'playlistItems', { query: { part: 'snippet', id: args.playlist_item_id } }).items;
      if (!items || !items[0]) throw toolError_('Playlist item ' + args.playlist_item_id + ' not found.');
      var sn = items[0].snippet;
      var updated = gapi_('PUT', YT_API + 'playlistItems', {
        query: { part: 'snippet' },
        body: {
          id: args.playlist_item_id,
          snippet: { playlistId: sn.playlistId, resourceId: sn.resourceId, position: args.position },
        },
      });
      return { playlist_item_id: updated.id, video_id: sn.resourceId.videoId, position: updated.snippet.position };
    }
  );

  tool(
    'remove_from_playlist',
    {
      group: 'playlists',
      title: 'Remove from playlist',
      description: 'Remove a video from a playlist, by playlist_item_id or by playlist_id + video_id. The video itself is not deleted.',
      input: {
        playlist_item_id: sStr_('playlist_item_id from list_playlist_items.'),
        playlist_id: sStr_('Playlist ID (with video_id).'),
        video_id: sStr_('Video ID or URL (with playlist_id). Removes every occurrence.'),
      },
      annotations: ANN_DELETE,
    },
    function (args) {
      var ids = [];
      if (args.playlist_item_id) {
        ids.push(args.playlist_item_id);
      } else if (args.playlist_id && args.video_id) {
        var vid = extractVideoId_(args.video_id);
        var token;
        var pages = 0;
        do {
          var res = gapi_('GET', YT_API + 'playlistItems', {
            query: { part: 'contentDetails', playlistId: args.playlist_id, maxResults: 50, pageToken: token },
          });
          (res.items || []).forEach(function (i) {
            if (i.contentDetails.videoId === vid) ids.push(i.id);
          });
          token = res.nextPageToken;
          pages++;
        } while (token && pages < 20);
        if (!ids.length) throw toolError_('Video ' + vid + ' is not in playlist ' + args.playlist_id + '.');
      } else {
        throw toolError_('Pass playlist_item_id, or playlist_id together with video_id.');
      }
      ids.forEach(function (id) {
        gapi_('DELETE', YT_API + 'playlistItems', { query: { id: id } });
      });
      return { removed: ids.length, playlist_item_ids: ids };
    }
  );
}

function compactPlaylist_(p) {
  var sn = p.snippet || {};
  return dropEmpty_({
    id: p.id,
    title: sn.title,
    description: truncate_(sn.description, 200) || undefined,
    privacy_status: p.status ? p.status.privacyStatus : undefined,
    item_count: p.contentDetails ? p.contentDetails.itemCount : undefined,
    channel_title: sn.channelTitle,
    published_at: sn.publishedAt,
    url: 'https://www.youtube.com/playlist?list=' + p.id,
    thumbnail: bestThumb_(sn.thumbnails),
  });
}

function cleanTitle150_(title) {
  var t = String(title || '')
    .replace(/[<>]/g, '')
    .trim();
  if (!t) throw toolError_('title is required.');
  if (t.length > 150) throw toolError_('Playlist titles are limited to 150 characters.');
  return t;
}

function insertPlaylistItem_(playlistId, videoId, position) {
  var snippet = { playlistId: playlistId, resourceId: { kind: 'youtube#video', videoId: videoId } };
  if (position !== undefined && position !== null) snippet.position = position;
  return gapi_('POST', YT_API + 'playlistItems', { query: { part: 'snippet' }, body: { snippet: snippet } });
}

function addVideosToPlaylist_(playlistId, videoIds, position) {
  return videoIds.map(function (vid, i) {
    try {
      var item = insertPlaylistItem_(playlistId, vid, position === undefined || position === null ? undefined : position + i);
      return { video_id: vid, added: true, playlist_item_id: item.id };
    } catch (e) {
      return { video_id: vid, added: false, error: e.message };
    }
  });
}

/* ===== 13_ToolsComments.gs ===== */

/* Tools: comments and moderation. */

function registerCommentTools_(tool) {
  tool(
    'list_comments',
    {
      group: 'comments',
      title: 'List comments',
      description:
        'Comment threads on one video, or across all of your channel\'s videos (default). Filter by text or moderation state, e.g. heldForReview to see comments waiting for approval. Includes up to a few replies per thread; use list_comment_replies for all replies.',
      input: {
        video_id: sStr_('Video ID or URL. Omit to cover every video on your channel.'),
        search_terms: sStr_('Only comments containing this text.'),
        moderation_status: sEnum_(['published', 'heldForReview', 'likelySpam'], 'Default published. Use heldForReview or likelySpam for the review queue.'),
        order: sEnum_(['time', 'relevance'], 'Default time (newest first).'),
        include_replies: sBool_('Include replies returned with each thread. Default true.'),
        max_results: sMax_(100, 20),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var q = {
        part: args.include_replies === false ? 'snippet' : 'snippet,replies',
        maxResults: args.max_results || 20,
        pageToken: args.page_token,
        searchTerms: args.search_terms,
        moderationStatus: args.moderation_status,
        order: args.order,
        textFormat: 'plainText',
      };
      if (args.video_id) q.videoId = extractVideoId_(args.video_id);
      else q.allThreadsRelatedToChannelId = getMyChannel_().id;
      var res = gapi_('GET', YT_API + 'commentThreads', { query: q });
      return pageOut_(res, 'threads', (res.items || []).map(compactThread_));
    }
  );

  tool(
    'list_comment_replies',
    {
      group: 'comments',
      title: 'List comment replies',
      description: 'All replies to a top-level comment.',
      input: {
        parent_id: sStr_('ID of the top-level comment (thread_id from list_comments).'),
        max_results: sMax_(100, 50),
        page_token: sPageToken_(),
      },
      required: ['parent_id'],
      annotations: ANN_READ,
    },
    function (args) {
      var res = gapi_('GET', YT_API + 'comments', {
        query: { part: 'snippet', parentId: args.parent_id, maxResults: args.max_results || 50, pageToken: args.page_token, textFormat: 'plainText' },
      });
      return pageOut_(res, 'replies', (res.items || []).map(compactComment_));
    }
  );

  tool(
    'post_comment',
    {
      group: 'comments',
      title: 'Post comment',
      description: 'Post a new top-level comment on a video as the authorized channel.',
      input: { video_id: sStr_('Video ID or URL.'), text: sStr_('Comment text.') },
      required: ['video_id', 'text'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var res = gapi_('POST', YT_API + 'commentThreads', {
        query: { part: 'snippet' },
        body: { snippet: { videoId: extractVideoId_(args.video_id), topLevelComment: { snippet: { textOriginal: args.text } } } },
      });
      return compactThread_(res);
    }
  );

  tool(
    'reply_to_comment',
    {
      group: 'comments',
      title: 'Reply to comment',
      description: 'Reply to a top-level comment as the authorized channel.',
      input: { parent_id: sStr_('Top-level comment ID (thread_id).'), text: sStr_('Reply text.') },
      required: ['parent_id', 'text'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var res = gapi_('POST', YT_API + 'comments', {
        query: { part: 'snippet' },
        body: { snippet: { parentId: args.parent_id, textOriginal: args.text } },
      });
      return compactComment_(res);
    }
  );

  tool(
    'update_comment',
    {
      group: 'comments',
      title: 'Edit comment',
      description: 'Edit the text of a comment written by the authorized channel.',
      input: { comment_id: sStr_('Comment ID.'), text: sStr_('New text.') },
      required: ['comment_id', 'text'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var res = gapi_('PUT', YT_API + 'comments', {
        query: { part: 'snippet' },
        body: { id: args.comment_id, snippet: { textOriginal: args.text } },
      });
      return compactComment_(res);
    }
  );

  tool(
    'delete_comment',
    {
      group: 'comments',
      title: 'Delete comment',
      description: 'Delete a comment written by the authorized channel. To hide other people\'s comments on your videos use moderate_comments with status rejected.',
      input: { comment_id: sStr_('Comment ID.') },
      required: ['comment_id'],
      annotations: ANN_DELETE,
    },
    function (args) {
      gapi_('DELETE', YT_API + 'comments', { query: { id: args.comment_id } });
      return { deleted: true, comment_id: args.comment_id };
    }
  );

  tool(
    'moderate_comments',
    {
      group: 'comments',
      title: 'Moderate comments',
      description:
        'Approve (published), hold for review (heldForReview) or remove (rejected) comments on your videos. With rejected you can also ban the author from commenting on your channel.',
      input: {
        comment_ids: sArr_(sStr_('Comment ID'), 'Comments to moderate (max 50).'),
        status: sEnum_(['published', 'heldForReview', 'rejected'], 'New moderation state.'),
        ban_author: sBool_('Also ban the author(s). Only with status rejected. Default false.'),
      },
      required: ['comment_ids', 'status'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      if (args.ban_author && args.status !== 'rejected') throw toolError_('ban_author only works with status rejected.');
      var ids = args.comment_ids.slice(0, 50);
      gapi_('POST', YT_API + 'comments/setModerationStatus', {
        query: { id: ids.join(','), moderationStatus: args.status, banAuthor: args.ban_author ? 'true' : undefined },
      });
      return { moderated: ids.length, status: args.status, banned_authors: !!args.ban_author };
    }
  );
}

function compactComment_(c) {
  var sn = c.snippet || {};
  return dropEmpty_({
    comment_id: c.id,
    author: sn.authorDisplayName,
    author_channel_id: sn.authorChannelId ? sn.authorChannelId.value : undefined,
    text: sn.textOriginal || sn.textDisplay,
    likes: sn.likeCount,
    published_at: sn.publishedAt,
    edited_at: sn.updatedAt && sn.updatedAt !== sn.publishedAt ? sn.updatedAt : undefined,
    parent_id: sn.parentId,
    moderation_status: sn.moderationStatus,
  });
}

function compactThread_(t) {
  var sn = t.snippet || {};
  var top = sn.topLevelComment ? compactComment_(sn.topLevelComment) : {};
  return dropEmpty_({
    thread_id: t.id,
    video_id: sn.videoId,
    author: top.author,
    author_channel_id: top.author_channel_id,
    text: top.text,
    likes: top.likes,
    published_at: top.published_at,
    edited_at: top.edited_at,
    moderation_status: top.moderation_status,
    reply_count: sn.totalReplyCount,
    can_reply: sn.canReply,
    replies:
      t.replies && t.replies.comments && t.replies.comments.length ? t.replies.comments.map(compactComment_) : undefined,
  });
}

/* ===== 14_ToolsCaptions.gs ===== */

/* Tools: caption / subtitle tracks. */

function registerCaptionTools_(tool) {
  var contentInputs = {
    caption_text: sStr_('Caption file contents (SRT, WebVTT, SBV, ...). Format is detected by YouTube.'),
    caption_url: sStr_('Public URL of a caption file.'),
    drive_file_id: sStr_('Google Drive file ID or share link of a caption file.'),
  };

  tool(
    'list_captions',
    {
      group: 'captions',
      title: 'List caption tracks',
      description: 'Caption tracks on a video, including auto-generated (ASR) tracks, with their IDs.',
      input: { video_id: sStr_('Video ID or URL.') },
      required: ['video_id'],
      annotations: ANN_READ,
    },
    function (args) {
      var res = gapi_('GET', YT_API + 'captions', { query: { part: 'snippet', videoId: extractVideoId_(args.video_id) } });
      return {
        captions: (res.items || []).map(function (c) {
          var sn = c.snippet || {};
          return dropEmpty_({
            caption_id: c.id,
            language: sn.language,
            name: sn.name || undefined,
            track_kind: sn.trackKind,
            is_draft: sn.isDraft,
            is_auto_synced: sn.isAutoSynced,
            is_cc: sn.isCC,
            audio_track_type: sn.audioTrackType,
            status: sn.status,
            failure_reason: sn.failureReason,
            last_updated: sn.lastUpdated,
          });
        }),
      };
    }
  );

  tool(
    'upload_caption',
    {
      group: 'captions',
      title: 'Upload captions',
      description: 'Add a caption/subtitle track to one of your videos from text, a URL or a Drive file.',
      input: ext_(
        {
          video_id: sStr_('Video ID or URL.'),
          language: sStr_('BCP-47 language of the track, e.g. en, hi, en-IN.'),
          name: sStr_('Track name shown to viewers (optional).'),
          is_draft: sBool_('Upload as an unpublished draft. Default false.'),
        },
        contentInputs
      ),
      required: ['video_id', 'language'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var blob = captionBlob_(args, true);
      var meta = {
        snippet: { videoId: extractVideoId_(args.video_id), language: args.language, name: args.name || '', isDraft: !!args.is_draft },
      };
      var mp = multipartRelated_(meta, blob);
      var res = gapi_('POST', YT_UPLOAD_API + 'captions', {
        query: { part: 'snippet', uploadType: 'multipart' },
        payload: mp.payload,
        contentType: mp.contentType,
      });
      return { caption_id: res.id, language: res.snippet && res.snippet.language, status: res.snippet && res.snippet.status };
    }
  );

  tool(
    'update_caption',
    {
      group: 'captions',
      title: 'Update captions',
      description: 'Replace a caption track\'s file and/or change its draft status.',
      input: ext_(
        {
          caption_id: sStr_('Caption track ID from list_captions.'),
          is_draft: sBool_('Set draft (unpublished) status.'),
        },
        contentInputs
      ),
      required: ['caption_id'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var meta = { id: args.caption_id, snippet: {} };
      if (typeof args.is_draft === 'boolean') meta.snippet.isDraft = args.is_draft;
      var blob = captionBlob_(args, false);
      var res;
      if (blob) {
        var mp = multipartRelated_(meta, blob);
        res = gapi_('PUT', YT_UPLOAD_API + 'captions', {
          query: { part: 'snippet', uploadType: 'multipart' },
          payload: mp.payload,
          contentType: mp.contentType,
        });
      } else {
        if (typeof args.is_draft !== 'boolean') throw toolError_('Pass new caption content and/or is_draft.');
        res = gapi_('PUT', YT_API + 'captions', { query: { part: 'snippet' }, body: meta });
      }
      return { caption_id: res.id, is_draft: res.snippet && res.snippet.isDraft, status: res.snippet && res.snippet.status };
    }
  );

  tool(
    'download_caption',
    {
      group: 'captions',
      title: 'Download captions',
      description: 'Download a caption track of one of your videos as text, optionally machine-translated.',
      input: {
        caption_id: sStr_('Caption track ID from list_captions.'),
        format: sEnum_(['srt', 'vtt', 'sbv', 'scc', 'ttml'], 'Output format. Default srt.'),
        translate_to: sStr_('Translate to this language code (e.g. hi).'),
      },
      required: ['caption_id'],
      annotations: ANN_READ,
    },
    function (args) {
      var text = gapi_('GET', YT_API + 'captions/' + encodeURIComponent(args.caption_id), {
        query: { tfmt: args.format || 'srt', tlang: args.translate_to },
        text: true,
      });
      return { caption_id: args.caption_id, format: args.format || 'srt', content: text };
    }
  );

  tool(
    'delete_caption',
    {
      group: 'captions',
      title: 'Delete caption track',
      description: 'Delete a caption track from a video.',
      input: { caption_id: sStr_('Caption track ID.') },
      required: ['caption_id'],
      annotations: ANN_DELETE,
    },
    function (args) {
      gapi_('DELETE', YT_API + 'captions', { query: { id: args.caption_id } });
      return { deleted: true, caption_id: args.caption_id };
    }
  );
}

function captionBlob_(args, required) {
  if (args.caption_text) return Utilities.newBlob(String(args.caption_text), 'application/octet-stream', 'captions.txt');
  var spec = mediaSpecFromArgs_(args, { url: 'caption_url', drive: 'drive_file_id' }, false);
  if (!spec) {
    if (required) throw toolError_('Provide caption_text, caption_url or drive_file_id.');
    return null;
  }
  var blob = loadSmallBlob_(spec, 'text', CONFIG.MAX_CAPTION_BYTES, 'The caption file');
  blob.setContentType('application/octet-stream');
  return blob;
}

/* ===== 15_ToolsChannel.gs ===== */

/* Tools: channel profile, branding, sections and subscriptions. */

var CHANNEL_BRANDING_KEYS = ['description', 'keywords', 'defaultLanguage', 'country', 'unsubscribedTrailer', 'trackingAnalyticsAccountId'];

function registerChannelTools_(tool) {
  tool(
    'get_my_channel',
    {
      group: 'channel',
      title: 'Get my channel',
      description: 'Profile and stats of the authorized channel: subscribers, views, video count, handle, description, keywords, uploads playlist, status flags and banner.',
      input: {},
      annotations: ANN_READ,
    },
    function () {
      var res = gapi_('GET', YT_API + 'channels', {
        query: { part: 'snippet,statistics,contentDetails,brandingSettings,status,topicDetails', mine: true },
      });
      if (!res.items || !res.items[0]) throw toolError_('No channel for this account.', API_ERROR_HINTS.youtubeSignupRequired);
      getMyChannel_(true);
      return compactChannel_(res.items[0], true);
    }
  );

  tool(
    'get_channel',
    {
      group: 'channel',
      title: 'Get channel',
      description: 'Public profile and stats of any channel by ID, @handle, legacy username or channel URL.',
      input: {
        channel_id: sStr_('Channel ID (UC...) or channel URL.'),
        handle: sStr_('Channel handle, e.g. @campusloop.'),
        username: sStr_('Legacy username.'),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var q = { part: 'snippet,statistics,contentDetails,brandingSettings,topicDetails' };
      var raw = String(args.channel_id || args.handle || args.username || '').trim();
      if (!raw) throw toolError_('Pass channel_id, handle or username.');
      var idMatch = raw.match(/(UC[\w-]{22})/);
      var handleMatch = raw.match(/@([\w.\-]+)/);
      if (args.username && !args.channel_id && !args.handle) q.forUsername = args.username;
      else if (idMatch) q.id = idMatch[1];
      else if (handleMatch) q.forHandle = '@' + handleMatch[1];
      else q.forHandle = raw.indexOf('@') === 0 ? raw : '@' + raw;
      var res = gapi_('GET', YT_API + 'channels', { query: q });
      if (!res.items || !res.items[0]) throw toolError_('Channel not found: ' + raw);
      return compactChannel_(res.items[0], false);
    }
  );

  tool(
    'update_channel',
    {
      group: 'channel',
      title: 'Update channel settings',
      description:
        'Update the channel description, keywords, country, default language or the trailer shown to non-subscribers. Fields you omit stay unchanged. (The channel name and handle can only be changed in YouTube Studio.)',
      input: {
        description: sStr_('Channel description (max 1,000 characters).'),
        keywords: sArr_(sStr_('Keyword'), 'Channel keywords (replaces the existing list).'),
        country: sStr_('ISO 3166-1 alpha-2 country, e.g. IN.'),
        default_language: sStr_('Language of the channel title/description (BCP-47).'),
        unsubscribed_trailer: sStr_('Video ID or URL of the trailer for non-subscribers. Empty string removes it.'),
        localizations: sObj_('Translated channel metadata: {"hi": {"title": "...", "description": "..."}}.'),
      },
      annotations: ANN_UPDATE,
    },
    function (args) {
      var changed = [];
      var res = updateChannel_(function (channel, body, cur) {
        if (args.description !== undefined) {
          channel.description = cleanText_(args.description, 'description');
          changed.push('description');
        }
        if (args.keywords) {
          channel.keywords = args.keywords
            .map(function (k) {
              k = String(k).replace(/"/g, '').trim();
              return /\s/.test(k) ? '"' + k + '"' : k;
            })
            .filter(Boolean)
            .join(' ');
          changed.push('keywords');
        }
        if (args.country) {
          channel.country = args.country.toUpperCase();
          changed.push('country');
        }
        if (args.default_language) {
          channel.defaultLanguage = args.default_language;
          changed.push('default_language');
        }
        if (args.unsubscribed_trailer !== undefined) {
          if (args.unsubscribed_trailer === '') delete channel.unsubscribedTrailer;
          else channel.unsubscribedTrailer = extractVideoId_(args.unsubscribed_trailer);
          changed.push('unsubscribed_trailer');
        }
        if (args.localizations) {
          if (!channel.defaultLanguage) throw toolError_('Set default_language before adding localizations.');
          var merged = {};
          Object.keys(cur.localizations || {}).forEach(function (k) {
            merged[k] = cur.localizations[k];
          });
          Object.keys(args.localizations).forEach(function (k) {
            merged[k] = dropEmpty_({ title: args.localizations[k].title, description: args.localizations[k].description });
          });
          body.localizations = merged;
          changed.push('localizations');
        }
      });
      if (!changed.length) throw toolError_('Nothing to update.');
      var out = compactChannel_(res, true);
      out.updated = changed;
      return out;
    }
  );

  tool(
    'set_channel_banner',
    {
      group: 'channel',
      title: 'Set channel banner',
      description: 'Upload a new channel banner image (JPEG/PNG, 16:9, at least 2048x1152, max 6 MB) and apply it.',
      input: {
        image_url: sStr_('Public image URL.'),
        drive_file_id: sStr_('Google Drive file ID or share link.'),
        base64_data: sStr_('Image as base64 or a data: URL.'),
        mime_type: sStr_('image/jpeg or image/png (auto-detected).'),
      },
      annotations: ANN_UPDATE,
    },
    function (args) {
      var spec = mediaSpecFromArgs_(args, { url: 'image_url', drive: 'drive_file_id', base64: 'base64_data', mime: 'mime_type' }, true);
      var blob = loadSmallBlob_(spec, 'image', CONFIG.MAX_BANNER_BYTES, 'The banner');
      var uploaded = gapi_('POST', YT_UPLOAD_API + 'channelBanners/insert', {
        query: { uploadType: 'media' },
        payload: blob,
        contentType: /^image\/(jpeg|png)$/.test(blob.getContentType()) ? blob.getContentType() : 'application/octet-stream',
      });
      updateChannel_(function (channel, body) {
        body.brandingSettings.image = { bannerExternalUrl: uploaded.url };
      });
      return { banner_url: uploaded.url, applied: true };
    }
  );

  tool(
    'set_channel_watermark',
    {
      group: 'channel',
      title: 'Set video watermark',
      description: 'Set the branding watermark (subscribe button image) shown on all your videos. Square PNG/JPEG, ideally 150x150, max 1 MB.',
      input: {
        image_url: sStr_('Public image URL.'),
        drive_file_id: sStr_('Google Drive file ID or share link.'),
        base64_data: sStr_('Image as base64 or a data: URL.'),
        display: sEnum_(['entire_video', 'end_of_video', 'custom'], 'When to show it. Default entire_video.'),
        offset_ms: sInt_('custom: start this many ms after the video starts.', { minimum: 0 }),
        duration_ms: sInt_('custom: show for this many ms.', { minimum: 1 }),
      },
      annotations: ANN_UPDATE,
    },
    function (args) {
      var spec = mediaSpecFromArgs_(args, { url: 'image_url', drive: 'drive_file_id', base64: 'base64_data' }, true);
      var blob = loadSmallBlob_(spec, 'image', 1024 * 1024, 'The watermark');
      var display = args.display || 'entire_video';
      var timing =
        display === 'end_of_video'
          ? { type: 'offsetFromEnd', offsetMs: 15000, durationMs: 15000 }
          : display === 'custom'
            ? dropEmpty_({ type: 'offsetFromStart', offsetMs: args.offset_ms || 0, durationMs: args.duration_ms })
            : { type: 'offsetFromStart', offsetMs: 0 };
      var ch = getMyChannel_();
      var mp = multipartRelated_({ timing: timing, position: { type: 'corner', cornerPosition: 'bottomRight' } }, blob);
      gapi_('POST', YT_UPLOAD_API + 'watermarks/set', {
        query: { channelId: ch.id, uploadType: 'multipart' },
        payload: mp.payload,
        contentType: mp.contentType,
      });
      return { watermark_set: true, display: display };
    }
  );

  tool(
    'remove_channel_watermark',
    {
      group: 'channel',
      title: 'Remove video watermark',
      description: 'Remove the branding watermark from your videos.',
      input: {},
      annotations: ANN_DELETE,
    },
    function () {
      gapi_('POST', YT_API + 'watermarks/unset', { query: { channelId: getMyChannel_().id } });
      return { watermark_removed: true };
    }
  );

  tool(
    'list_channel_sections',
    {
      group: 'channel',
      title: 'List channel sections',
      description: 'The shelves on your channel home page (or another channel\'s), with their type, position and contents.',
      input: { channel_id: sStr_('Another channel\'s ID. Default: yours.') },
      annotations: ANN_READ,
    },
    function (args) {
      var q = { part: 'snippet,contentDetails' };
      if (args.channel_id) q.channelId = args.channel_id;
      else q.mine = true;
      var res = gapi_('GET', YT_API + 'channelSections', { query: q });
      return {
        sections: (res.items || []).map(function (s) {
          return dropEmpty_({
            section_id: s.id,
            type: s.snippet.type,
            title: s.snippet.title,
            position: s.snippet.position,
            playlists: s.contentDetails ? s.contentDetails.playlists : undefined,
            channels: s.contentDetails ? s.contentDetails.channels : undefined,
          });
        }),
      };
    }
  );

  tool(
    'create_channel_section',
    {
      group: 'channel',
      title: 'Create channel section',
      description: 'Add a shelf to your channel home page, e.g. a single playlist, recent uploads or popular uploads.',
      input: {
        type: sEnum_(
          ['singlePlaylist', 'multiplePlaylists', 'recentUploads', 'popularUploads', 'allPlaylists', 'multipleChannels', 'subscriptions', 'liveEvents', 'upcomingEvents', 'completedEvents'],
          'Section type.'
        ),
        title: sStr_('Title (required for multiplePlaylists and multipleChannels).'),
        position: sInt_('Zero-based position on the page.', { minimum: 0 }),
        playlist_ids: sArr_(sStr_('Playlist ID'), 'Playlists for singlePlaylist / multiplePlaylists.'),
        channel_ids: sArr_(sStr_('Channel ID'), 'Channels for multipleChannels.'),
      },
      required: ['type'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var body = { snippet: dropEmpty_({ type: args.type, title: args.title, position: args.position }) };
      var details = {};
      if (args.playlist_ids && args.playlist_ids.length) details.playlists = args.playlist_ids;
      if (args.channel_ids && args.channel_ids.length) details.channels = args.channel_ids;
      var parts = 'snippet';
      if (Object.keys(details).length) {
        body.contentDetails = details;
        parts += ',contentDetails';
      }
      var res = gapi_('POST', YT_API + 'channelSections', { query: { part: parts }, body: body });
      return { section_id: res.id, type: res.snippet.type, position: res.snippet.position };
    }
  );

  tool(
    'delete_channel_section',
    {
      group: 'channel',
      title: 'Delete channel section',
      description: 'Remove a shelf from your channel home page.',
      input: { section_id: sStr_('section_id from list_channel_sections.') },
      required: ['section_id'],
      annotations: ANN_DELETE,
    },
    function (args) {
      gapi_('DELETE', YT_API + 'channelSections', { query: { id: args.section_id } });
      return { deleted: true, section_id: args.section_id };
    }
  );

  tool(
    'list_subscriptions',
    {
      group: 'channel',
      title: 'List my subscriptions',
      description: 'Channels the authorized channel is subscribed to, or check whether it is subscribed to specific channels.',
      input: {
        for_channel_ids: sArr_(sStr_('Channel ID'), 'Only check these channels.'),
        order: sEnum_(['relevance', 'unread', 'alphabetical'], 'Sort order. Default relevance.'),
        max_results: sMax_(50, 25),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var res = gapi_('GET', YT_API + 'subscriptions', {
        query: {
          part: 'snippet,contentDetails',
          mine: true,
          forChannelId: args.for_channel_ids && args.for_channel_ids.length ? args.for_channel_ids.join(',') : undefined,
          order: args.order,
          maxResults: args.max_results || 25,
          pageToken: args.page_token,
        },
      });
      var items = (res.items || []).map(function (s) {
        return dropEmpty_({
          subscription_id: s.id,
          channel_id: s.snippet.resourceId.channelId,
          title: s.snippet.title,
          subscribed_at: s.snippet.publishedAt,
          total_videos: s.contentDetails ? s.contentDetails.totalItemCount : undefined,
          new_videos: s.contentDetails ? s.contentDetails.newItemCount : undefined,
          url: 'https://www.youtube.com/channel/' + s.snippet.resourceId.channelId,
        });
      });
      return pageOut_(res, 'subscriptions', items);
    }
  );

  tool(
    'list_subscribers',
    {
      group: 'channel',
      title: 'List my subscribers',
      description: 'People subscribed to your channel. YouTube only returns subscribers whose subscriptions are public.',
      input: {
        recent_first: sBool_('Newest subscribers first. Default true.'),
        max_results: sMax_(50, 25),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var q = { part: 'snippet,subscriberSnippet', maxResults: args.max_results || 25, pageToken: args.page_token };
      if (args.recent_first === false) q.mySubscribers = true;
      else q.myRecentSubscribers = true;
      var res = gapi_('GET', YT_API + 'subscriptions', { query: q });
      var items = (res.items || []).map(function (s) {
        var sub = s.subscriberSnippet || {};
        return dropEmpty_({
          channel_id: sub.channelId,
          title: sub.title,
          subscribed_at: s.snippet ? s.snippet.publishedAt : undefined,
          url: sub.channelId ? 'https://www.youtube.com/channel/' + sub.channelId : undefined,
          thumbnail: bestThumb_(sub.thumbnails),
        });
      });
      return pageOut_(res, 'subscribers', items);
    }
  );

  tool(
    'subscribe',
    {
      group: 'channel',
      title: 'Subscribe to channel',
      description: 'Subscribe the authorized channel to another channel.',
      input: { channel_id: sStr_('Channel ID to subscribe to.') },
      required: ['channel_id'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var res = gapi_('POST', YT_API + 'subscriptions', {
        query: { part: 'snippet' },
        body: { snippet: { resourceId: { kind: 'youtube#channel', channelId: args.channel_id } } },
      });
      return { subscription_id: res.id, channel_id: args.channel_id, title: res.snippet && res.snippet.title };
    }
  );

  tool(
    'unsubscribe',
    {
      group: 'channel',
      title: 'Unsubscribe from channel',
      description: 'Remove a subscription, by subscription_id or by the channel ID you are subscribed to.',
      input: {
        subscription_id: sStr_('subscription_id from list_subscriptions.'),
        channel_id: sStr_('Channel ID to unsubscribe from.'),
      },
      annotations: ANN_DELETE,
    },
    function (args) {
      var id = args.subscription_id;
      if (!id) {
        if (!args.channel_id) throw toolError_('Pass subscription_id or channel_id.');
        var res = gapi_('GET', YT_API + 'subscriptions', { query: { part: 'id', mine: true, forChannelId: args.channel_id } });
        if (!res.items || !res.items[0]) throw toolError_('You are not subscribed to ' + args.channel_id + '.');
        id = res.items[0].id;
      }
      gapi_('DELETE', YT_API + 'subscriptions', { query: { id: id } });
      return { unsubscribed: true, subscription_id: id };
    }
  );
}

/**
 * Read-modify-write of brandingSettings so unrelated settings survive.
 * mutate(channelSettings, requestBody, currentResource)
 */
function updateChannel_(mutate) {
  var res = gapi_('GET', YT_API + 'channels', { query: { part: 'brandingSettings,localizations', mine: true } });
  var cur = res.items && res.items[0];
  if (!cur) throw toolError_('No channel for this account.', API_ERROR_HINTS.youtubeSignupRequired);
  var currentChannel = (cur.brandingSettings && cur.brandingSettings.channel) || {};
  var channel = {};
  CHANNEL_BRANDING_KEYS.forEach(function (k) {
    if (currentChannel[k] !== undefined) channel[k] = currentChannel[k];
  });
  var body = { id: cur.id, brandingSettings: { channel: channel } };
  var image = cur.brandingSettings && cur.brandingSettings.image;
  if (image && image.bannerExternalUrl) body.brandingSettings.image = { bannerExternalUrl: image.bannerExternalUrl };
  mutate(channel, body, cur);
  var parts = ['brandingSettings'];
  if (body.localizations) parts.push('localizations');
  return gapi_('PUT', YT_API + 'channels', { query: { part: parts.join(',') }, body: body });
}

function compactChannel_(c, mine) {
  var sn = c.snippet || {};
  var st = c.statistics || {};
  var br = (c.brandingSettings && c.brandingSettings.channel) || {};
  var img = (c.brandingSettings && c.brandingSettings.image) || {};
  var handle = sn.customUrl || null;
  var out = {
    id: c.id,
    title: sn.title || br.title,
    handle: handle || undefined,
    url: handle ? 'https://www.youtube.com/' + handle : 'https://www.youtube.com/channel/' + c.id,
    description: sn.description !== undefined ? sn.description : br.description,
    country: sn.country || br.country,
    default_language: sn.defaultLanguage || br.defaultLanguage,
    keywords: br.keywords,
    published_at: sn.publishedAt,
    subscribers: st.hiddenSubscriberCount ? undefined : num_(st.subscriberCount),
    subscribers_hidden: st.hiddenSubscriberCount || undefined,
    views: num_(st.viewCount),
    videos: num_(st.videoCount),
    uploads_playlist_id: c.contentDetails && c.contentDetails.relatedPlaylists ? c.contentDetails.relatedPlaylists.uploads : undefined,
    unsubscribed_trailer: br.unsubscribedTrailer,
    avatar: bestThumb_(sn.thumbnails),
    banner_url: img.bannerExternalUrl,
    topics: c.topicDetails ? c.topicDetails.topicCategories : undefined,
  };
  if (mine) {
    var status = c.status || {};
    out.studio_url = 'https://studio.youtube.com/channel/' + c.id;
    out.privacy_status = status.privacyStatus;
    out.long_uploads_status = status.longUploadsStatus;
    out.made_for_kids = status.madeForKids;
    out.is_linked = status.isLinked;
  }
  return dropEmpty_(out);
}

/* ===== 16_ToolsAnalytics.gs ===== */

/* Tools: YouTube Analytics API v2. Data usually lags 2-3 days. */

var DEFAULT_METRICS =
  'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,subscribersLost';
var CONTENT_TYPE_FILTERS = { shorts: 'SHORTS', videos: 'VIDEO_ON_DEMAND', live: 'LIVE_STREAM' };

function registerAnalyticsTools_(tool) {
  var dateInputs = {
    start_date: sStr_('YYYY-MM-DD, "today", "yesterday" or "NdaysAgo". Default 28daysAgo.'),
    end_date: sStr_('YYYY-MM-DD, "today", "yesterday" or "NdaysAgo". Default today.'),
  };

  tool(
    'get_analytics_report',
    {
      group: 'analytics',
      title: 'Channel analytics report',
      description:
        'Run any YouTube Analytics query for your channel. Metrics e.g. views, estimatedMinutesWatched, averageViewDuration, averageViewPercentage, likes, dislikes, comments, shares, subscribersGained, subscribersLost, videosAddedToPlaylists, cardClickRate, estimatedRevenue, estimatedAdRevenue, cpm, playbackBasedCpm (revenue needs a monetized channel). Dimensions e.g. day, month, video, country, province, city, deviceType, operatingSystem, ageGroup, gender, insightTrafficSourceType, insightTrafficSourceDetail, playbackLocationType, sharingService, subscribedStatus, creatorContentType. Filters e.g. video==ID, country==IN, creatorContentType==SHORTS.',
      input: ext_(
        {
          metrics: sStr_('Comma-separated metrics. Default: ' + DEFAULT_METRICS + '.'),
          dimensions: sStr_('Comma-separated dimensions, e.g. day or country or ageGroup,gender.'),
          filters: sStr_('Filters such as video==VIDEO_ID or country==IN;deviceType==MOBILE.'),
          sort: sStr_('Sort, e.g. -views (descending). Required by YouTube for some dimension combinations.'),
          max_results: sInt_('Max rows (1-200).', { minimum: 1, maximum: 200 }),
          currency: sStr_('Currency for revenue metrics, e.g. INR. Default USD.'),
          include_historical_channel_data: sBool_('Include data from before the channel was linked to a content owner.'),
        },
        dateInputs
      ),
      annotations: ANN_READ,
    },
    function (args) {
      return analyticsQuery_({
        startDate: resolveDate_(args.start_date, '28daysAgo'),
        endDate: resolveDate_(args.end_date, 'today'),
        metrics: args.metrics || DEFAULT_METRICS,
        dimensions: args.dimensions,
        filters: args.filters,
        sort: args.sort,
        maxResults: args.max_results,
        currency: args.currency,
        includeHistoricalChannelData: args.include_historical_channel_data ? 'true' : undefined,
      });
    }
  );

  tool(
    'get_video_analytics',
    {
      group: 'analytics',
      title: 'Video analytics',
      description: 'Views, watch time, retention, likes, shares and subscribers gained for one or more videos or Shorts, in total or per day.',
      input: ext_(
        {
          video_ids: sArr_(sStr_('Video ID or URL'), 'Videos to analyse (max 200).'),
          by_day: sBool_('Return one row per day (totals across the given videos). Default false.'),
          metrics: sStr_('Comma-separated metrics. Default: ' + DEFAULT_METRICS + '.'),
        },
        dateInputs
      ),
      required: ['video_ids'],
      annotations: ANN_READ,
    },
    function (args) {
      var ids = toIdList_(args.video_ids).slice(0, 200);
      var q = {
        startDate: resolveDate_(args.start_date, '28daysAgo'),
        endDate: resolveDate_(args.end_date, 'today'),
        metrics: args.metrics || DEFAULT_METRICS,
        filters: 'video==' + ids.join(','),
      };
      if (args.by_day) {
        q.dimensions = 'day';
        q.sort = 'day';
      } else if (ids.length > 1) {
        q.dimensions = 'video';
        q.sort = '-' + q.metrics.split(',')[0].trim();
        q.maxResults = 200;
      }
      var report = analyticsQuery_(q);
      if (q.dimensions === 'video') addVideoTitles_(report.rows);
      return report;
    }
  );

  tool(
    'get_top_videos',
    {
      group: 'analytics',
      title: 'Top videos',
      description: 'Your best performing videos or Shorts in a date range, ranked by a metric, with titles.',
      input: ext_(
        {
          metric: sEnum_(
            ['views', 'estimatedMinutesWatched', 'likes', 'comments', 'shares', 'subscribersGained', 'averageViewDuration'],
            'Ranking metric. Default views.'
          ),
          content_type: sEnum_(['all', 'shorts', 'videos', 'live'], 'Only Shorts, regular videos or live streams. Default all.'),
          max_results: sInt_('How many videos (1-200, default 10).', { minimum: 1, maximum: 200 }),
        },
        dateInputs
      ),
      annotations: ANN_READ,
    },
    function (args) {
      var metric = args.metric || 'views';
      var metrics = ['views', 'estimatedMinutesWatched', 'averageViewDuration', 'likes', 'comments', 'shares', 'subscribersGained'];
      if (metrics.indexOf(metric) < 0) metrics.unshift(metric);
      var q = {
        startDate: resolveDate_(args.start_date, '28daysAgo'),
        endDate: resolveDate_(args.end_date, 'today'),
        metrics: metrics.join(','),
        dimensions: 'video',
        sort: '-' + metric,
        maxResults: args.max_results || 10,
      };
      if (args.content_type && args.content_type !== 'all') q.filters = 'creatorContentType==' + CONTENT_TYPE_FILTERS[args.content_type];
      var report = analyticsQuery_(q);
      addVideoTitles_(report.rows);
      return report;
    }
  );
}

function analyticsQuery_(q) {
  q.ids = 'channel==MINE';
  var res = gapi_('GET', YT_ANALYTICS_API + 'reports', { query: q });
  var headers = (res.columnHeaders || []).map(function (h) {
    return h.name;
  });
  var rows = (res.rows || []).map(function (r) {
    var o = {};
    headers.forEach(function (h, i) {
      o[h] = r[i];
    });
    return o;
  });
  return { start_date: q.startDate, end_date: q.endDate, columns: headers, rows: rows, row_count: rows.length };
}

function addVideoTitles_(rows) {
  var ids = rows
    .map(function (r) {
      return r.video;
    })
    .filter(Boolean);
  if (!ids.length) return;
  var byId = {};
  fetchVideos_(ids, 'snippet,contentDetails').forEach(function (v) {
    byId[v.id] = v;
  });
  rows.forEach(function (r) {
    var v = byId[r.video];
    if (!v) return;
    r.title = v.snippet.title;
    r.published_at = v.snippet.publishedAt;
    r.duration_seconds = isoDurationToSeconds_(v.contentDetails.duration);
    r.url = 'https://www.youtube.com/watch?v=' + r.video;
  });
}

/* ===== 17_ToolsLive.gs ===== */

/* Tools: live streaming (broadcasts, streams, live chat). */

function registerLiveTools_(tool) {
  tool(
    'list_live_broadcasts',
    {
      group: 'live',
      title: 'List live broadcasts',
      description: 'Your scheduled, live and past live broadcasts with their state, schedule, bound stream and live chat ID.',
      input: {
        status: sEnum_(['all', 'upcoming', 'active', 'completed'], 'Filter by state. Default all.'),
        max_results: sMax_(50, 25),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var res = gapi_('GET', YT_API + 'liveBroadcasts', {
        query: {
          part: 'id,snippet,contentDetails,status',
          broadcastStatus: args.status || 'all',
          broadcastType: 'all',
          maxResults: args.max_results || 25,
          pageToken: args.page_token,
        },
      });
      return pageOut_(res, 'broadcasts', (res.items || []).map(compactBroadcast_));
    }
  );

  tool(
    'create_live_broadcast',
    {
      group: 'live',
      title: 'Schedule live stream',
      description:
        'Schedule a live stream. Creates the broadcast and (by default) a reusable RTMP stream bound to it, and returns the ingestion URL and stream key for OBS or other encoders. Live streaming must be enabled on the channel.',
      input: {
        title: sStr_('Broadcast title (max 100 characters).'),
        description: sStr_('Broadcast description.'),
        scheduled_start_time: sStr_('ISO 8601 start time. Default: 5 minutes from now.'),
        scheduled_end_time: sStr_('ISO 8601 planned end time.'),
        privacy_status: sEnum_(['private', 'unlisted', 'public'], 'Visibility. Default private.'),
        made_for_kids: sBool_('Self-declare as made for kids. Default false.'),
        enable_auto_start: sBool_('Go live automatically when the encoder starts sending. Default true.'),
        enable_auto_stop: sBool_('End automatically when the encoder stops. Default true.'),
        enable_dvr: sBool_('Let viewers rewind. Default true.'),
        latency: sEnum_(['normal', 'low', 'ultraLow'], 'Latency preference. Default normal.'),
        stream_id: sStr_('Bind an existing stream instead of creating a new one.'),
        create_stream: sBool_('Create and bind a new RTMP stream when stream_id is not given. Default true.'),
      },
      required: ['title'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var start = args.scheduled_start_time
        ? toIsoTime_(args.scheduled_start_time, 'scheduled_start_time')
        : new Date(Date.now() + 5 * 60 * 1000).toISOString();
      var broadcast = gapi_('POST', YT_API + 'liveBroadcasts', {
        query: { part: 'snippet,status,contentDetails' },
        body: {
          snippet: dropEmpty_({
            title: cleanTitle_(args.title),
            description: args.description ? cleanText_(args.description, 'description') : undefined,
            scheduledStartTime: start,
            scheduledEndTime: toIsoTime_(args.scheduled_end_time, 'scheduled_end_time'),
          }),
          status: { privacyStatus: args.privacy_status || 'private', selfDeclaredMadeForKids: args.made_for_kids === true },
          contentDetails: {
            enableAutoStart: args.enable_auto_start !== false,
            enableAutoStop: args.enable_auto_stop !== false,
            enableDvr: args.enable_dvr !== false,
            latencyPreference: args.latency || 'normal',
            monitorStream: { enableMonitorStream: false },
          },
        },
      });
      var out = compactBroadcast_(broadcast);
      var streamId = args.stream_id;
      if (!streamId && args.create_stream !== false) {
        var stream = gapi_('POST', YT_API + 'liveStreams', {
          query: { part: 'snippet,cdn,contentDetails,status' },
          body: {
            snippet: { title: 'Stream for ' + cleanTitle_(args.title) },
            cdn: { ingestionType: 'rtmp', resolution: 'variable', frameRate: 'variable' },
            contentDetails: { isReusable: true },
          },
        });
        streamId = stream.id;
        out.stream = compactStream_(stream, true);
      }
      if (streamId) {
        gapi_('POST', YT_API + 'liveBroadcasts/bind', { query: { id: broadcast.id, streamId: streamId, part: 'id,contentDetails' } });
        out.bound_stream_id = streamId;
      }
      return out;
    }
  );

  tool(
    'update_live_broadcast',
    {
      group: 'live',
      title: 'Update live broadcast',
      description: 'Change a broadcast\'s title, description, schedule or visibility. Fields you omit stay unchanged.',
      input: {
        broadcast_id: sStr_('Broadcast ID.'),
        title: sStr_('New title.'),
        description: sStr_('New description.'),
        scheduled_start_time: sStr_('New ISO 8601 start time.'),
        scheduled_end_time: sStr_('New ISO 8601 end time.'),
        privacy_status: sEnum_(['private', 'unlisted', 'public'], 'Visibility.'),
      },
      required: ['broadcast_id'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var cur = gapi_('GET', YT_API + 'liveBroadcasts', { query: { part: 'snippet,status', id: args.broadcast_id } }).items;
      if (!cur || !cur[0]) throw toolError_('Broadcast ' + args.broadcast_id + ' not found.');
      cur = cur[0];
      var body = {
        id: args.broadcast_id,
        snippet: dropEmpty_({
          title: args.title !== undefined ? cleanTitle_(args.title) : cur.snippet.title,
          description: args.description !== undefined ? cleanText_(args.description, 'description') : cur.snippet.description,
          scheduledStartTime: args.scheduled_start_time
            ? toIsoTime_(args.scheduled_start_time, 'scheduled_start_time')
            : cur.snippet.scheduledStartTime,
          scheduledEndTime: args.scheduled_end_time ? toIsoTime_(args.scheduled_end_time, 'scheduled_end_time') : cur.snippet.scheduledEndTime,
        }),
        status: dropEmpty_({
          privacyStatus: args.privacy_status || cur.status.privacyStatus,
          selfDeclaredMadeForKids: cur.status.selfDeclaredMadeForKids,
        }),
      };
      var updated = gapi_('PUT', YT_API + 'liveBroadcasts', { query: { part: 'snippet,status' }, body: body });
      return compactBroadcast_(updated);
    }
  );

  tool(
    'transition_live_broadcast',
    {
      group: 'live',
      title: 'Go live / end broadcast',
      description:
        'Move a broadcast to testing, live or complete. Not needed when auto start/stop is on. The bound stream must be receiving data before going live.',
      input: {
        broadcast_id: sStr_('Broadcast ID.'),
        to: sEnum_(['testing', 'live', 'complete'], 'Target state.'),
      },
      required: ['broadcast_id', 'to'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var res = gapi_('POST', YT_API + 'liveBroadcasts/transition', {
        query: { id: args.broadcast_id, broadcastStatus: args.to, part: 'id,snippet,status,contentDetails' },
      });
      return compactBroadcast_(res);
    }
  );

  tool(
    'delete_live_broadcast',
    {
      group: 'live',
      title: 'Delete live broadcast',
      description: 'Delete a scheduled or completed broadcast.',
      input: { broadcast_id: sStr_('Broadcast ID.') },
      required: ['broadcast_id'],
      annotations: ANN_DELETE,
    },
    function (args) {
      gapi_('DELETE', YT_API + 'liveBroadcasts', { query: { id: args.broadcast_id } });
      return { deleted: true, broadcast_id: args.broadcast_id };
    }
  );

  tool(
    'list_live_streams',
    {
      group: 'live',
      title: 'List live streams',
      description: 'Your encoder streams (ingestion endpoints) and their health. Stream keys are only included when requested.',
      input: {
        include_stream_keys: sBool_('Include RTMP URLs and stream keys. Default false.'),
        max_results: sMax_(50, 25),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var res = gapi_('GET', YT_API + 'liveStreams', {
        query: { part: 'id,snippet,cdn,contentDetails,status', mine: true, maxResults: args.max_results || 25, pageToken: args.page_token },
      });
      return pageOut_(
        res,
        'streams',
        (res.items || []).map(function (s) {
          return compactStream_(s, !!args.include_stream_keys);
        })
      );
    }
  );

  tool(
    'list_live_chat_messages',
    {
      group: 'live',
      title: 'Read live chat',
      description: 'Messages in a broadcast\'s live chat. Pass next_page_token from the previous call to get only new messages.',
      input: {
        broadcast_id: sStr_('Broadcast ID (the live chat is looked up for you).'),
        live_chat_id: sStr_('Live chat ID, if you already have it.'),
        max_results: sInt_('Messages per page (200-2000, default 200).', { minimum: 200, maximum: 2000 }),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var chatId = resolveLiveChatId_(args);
      var res = gapi_('GET', YT_API + 'liveChat/messages', {
        query: { liveChatId: chatId, part: 'snippet,authorDetails', maxResults: args.max_results || 200, pageToken: args.page_token },
      });
      return {
        live_chat_id: chatId,
        messages: (res.items || []).map(function (m) {
          var a = m.authorDetails || {};
          return dropEmpty_({
            message_id: m.id,
            type: m.snippet.type,
            author: a.displayName,
            author_channel_id: a.channelId,
            is_owner: a.isChatOwner || undefined,
            is_moderator: a.isChatModerator || undefined,
            is_member: a.isChatSponsor || undefined,
            text: m.snippet.displayMessage,
            published_at: m.snippet.publishedAt,
            super_chat: m.snippet.superChatDetails ? m.snippet.superChatDetails.amountDisplayString : undefined,
          });
        }),
        next_page_token: res.nextPageToken,
        poll_after_ms: res.pollingIntervalMillis,
      };
    }
  );

  tool(
    'send_live_chat_message',
    {
      group: 'live',
      title: 'Send live chat message',
      description: 'Post a message in a live chat as the authorized channel.',
      input: {
        text: sStr_('Message text (max 200 characters).'),
        broadcast_id: sStr_('Broadcast ID.'),
        live_chat_id: sStr_('Live chat ID, if you already have it.'),
      },
      required: ['text'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var chatId = resolveLiveChatId_(args);
      var res = gapi_('POST', YT_API + 'liveChat/messages', {
        query: { part: 'snippet' },
        body: { snippet: { liveChatId: chatId, type: 'textMessageEvent', textMessageDetails: { messageText: args.text } } },
      });
      return { message_id: res.id, live_chat_id: chatId, sent: true };
    }
  );
}

function resolveLiveChatId_(args) {
  if (args.live_chat_id) return args.live_chat_id;
  if (!args.broadcast_id) throw toolError_('Pass broadcast_id or live_chat_id.');
  var items = gapi_('GET', YT_API + 'liveBroadcasts', { query: { part: 'snippet', id: args.broadcast_id } }).items;
  var chat = items && items[0] && items[0].snippet.liveChatId;
  if (!chat) throw toolError_('This broadcast has no active live chat (it may have ended or chat is disabled).');
  return chat;
}

function compactBroadcast_(b) {
  var sn = b.snippet || {};
  var st = b.status || {};
  var cd = b.contentDetails || {};
  return dropEmpty_({
    broadcast_id: b.id,
    title: sn.title,
    description: truncate_(sn.description, 200) || undefined,
    scheduled_start: sn.scheduledStartTime,
    scheduled_end: sn.scheduledEndTime,
    actual_start: sn.actualStartTime,
    actual_end: sn.actualEndTime,
    state: st.lifeCycleStatus,
    privacy_status: st.privacyStatus,
    recording_status: st.recordingStatus,
    bound_stream_id: cd.boundStreamId,
    auto_start: cd.enableAutoStart,
    auto_stop: cd.enableAutoStop,
    live_chat_id: sn.liveChatId,
    watch_url: 'https://www.youtube.com/watch?v=' + b.id,
    studio_url: 'https://studio.youtube.com/video/' + b.id + '/livestreaming',
  });
}

function compactStream_(s, withKeys) {
  var cdn = s.cdn || {};
  var info = cdn.ingestionInfo || {};
  var out = {
    stream_id: s.id,
    title: s.snippet ? s.snippet.title : undefined,
    status: s.status ? s.status.streamStatus : undefined,
    health: s.status && s.status.healthStatus ? s.status.healthStatus.status : undefined,
    resolution: cdn.resolution,
    frame_rate: cdn.frameRate,
    reusable: s.contentDetails ? s.contentDetails.isReusable : undefined,
  };
  if (withKeys) {
    out.rtmp_url = info.ingestionAddress;
    out.rtmps_url = info.rtmpsIngestionAddress;
    out.backup_rtmp_url = info.backupIngestionAddress;
    out.stream_key = info.streamName;
  }
  return dropEmpty_(out);
}

/* ===== 18_ToolsAdvanced.gs ===== */

/* Tools: raw API access, reference data and server status. */

var RAW_API_BASES = { data: YT_API, analytics: YT_ANALYTICS_API, reporting: YT_REPORTING_API };

function registerAdvancedTools_(tool) {
  tool(
    'youtube_api_request',
    {
      group: 'advanced',
      title: 'Raw YouTube API request',
      description:
        'Call any YouTube Data API v3, YouTube Analytics v2 or YouTube Reporting v1 endpoint directly, for features without a dedicated tool: activities, channelSections update, liveChatBans, liveChatModerators, superChatEvents, videoAbuseReportReasons, videos/reportAbuse, playlistImages, members, reporting jobs, and so on. Paths are relative, e.g. api=data path=activities query={"part":"snippet","mine":true}.',
      input: {
        api: sEnum_(['data', 'analytics', 'reporting'], 'data = youtube/v3 (default), analytics = youtubeAnalytics v2, reporting = youtubeReporting v1.'),
        method: sEnum_(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 'HTTP method. Default GET.'),
        path: sStr_('Endpoint path relative to the API root, e.g. activities, liveChat/bans, reports, jobs.'),
        query: sObj_('Query parameters as an object, e.g. {"part": "snippet", "mine": true}.'),
        body: sObj_('JSON request body for POST/PUT/PATCH.'),
      },
      required: ['path'],
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    function (args) {
      var base = RAW_API_BASES[args.api || 'data'];
      var path = String(args.path).trim().replace(/^\/+/, '');
      path = path.replace(/^youtube\/v3\//, '');
      if (!/^[A-Za-z0-9_\-\/.]+$/.test(path) || path.indexOf('..') >= 0) {
        throw toolError_('path must be a relative API path such as "activities" or "liveChat/bans" (no host, no query string).');
      }
      var method = args.method || 'GET';
      var opts = { query: args.query || {} };
      if (args.body && method !== 'GET' && method !== 'DELETE') opts.body = args.body;
      return gapi_(method, base + path, opts);
    }
  );

  tool(
    'list_i18n',
    {
      group: 'advanced',
      title: 'List languages / regions',
      description: 'Languages (for default_language, captions) or regions (for region_code) supported by YouTube.',
      input: {
        type: sEnum_(['languages', 'regions'], 'What to list.'),
        display_language: sStr_('Language for the names. Default en.'),
      },
      required: ['type'],
      annotations: ANN_READ,
    },
    function (args) {
      var endpoint = args.type === 'regions' ? 'i18nRegions' : 'i18nLanguages';
      var res = gapi_('GET', YT_API + endpoint, { query: { part: 'snippet', hl: args.display_language || 'en' } });
      return {
        items: (res.items || []).map(function (i) {
          return { code: i.snippet.gl || i.snippet.hl, name: i.snippet.name };
        }),
      };
    }
  );

  tool(
    'get_server_status',
    {
      group: 'advanced',
      title: 'Server status',
      description: 'Which channel this server acts as, the server version, enabled tool groups and any uploads in progress.',
      input: {},
      annotations: ANN_READ,
    },
    function (args, ctx) {
      var ch = getMyChannel_(true);
      var jobs = listJobs_();
      var worker = false;
      try {
        worker = ScriptApp.getProjectTriggers().some(function (t) {
          return t.getHandlerFunction() === WORKER_HANDLER;
        });
      } catch (e) {
        worker = null;
      }
      return dropEmpty_({
        server: MCP_SERVER_INFO,
        channel: { id: ch.id, title: ch.title, handle: ch.handle },
        groups: (ctx && ctx.groups) || TOOL_GROUPS,
        mode: ctx && ctx.readOnly ? 'readonly' : 'full',
        tools: listToolDefs_(ctx).length,
        uploads_in_progress: jobs.filter(function (j) {
          return ACTIVE_JOB_STATES.indexOf(j.status) >= 0;
        }).length,
        uploads_awaiting_client: jobs.filter(function (j) {
          return j.status === 'awaiting_client';
        }).length,
        background_worker_scheduled: worker,
        time_zone: Session.getScriptTimeZone(),
      });
    }
  );
}
