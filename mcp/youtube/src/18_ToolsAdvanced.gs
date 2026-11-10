/* Tools: raw API access, reference data and server status. */

var RAW_API_BASES = { data: YT_API, analytics: YT_ANALYTICS_API, reporting: YT_REPORTING_API };

function registerAdvancedTools_(tool) {
  tool(
    'youtube_api_request',
    {
      group: 'advanced',
      title: 'Raw YouTube API request',
      description:
        'Call any YouTube Data API v3, YouTube Analytics v2 or YouTube Reporting v1 endpoint directly, for features without a dedicated tool: activities, channelSections update, liveChatBans, liveChatModerators, superChatEvents, videoAbuseReportReasons, videos/reportAbuse, playlistImages, members, reporting jobs, and so on. Paths are relative, e.g. api=data path=activities query={"part":"snippet","mine":true}.',
      input: {
        api: sEnum_(['data', 'analytics', 'reporting'], 'data = youtube/v3 (default), analytics = youtubeAnalytics v2, reporting = youtubeReporting v1.'),
        method: sEnum_(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 'HTTP method. Default GET.'),
        path: sStr_('Endpoint path relative to the API root, e.g. activities, liveChat/bans, reports, jobs.'),
        query: sObj_('Query parameters as an object, e.g. {"part": "snippet", "mine": true}.'),
        body: sObj_('JSON request body for POST/PUT/PATCH.'),
      },
      required: ['path'],
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    function (args) {
      var base = RAW_API_BASES[args.api || 'data'];
      var path = String(args.path).trim().replace(/^\/+/, '');
      path = path.replace(/^youtube\/v3\//, '');
      if (!/^[A-Za-z0-9_\-\/.]+$/.test(path) || path.indexOf('..') >= 0) {
        throw toolError_('path must be a relative API path such as "activities" or "liveChat/bans" (no host, no query string).');
      }
      var method = args.method || 'GET';
      var opts = { query: args.query || {} };
      if (args.body && method !== 'GET' && method !== 'DELETE') opts.body = args.body;
      return gapi_(method, base + path, opts);
    }
  );

  tool(
    'list_i18n',
    {
      group: 'advanced',
      title: 'List languages / regions',
      description: 'Languages (for default_language, captions) or regions (for region_code) supported by YouTube.',
      input: {
        type: sEnum_(['languages', 'regions'], 'What to list.'),
        display_language: sStr_('Language for the names. Default en.'),
      },
      required: ['type'],
      annotations: ANN_READ,
    },
    function (args) {
      var endpoint = args.type === 'regions' ? 'i18nRegions' : 'i18nLanguages';
      var res = gapi_('GET', YT_API + endpoint, { query: { part: 'snippet', hl: args.display_language || 'en' } });
      return {
        items: (res.items || []).map(function (i) {
          return { code: i.snippet.gl || i.snippet.hl, name: i.snippet.name };
        }),
      };
    }
  );

  tool(
    'get_server_status',
    {
      group: 'advanced',
      title: 'Server status',
      description: 'Which channel this server acts as, the server version, enabled tool groups and any uploads in progress.',
      input: {},
      annotations: ANN_READ,
    },
    function (args, ctx) {
      var ch = getMyChannel_(true);
      var jobs = listJobs_();
      var worker = false;
      try {
        worker = ScriptApp.getProjectTriggers().some(function (t) {
          return t.getHandlerFunction() === WORKER_HANDLER;
        });
      } catch (e) {
        worker = null;
      }
      return dropEmpty_({
        server: MCP_SERVER_INFO,
        channel: { id: ch.id, title: ch.title, handle: ch.handle },
        groups: (ctx && ctx.groups) || TOOL_GROUPS,
        mode: ctx && ctx.readOnly ? 'readonly' : 'full',
        tools: listToolDefs_(ctx).length,
        uploads_in_progress: jobs.filter(function (j) {
          return ACTIVE_JOB_STATES.indexOf(j.status) >= 0;
        }).length,
        uploads_awaiting_client: jobs.filter(function (j) {
          return j.status === 'awaiting_client';
        }).length,
        background_worker_scheduled: worker,
        time_zone: Session.getScriptTimeZone(),
      });
    }
  );
}
