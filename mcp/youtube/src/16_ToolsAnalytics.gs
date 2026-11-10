/* Tools: YouTube Analytics API v2. Data usually lags 2-3 days. */

var DEFAULT_METRICS =
  'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,subscribersLost';
var CONTENT_TYPE_FILTERS = { shorts: 'SHORTS', videos: 'VIDEO_ON_DEMAND', live: 'LIVE_STREAM' };

function registerAnalyticsTools_(tool) {
  var dateInputs = {
    start_date: sStr_('YYYY-MM-DD, "today", "yesterday" or "NdaysAgo". Default 28daysAgo.'),
    end_date: sStr_('YYYY-MM-DD, "today", "yesterday" or "NdaysAgo". Default today.'),
  };

  tool(
    'get_analytics_report',
    {
      group: 'analytics',
      title: 'Channel analytics report',
      description:
        'Run any YouTube Analytics query for your channel. Metrics e.g. views, estimatedMinutesWatched, averageViewDuration, averageViewPercentage, likes, dislikes, comments, shares, subscribersGained, subscribersLost, videosAddedToPlaylists, cardClickRate, estimatedRevenue, estimatedAdRevenue, cpm, playbackBasedCpm (revenue needs a monetized channel). Dimensions e.g. day, month, video, country, province, city, deviceType, operatingSystem, ageGroup, gender, insightTrafficSourceType, insightTrafficSourceDetail, playbackLocationType, sharingService, subscribedStatus, creatorContentType. Filters e.g. video==ID, country==IN, creatorContentType==SHORTS.',
      input: ext_(
        {
          metrics: sStr_('Comma-separated metrics. Default: ' + DEFAULT_METRICS + '.'),
          dimensions: sStr_('Comma-separated dimensions, e.g. day or country or ageGroup,gender.'),
          filters: sStr_('Filters such as video==VIDEO_ID or country==IN;deviceType==MOBILE.'),
          sort: sStr_('Sort, e.g. -views (descending). Required by YouTube for some dimension combinations.'),
          max_results: sInt_('Max rows (1-200).', { minimum: 1, maximum: 200 }),
          currency: sStr_('Currency for revenue metrics, e.g. INR. Default USD.'),
          include_historical_channel_data: sBool_('Include data from before the channel was linked to a content owner.'),
        },
        dateInputs
      ),
      annotations: ANN_READ,
    },
    function (args) {
      return analyticsQuery_({
        startDate: resolveDate_(args.start_date, '28daysAgo'),
        endDate: resolveDate_(args.end_date, 'today'),
        metrics: args.metrics || DEFAULT_METRICS,
        dimensions: args.dimensions,
        filters: args.filters,
        sort: args.sort,
        maxResults: args.max_results,
        currency: args.currency,
        includeHistoricalChannelData: args.include_historical_channel_data ? 'true' : undefined,
      });
    }
  );

  tool(
    'get_video_analytics',
    {
      group: 'analytics',
      title: 'Video analytics',
      description: 'Views, watch time, retention, likes, shares and subscribers gained for one or more videos or Shorts, in total or per day.',
      input: ext_(
        {
          video_ids: sArr_(sStr_('Video ID or URL'), 'Videos to analyse (max 200).'),
          by_day: sBool_('Return one row per day (totals across the given videos). Default false.'),
          metrics: sStr_('Comma-separated metrics. Default: ' + DEFAULT_METRICS + '.'),
        },
        dateInputs
      ),
      required: ['video_ids'],
      annotations: ANN_READ,
    },
    function (args) {
      var ids = toIdList_(args.video_ids).slice(0, 200);
      var q = {
        startDate: resolveDate_(args.start_date, '28daysAgo'),
        endDate: resolveDate_(args.end_date, 'today'),
        metrics: args.metrics || DEFAULT_METRICS,
        filters: 'video==' + ids.join(','),
      };
      if (args.by_day) {
        q.dimensions = 'day';
        q.sort = 'day';
      } else if (ids.length > 1) {
        q.dimensions = 'video';
        q.sort = '-' + q.metrics.split(',')[0].trim();
        q.maxResults = 200;
      }
      var report = analyticsQuery_(q);
      if (q.dimensions === 'video') addVideoTitles_(report.rows);
      return report;
    }
  );

  tool(
    'get_top_videos',
    {
      group: 'analytics',
      title: 'Top videos',
      description: 'Your best performing videos or Shorts in a date range, ranked by a metric, with titles.',
      input: ext_(
        {
          metric: sEnum_(
            ['views', 'estimatedMinutesWatched', 'likes', 'comments', 'shares', 'subscribersGained', 'averageViewDuration'],
            'Ranking metric. Default views.'
          ),
          content_type: sEnum_(['all', 'shorts', 'videos', 'live'], 'Only Shorts, regular videos or live streams. Default all.'),
          max_results: sInt_('How many videos (1-200, default 10).', { minimum: 1, maximum: 200 }),
        },
        dateInputs
      ),
      annotations: ANN_READ,
    },
    function (args) {
      var metric = args.metric || 'views';
      var metrics = ['views', 'estimatedMinutesWatched', 'averageViewDuration', 'likes', 'comments', 'shares', 'subscribersGained'];
      if (metrics.indexOf(metric) < 0) metrics.unshift(metric);
      var q = {
        startDate: resolveDate_(args.start_date, '28daysAgo'),
        endDate: resolveDate_(args.end_date, 'today'),
        metrics: metrics.join(','),
        dimensions: 'video',
        sort: '-' + metric,
        maxResults: args.max_results || 10,
      };
      if (args.content_type && args.content_type !== 'all') q.filters = 'creatorContentType==' + CONTENT_TYPE_FILTERS[args.content_type];
      var report = analyticsQuery_(q);
      addVideoTitles_(report.rows);
      return report;
    }
  );
}

function analyticsQuery_(q) {
  q.ids = 'channel==MINE';
  var res = gapi_('GET', YT_ANALYTICS_API + 'reports', { query: q });
  var headers = (res.columnHeaders || []).map(function (h) {
    return h.name;
  });
  var rows = (res.rows || []).map(function (r) {
    var o = {};
    headers.forEach(function (h, i) {
      o[h] = r[i];
    });
    return o;
  });
  return { start_date: q.startDate, end_date: q.endDate, columns: headers, rows: rows, row_count: rows.length };
}

function addVideoTitles_(rows) {
  var ids = rows
    .map(function (r) {
      return r.video;
    })
    .filter(Boolean);
  if (!ids.length) return;
  var byId = {};
  fetchVideos_(ids, 'snippet,contentDetails').forEach(function (v) {
    byId[v.id] = v;
  });
  rows.forEach(function (r) {
    var v = byId[r.video];
    if (!v) return;
    r.title = v.snippet.title;
    r.published_at = v.snippet.publishedAt;
    r.duration_seconds = isoDurationToSeconds_(v.contentDetails.duration);
    r.url = 'https://www.youtube.com/watch?v=' + r.video;
  });
}
