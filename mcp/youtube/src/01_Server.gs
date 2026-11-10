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
