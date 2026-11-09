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
