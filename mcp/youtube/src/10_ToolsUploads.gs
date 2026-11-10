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
