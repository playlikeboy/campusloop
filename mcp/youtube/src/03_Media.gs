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
