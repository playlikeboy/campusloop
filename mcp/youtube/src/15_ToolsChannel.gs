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
