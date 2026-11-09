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
