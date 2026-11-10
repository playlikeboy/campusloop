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
