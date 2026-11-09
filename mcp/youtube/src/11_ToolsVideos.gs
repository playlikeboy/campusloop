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
