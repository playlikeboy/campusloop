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
