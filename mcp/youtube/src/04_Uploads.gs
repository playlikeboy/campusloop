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
