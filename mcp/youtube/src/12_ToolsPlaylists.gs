/* Tools: playlists and playlist items. */

function registerPlaylistTools_(tool) {
  tool(
    'list_playlists',
    {
      group: 'playlists',
      title: 'List playlists',
      description: 'List your playlists (default), another channel\'s playlists, or specific playlists by ID.',
      input: {
        channel_id: sStr_('List this channel\'s public playlists instead of yours.'),
        playlist_ids: sArr_(sStr_('Playlist ID'), 'Fetch these playlists (max 50).'),
        max_results: sMax_(50, 25),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var q = { part: 'snippet,contentDetails,status', maxResults: args.max_results || 25, pageToken: args.page_token };
      if (args.playlist_ids && args.playlist_ids.length) q.id = args.playlist_ids.slice(0, 50).join(',');
      else if (args.channel_id) q.channelId = args.channel_id;
      else q.mine = true;
      var res = gapi_('GET', YT_API + 'playlists', { query: q });
      return pageOut_(res, 'playlists', (res.items || []).map(compactPlaylist_));
    }
  );

  tool(
    'create_playlist',
    {
      group: 'playlists',
      title: 'Create playlist',
      description: 'Create a playlist on the channel, optionally adding videos to it right away.',
      input: {
        title: sStr_('Playlist title (max 150 characters).'),
        description: sStr_('Playlist description (max 5,000 characters).'),
        privacy_status: sEnum_(['private', 'unlisted', 'public'], 'Visibility. Default private.'),
        default_language: sStr_('Language of title/description (BCP-47).'),
        video_ids: sArr_(sStr_('Video ID or URL'), 'Videos to add, in order.'),
      },
      required: ['title'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var created = gapi_('POST', YT_API + 'playlists', {
        query: { part: 'snippet,status' },
        body: {
          snippet: dropEmpty_({
            title: cleanTitle150_(args.title),
            description: args.description ? cleanText_(args.description, 'description') : undefined,
            defaultLanguage: args.default_language,
          }),
          status: { privacyStatus: args.privacy_status || 'private' },
        },
      });
      var out = compactPlaylist_(created);
      var ids = toIdList_(args.video_ids);
      if (ids.length) out.added = addVideosToPlaylist_(created.id, ids, undefined);
      return out;
    }
  );

  tool(
    'update_playlist',
    {
      group: 'playlists',
      title: 'Update playlist',
      description: 'Change a playlist\'s title, description, visibility or language. Fields you omit stay unchanged.',
      input: {
        playlist_id: sStr_('Playlist ID.'),
        title: sStr_('New title.'),
        description: sStr_('New description.'),
        privacy_status: sEnum_(['private', 'unlisted', 'public'], 'Visibility.'),
        default_language: sStr_('Language (BCP-47).'),
      },
      required: ['playlist_id'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var cur = gapi_('GET', YT_API + 'playlists', { query: { part: 'snippet,status', id: args.playlist_id } }).items;
      if (!cur || !cur[0]) throw toolError_('Playlist ' + args.playlist_id + ' not found.');
      cur = cur[0];
      var body = {
        id: args.playlist_id,
        snippet: dropEmpty_({
          title: args.title !== undefined ? cleanTitle150_(args.title) : cur.snippet.title,
          description: args.description !== undefined ? cleanText_(args.description, 'description') : cur.snippet.description,
          defaultLanguage: args.default_language || cur.snippet.defaultLanguage,
        }),
        status: { privacyStatus: args.privacy_status || cur.status.privacyStatus },
      };
      var updated = gapi_('PUT', YT_API + 'playlists', { query: { part: 'snippet,status' }, body: body });
      return compactPlaylist_(updated);
    }
  );

  tool(
    'delete_playlist',
    {
      group: 'playlists',
      title: 'Delete playlist',
      description: 'Delete a playlist. The videos in it are not deleted.',
      input: { playlist_id: sStr_('Playlist ID.') },
      required: ['playlist_id'],
      annotations: ANN_DELETE,
    },
    function (args) {
      gapi_('DELETE', YT_API + 'playlists', { query: { id: args.playlist_id } });
      return { deleted: true, playlist_id: args.playlist_id };
    }
  );

  tool(
    'list_playlist_items',
    {
      group: 'playlists',
      title: 'List playlist items',
      description: 'Videos in a playlist in playlist order, with the playlist_item_id needed to move or remove them. Use playlist_id "uploads" for the channel\'s uploads.',
      input: {
        playlist_id: sStr_('Playlist ID, or "uploads".'),
        max_results: sMax_(50, 50),
        page_token: sPageToken_(),
      },
      required: ['playlist_id'],
      annotations: ANN_READ,
    },
    function (args) {
      var pid = args.playlist_id === 'uploads' ? getMyChannel_().uploads : args.playlist_id;
      var res = gapi_('GET', YT_API + 'playlistItems', {
        query: { part: 'snippet,contentDetails,status', playlistId: pid, maxResults: args.max_results || 50, pageToken: args.page_token },
      });
      var items = (res.items || []).map(function (i) {
        var sn = i.snippet || {};
        var vid = i.contentDetails ? i.contentDetails.videoId : sn.resourceId && sn.resourceId.videoId;
        return dropEmpty_({
          playlist_item_id: i.id,
          video_id: vid,
          title: sn.title,
          position: sn.position,
          video_owner: sn.videoOwnerChannelTitle,
          video_published_at: i.contentDetails ? i.contentDetails.videoPublishedAt : undefined,
          added_at: sn.publishedAt,
          privacy_status: i.status ? i.status.privacyStatus : undefined,
          note: i.contentDetails ? i.contentDetails.note : undefined,
          url: 'https://www.youtube.com/watch?v=' + vid + '&list=' + pid,
        });
      });
      var out = pageOut_(res, 'items', items);
      out.playlist_id = pid;
      return out;
    }
  );

  tool(
    'add_to_playlist',
    {
      group: 'playlists',
      title: 'Add videos to playlist',
      description: 'Add one or more videos (yours or anyone\'s) to one of your playlists, optionally at a position.',
      input: {
        playlist_id: sStr_('Playlist ID.'),
        video_ids: sArr_(sStr_('Video ID or URL'), 'Videos to add, in order.'),
        position: sInt_('Zero-based position for the first video (manual-order playlists only). Default: end.', { minimum: 0 }),
      },
      required: ['playlist_id', 'video_ids'],
      annotations: ANN_WRITE,
    },
    function (args) {
      return { playlist_id: args.playlist_id, results: addVideosToPlaylist_(args.playlist_id, toIdList_(args.video_ids), args.position) };
    }
  );

  tool(
    'move_playlist_item',
    {
      group: 'playlists',
      title: 'Move playlist item',
      description: 'Move a video to a new position in a manually ordered playlist.',
      input: {
        playlist_item_id: sStr_('playlist_item_id from list_playlist_items.'),
        position: sInt_('New zero-based position.', { minimum: 0 }),
      },
      required: ['playlist_item_id', 'position'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var items = gapi_('GET', YT_API + 'playlistItems', { query: { part: 'snippet', id: args.playlist_item_id } }).items;
      if (!items || !items[0]) throw toolError_('Playlist item ' + args.playlist_item_id + ' not found.');
      var sn = items[0].snippet;
      var updated = gapi_('PUT', YT_API + 'playlistItems', {
        query: { part: 'snippet' },
        body: {
          id: args.playlist_item_id,
          snippet: { playlistId: sn.playlistId, resourceId: sn.resourceId, position: args.position },
        },
      });
      return { playlist_item_id: updated.id, video_id: sn.resourceId.videoId, position: updated.snippet.position };
    }
  );

  tool(
    'remove_from_playlist',
    {
      group: 'playlists',
      title: 'Remove from playlist',
      description: 'Remove a video from a playlist, by playlist_item_id or by playlist_id + video_id. The video itself is not deleted.',
      input: {
        playlist_item_id: sStr_('playlist_item_id from list_playlist_items.'),
        playlist_id: sStr_('Playlist ID (with video_id).'),
        video_id: sStr_('Video ID or URL (with playlist_id). Removes every occurrence.'),
      },
      annotations: ANN_DELETE,
    },
    function (args) {
      var ids = [];
      if (args.playlist_item_id) {
        ids.push(args.playlist_item_id);
      } else if (args.playlist_id && args.video_id) {
        var vid = extractVideoId_(args.video_id);
        var token;
        var pages = 0;
        do {
          var res = gapi_('GET', YT_API + 'playlistItems', {
            query: { part: 'contentDetails', playlistId: args.playlist_id, maxResults: 50, pageToken: token },
          });
          (res.items || []).forEach(function (i) {
            if (i.contentDetails.videoId === vid) ids.push(i.id);
          });
          token = res.nextPageToken;
          pages++;
        } while (token && pages < 20);
        if (!ids.length) throw toolError_('Video ' + vid + ' is not in playlist ' + args.playlist_id + '.');
      } else {
        throw toolError_('Pass playlist_item_id, or playlist_id together with video_id.');
      }
      ids.forEach(function (id) {
        gapi_('DELETE', YT_API + 'playlistItems', { query: { id: id } });
      });
      return { removed: ids.length, playlist_item_ids: ids };
    }
  );
}

function compactPlaylist_(p) {
  var sn = p.snippet || {};
  return dropEmpty_({
    id: p.id,
    title: sn.title,
    description: truncate_(sn.description, 200) || undefined,
    privacy_status: p.status ? p.status.privacyStatus : undefined,
    item_count: p.contentDetails ? p.contentDetails.itemCount : undefined,
    channel_title: sn.channelTitle,
    published_at: sn.publishedAt,
    url: 'https://www.youtube.com/playlist?list=' + p.id,
    thumbnail: bestThumb_(sn.thumbnails),
  });
}

function cleanTitle150_(title) {
  var t = String(title || '')
    .replace(/[<>]/g, '')
    .trim();
  if (!t) throw toolError_('title is required.');
  if (t.length > 150) throw toolError_('Playlist titles are limited to 150 characters.');
  return t;
}

function insertPlaylistItem_(playlistId, videoId, position) {
  var snippet = { playlistId: playlistId, resourceId: { kind: 'youtube#video', videoId: videoId } };
  if (position !== undefined && position !== null) snippet.position = position;
  return gapi_('POST', YT_API + 'playlistItems', { query: { part: 'snippet' }, body: { snippet: snippet } });
}

function addVideosToPlaylist_(playlistId, videoIds, position) {
  return videoIds.map(function (vid, i) {
    try {
      var item = insertPlaylistItem_(playlistId, vid, position === undefined || position === null ? undefined : position + i);
      return { video_id: vid, added: true, playlist_item_id: item.id };
    } catch (e) {
      return { video_id: vid, added: false, error: e.message };
    }
  });
}
