/* Tools: comments and moderation. */

function registerCommentTools_(tool) {
  tool(
    'list_comments',
    {
      group: 'comments',
      title: 'List comments',
      description:
        'Comment threads on one video, or across all of your channel\'s videos (default). Filter by text or moderation state, e.g. heldForReview to see comments waiting for approval. Includes up to a few replies per thread; use list_comment_replies for all replies.',
      input: {
        video_id: sStr_('Video ID or URL. Omit to cover every video on your channel.'),
        search_terms: sStr_('Only comments containing this text.'),
        moderation_status: sEnum_(['published', 'heldForReview', 'likelySpam'], 'Default published. Use heldForReview or likelySpam for the review queue.'),
        order: sEnum_(['time', 'relevance'], 'Default time (newest first).'),
        include_replies: sBool_('Include replies returned with each thread. Default true.'),
        max_results: sMax_(100, 20),
        page_token: sPageToken_(),
      },
      annotations: ANN_READ,
    },
    function (args) {
      var q = {
        part: args.include_replies === false ? 'snippet' : 'snippet,replies',
        maxResults: args.max_results || 20,
        pageToken: args.page_token,
        searchTerms: args.search_terms,
        moderationStatus: args.moderation_status,
        order: args.order,
        textFormat: 'plainText',
      };
      if (args.video_id) q.videoId = extractVideoId_(args.video_id);
      else q.allThreadsRelatedToChannelId = getMyChannel_().id;
      var res = gapi_('GET', YT_API + 'commentThreads', { query: q });
      return pageOut_(res, 'threads', (res.items || []).map(compactThread_));
    }
  );

  tool(
    'list_comment_replies',
    {
      group: 'comments',
      title: 'List comment replies',
      description: 'All replies to a top-level comment.',
      input: {
        parent_id: sStr_('ID of the top-level comment (thread_id from list_comments).'),
        max_results: sMax_(100, 50),
        page_token: sPageToken_(),
      },
      required: ['parent_id'],
      annotations: ANN_READ,
    },
    function (args) {
      var res = gapi_('GET', YT_API + 'comments', {
        query: { part: 'snippet', parentId: args.parent_id, maxResults: args.max_results || 50, pageToken: args.page_token, textFormat: 'plainText' },
      });
      return pageOut_(res, 'replies', (res.items || []).map(compactComment_));
    }
  );

  tool(
    'post_comment',
    {
      group: 'comments',
      title: 'Post comment',
      description: 'Post a new top-level comment on a video as the authorized channel.',
      input: { video_id: sStr_('Video ID or URL.'), text: sStr_('Comment text.') },
      required: ['video_id', 'text'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var res = gapi_('POST', YT_API + 'commentThreads', {
        query: { part: 'snippet' },
        body: { snippet: { videoId: extractVideoId_(args.video_id), topLevelComment: { snippet: { textOriginal: args.text } } } },
      });
      return compactThread_(res);
    }
  );

  tool(
    'reply_to_comment',
    {
      group: 'comments',
      title: 'Reply to comment',
      description: 'Reply to a top-level comment as the authorized channel.',
      input: { parent_id: sStr_('Top-level comment ID (thread_id).'), text: sStr_('Reply text.') },
      required: ['parent_id', 'text'],
      annotations: ANN_WRITE,
    },
    function (args) {
      var res = gapi_('POST', YT_API + 'comments', {
        query: { part: 'snippet' },
        body: { snippet: { parentId: args.parent_id, textOriginal: args.text } },
      });
      return compactComment_(res);
    }
  );

  tool(
    'update_comment',
    {
      group: 'comments',
      title: 'Edit comment',
      description: 'Edit the text of a comment written by the authorized channel.',
      input: { comment_id: sStr_('Comment ID.'), text: sStr_('New text.') },
      required: ['comment_id', 'text'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      var res = gapi_('PUT', YT_API + 'comments', {
        query: { part: 'snippet' },
        body: { id: args.comment_id, snippet: { textOriginal: args.text } },
      });
      return compactComment_(res);
    }
  );

  tool(
    'delete_comment',
    {
      group: 'comments',
      title: 'Delete comment',
      description: 'Delete a comment written by the authorized channel. To hide other people\'s comments on your videos use moderate_comments with status rejected.',
      input: { comment_id: sStr_('Comment ID.') },
      required: ['comment_id'],
      annotations: ANN_DELETE,
    },
    function (args) {
      gapi_('DELETE', YT_API + 'comments', { query: { id: args.comment_id } });
      return { deleted: true, comment_id: args.comment_id };
    }
  );

  tool(
    'moderate_comments',
    {
      group: 'comments',
      title: 'Moderate comments',
      description:
        'Approve (published), hold for review (heldForReview) or remove (rejected) comments on your videos. With rejected you can also ban the author from commenting on your channel.',
      input: {
        comment_ids: sArr_(sStr_('Comment ID'), 'Comments to moderate (max 50).'),
        status: sEnum_(['published', 'heldForReview', 'rejected'], 'New moderation state.'),
        ban_author: sBool_('Also ban the author(s). Only with status rejected. Default false.'),
      },
      required: ['comment_ids', 'status'],
      annotations: ANN_UPDATE,
    },
    function (args) {
      if (args.ban_author && args.status !== 'rejected') throw toolError_('ban_author only works with status rejected.');
      var ids = args.comment_ids.slice(0, 50);
      gapi_('POST', YT_API + 'comments/setModerationStatus', {
        query: { id: ids.join(','), moderationStatus: args.status, banAuthor: args.ban_author ? 'true' : undefined },
      });
      return { moderated: ids.length, status: args.status, banned_authors: !!args.ban_author };
    }
  );
}

function compactComment_(c) {
  var sn = c.snippet || {};
  return dropEmpty_({
    comment_id: c.id,
    author: sn.authorDisplayName,
    author_channel_id: sn.authorChannelId ? sn.authorChannelId.value : undefined,
    text: sn.textOriginal || sn.textDisplay,
    likes: sn.likeCount,
    published_at: sn.publishedAt,
    edited_at: sn.updatedAt && sn.updatedAt !== sn.publishedAt ? sn.updatedAt : undefined,
    parent_id: sn.parentId,
    moderation_status: sn.moderationStatus,
  });
}

function compactThread_(t) {
  var sn = t.snippet || {};
  var top = sn.topLevelComment ? compactComment_(sn.topLevelComment) : {};
  return dropEmpty_({
    thread_id: t.id,
    video_id: sn.videoId,
    author: top.author,
    author_channel_id: top.author_channel_id,
    text: top.text,
    likes: top.likes,
    published_at: top.published_at,
    edited_at: top.edited_at,
    moderation_status: top.moderation_status,
    reply_count: sn.totalReplyCount,
    can_reply: sn.canReply,
    replies:
      t.replies && t.replies.comments && t.replies.comments.length ? t.replies.comments.map(compactComment_) : undefined,
  });
}
