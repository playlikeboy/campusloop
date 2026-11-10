import type { McpToolDefinition } from "./types";

export const CAMPUSLOOP_MCP_TOOLS: McpToolDefinition[] = [
  // ─── 1. FEED & POSTS ────────────────────────────────────────────────────────
  {
    name: "campusloop_get_feed",
    description:
      "Fetch personalized campus feed posts for the authenticated student's institution or across all Indian colleges.",
    category: "Feed & Posts",
    inputSchema: {
      type: "object",
      properties: {
        scope: {
          type: "string",
          enum: ["CAMPUS", "GLOBAL"],
          description:
            "Feed scope: 'CAMPUS' restricts to student's college, 'GLOBAL' expands across all colleges in India. Defaults to CAMPUS.",
        },
        filter: {
          type: "string",
          enum: ["ALL", "CONFESSIONS", "POLLS", "MEMES", "TRENDING"],
          description: "Post type filter. Defaults to ALL.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Number of posts to return (1-50, default 20).",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_search_posts",
    description: "Search campus posts by query text, hashtags, or keywords with semantic relevance.",
    category: "Feed & Posts",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword or phrase (e.g. 'hackathon', 'hostel 4', 'placement stats').",
        },
        scope: {
          type: "string",
          enum: ["CAMPUS", "GLOBAL"],
          description: "Scope of search. Defaults to CAMPUS.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 30,
          description: "Max results to return (default 15).",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_post_details",
    description:
      "Get full details of a specific post including text, comments thread, votes count, and community tags.",
    category: "Feed & Posts",
    inputSchema: {
      type: "object",
      properties: {
        postId: {
          type: "string",
          description: "The unique ID of the post.",
        },
      },
      required: ["postId"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_create_post",
    description: "Publish a standard public post or announcement to the student's campus timeline.",
    category: "Feed & Posts",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Optional headline or post title.",
        },
        body: {
          type: "string",
          description: "Main content of the post (markdown supported).",
        },
        scope: {
          type: "string",
          enum: ["CAMPUS", "GLOBAL"],
          description: "Publishing scope: CAMPUS (default) or GLOBAL.",
        },
      },
      required: ["body"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_create_confession",
    description:
      "Publish an anonymous confession protected by one-way HMAC identity vault and automated PII scrubbing.",
    category: "Feed & Posts",
    inputSchema: {
      type: "object",
      properties: {
        body: {
          type: "string",
          description:
            "Confession text. Do NOT include real phone numbers, hostel room numbers, or personal doxxing.",
        },
        title: {
          type: "string",
          description: "Optional confession title or subject.",
        },
        pseudonym: {
          type: "string",
          description:
            "Optional custom anonymous alias handle (e.g. 'midnight_coder', 'hostel_philosopher').",
        },
      },
      required: ["body"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_create_poll",
    description: "Create an interactive campus voting poll with 2 to 6 choices.",
    category: "Feed & Posts",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Poll question or topic.",
        },
        options: {
          type: "array",
          items: { type: "string" },
          description: "Array of 2 to 6 poll answer choices.",
        },
        body: {
          type: "string",
          description: "Optional additional context or explanation.",
        },
      },
      required: ["question", "options"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_vote_post",
    description: "Upvote or downvote a post on CampusLoop.",
    category: "Feed & Posts",
    inputSchema: {
      type: "object",
      properties: {
        postId: {
          type: "string",
          description: "The unique ID of the post to vote on.",
        },
        direction: {
          type: "string",
          enum: ["UP", "DOWN", "REMOVE"],
          description: "Vote direction: UP (+1), DOWN (-1), or REMOVE (0).",
        },
      },
      required: ["postId", "direction"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_add_comment",
    description: "Add a comment or reply to an existing campus post.",
    category: "Feed & Posts",
    inputSchema: {
      type: "object",
      properties: {
        postId: {
          type: "string",
          description: "The unique ID of the post to comment on.",
        },
        body: {
          type: "string",
          description: "The text of the comment.",
        },
        parentId: {
          type: "string",
          description: "Optional parent comment ID if replying to an existing comment.",
        },
        isAnonymous: {
          type: "boolean",
          description: "Set to true to post comment pseudonymously. Defaults to false.",
        },
      },
      required: ["postId", "body"],
      additionalProperties: false,
    },
  },

  // ─── 2. DIRECT MESSAGING & CHAT ─────────────────────────────────────────────
  {
    name: "campusloop_list_chats",
    description:
      "List the student's recent direct message conversations with unread message counts and last message previews.",
    category: "Direct Messaging",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 30,
          description: "Max conversations to return (default 15).",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_chat_history",
    description: "Get recent messages in a direct conversation with another verified student.",
    category: "Direct Messaging",
    inputSchema: {
      type: "object",
      properties: {
        conversationId: {
          type: "string",
          description: "The unique conversation ID.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Number of messages to retrieve (default 25).",
        },
      },
      required: ["conversationId"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_send_direct_message",
    description: "Send a direct chat message to an existing conversation on CampusLoop.",
    category: "Direct Messaging",
    inputSchema: {
      type: "object",
      properties: {
        conversationId: {
          type: "string",
          description: "The conversation ID to send into.",
        },
        content: {
          type: "string",
          description: "Message text content.",
        },
      },
      required: ["conversationId", "content"],
      additionalProperties: false,
    },
  },

  // ─── 3. COMMUNITIES & CLUBS ─────────────────────────────────────────────────
  {
    name: "campusloop_list_communities",
    description: "List student communities, clubs, and technical societies visible to the student.",
    category: "Communities & Clubs",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          enum: ["JOINED", "ALL", "CAMPUS_ONLY"],
          description: "Filter: JOINED (clubs user is in), ALL (explore all), CAMPUS_ONLY. Defaults to ALL.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 30,
          description: "Number of communities to return (default 20).",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_community",
    description: "Get details, member count, rules, points, and recent posts for a specific community.",
    category: "Communities & Clubs",
    inputSchema: {
      type: "object",
      properties: {
        communityIdOrSlug: {
          type: "string",
          description: "The community ID or slug (e.g. 'coding-club', 'acm-chapter').",
        },
      },
      required: ["communityIdOrSlug"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_post_to_community",
    description: "Publish a post or discussion directly into a specific community/club feed.",
    category: "Communities & Clubs",
    inputSchema: {
      type: "object",
      properties: {
        communityId: {
          type: "string",
          description: "The target community ID.",
        },
        body: {
          type: "string",
          description: "Post body text.",
        },
        title: {
          type: "string",
          description: "Optional post title.",
        },
      },
      required: ["communityId", "body"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_join_leave_community",
    description: "Join or leave a campus community or club.",
    category: "Communities & Clubs",
    inputSchema: {
      type: "object",
      properties: {
        communityId: {
          type: "string",
          description: "The community ID to join or leave.",
        },
        action: {
          type: "string",
          enum: ["JOIN", "LEAVE"],
          description: "Action: JOIN or LEAVE.",
        },
      },
      required: ["communityId", "action"],
      additionalProperties: false,
    },
  },

  // ─── 4. ACADEMICS & NOTES VAULT ─────────────────────────────────────────────
  {
    name: "campusloop_search_academic_notes",
    description:
      "Search verified academic notes, Previous Year Questions (PYQs), lab manuals, and study guides by branch, subject, or semester.",
    category: "Academics & Vault",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Subject, professor name, or topic (e.g. 'Operating Systems', 'Data Structures', 'Fourier Transform').",
        },
        category: {
          type: "string",
          enum: ["ALL", "NOTES", "PYQ", "LAB_MANUAL", "SYLLABUS", "CHEATSHEET"],
          description: "Resource category filter. Defaults to ALL.",
        },
        semester: {
          type: "string",
          description: "Optional semester filter (e.g. 'Semester 3', 'Semester 5').",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 20,
          description: "Max results (default 10).",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_note_details",
    description: "Get full academic resource details, download link, syllabus mapping, and student ratings.",
    category: "Academics & Vault",
    inputSchema: {
      type: "object",
      properties: {
        resourceId: {
          type: "string",
          description: "Unique ID of the academic resource.",
        },
      },
      required: ["resourceId"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_upload_academic_note",
    description:
      "Submit a new study resource, Google Drive link, or PDF notes to the campus academic vault (+20 LP reward).",
    category: "Academics & Vault",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the note (e.g. 'CS301 Compiler Design Complete Notes 2026').",
        },
        subject: {
          type: "string",
          description: "Subject / course name.",
        },
        category: {
          type: "string",
          enum: ["NOTES", "PYQ", "LAB_MANUAL", "CHEATSHEET", "SYLLABUS"],
          description: "Type of resource.",
        },
        url: {
          type: "string",
          description: "Google Drive, Notion, or download URL of the resource.",
        },
        semester: {
          type: "string",
          description: "Target semester (e.g. 'Semester 4').",
        },
        description: {
          type: "string",
          description: "Brief summary of contents.",
        },
      },
      required: ["title", "subject", "category", "url"],
      additionalProperties: false,
    },
  },

  // ─── 5. COLLEGES & CAMPUSES ─────────────────────────────────────────────────
  {
    name: "campusloop_search_colleges",
    description:
      "Search Indian colleges, institutes and universities in the CampusLoop directory.",
    category: "Colleges & Campuses",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "College name, acronym, or city (e.g. 'BITS Pilani', 'IIT Bombay', 'VIT', 'Delhi').",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 20,
          description: "Number of colleges to return (default 10).",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_college_pulse",
    description: "Get real-time pulse, member stats, trending topics, and top recent posts for any college.",
    category: "Colleges & Campuses",
    inputSchema: {
      type: "object",
      properties: {
        collegeIdOrSlug: {
          type: "string",
          description:
            "College ID or slug (e.g. 'iit-bombay', 'bits-pilani'). If omitted, uses authenticated student's college.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },

  // ─── 6. PROFILE & LOOP POINTS ───────────────────────────────────────────────
  {
    name: "campusloop_get_my_profile",
    description:
      "Get the authenticated student's complete profile, college, branch, role, Loop Points (LP) clout balance, and status.",
    category: "Profile & Loop Points",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_user_profile",
    description: "Get the public profile of any verified campus student by their username.",
    category: "Profile & Loop Points",
    inputSchema: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "Student username (e.g. 'shaswat' or '@shaswat').",
        },
      },
      required: ["username"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_loop_points_history",
    description: "View the student's Loop Points (LP) balance, clout level, and unlockable platform badges.",
    category: "Profile & Loop Points",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },

  // ─── 7. STORIES & VIBES ─────────────────────────────────────────────────────
  {
    name: "campusloop_get_campus_stories",
    description: "Fetch active 24-hour campus stories/vibes from verified peers and friends.",
    category: "Stories & Vibes",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_post_story",
    description: "Publish a new 24-hour visual campus vibe story.",
    category: "Stories & Vibes",
    inputSchema: {
      type: "object",
      properties: {
        mediaUrl: {
          type: "string",
          description: "Public image or video URL for the story.",
        },
        caption: {
          type: "string",
          description: "Optional caption text.",
        },
        musicTrack: {
          type: "string",
          description: "Optional background music title or track name.",
        },
      },
      required: ["mediaUrl"],
      additionalProperties: false,
    },
  },

  // ─── 8. EXCLUSIVE AI & AGENT POWER FEATURES ─────────────────────────────────
  {
    name: "campusloop_generate_campus_digest",
    description:
      "EXCLUSIVE AI FEATURE: Synthesize today's top campus discussions, confessions, placement updates, upcoming fests, and memes into an executive campus morning briefing.",
    category: "Exclusive AI & Intelligence",
    inputSchema: {
      type: "object",
      properties: {
        scope: {
          type: "string",
          enum: ["CAMPUS", "GLOBAL"],
          description:
            "Scope of the digest: student's own campus (CAMPUS) or pan-India (GLOBAL). Defaults to CAMPUS.",
        },
        focusArea: {
          type: "string",
          enum: ["GENERAL", "ACADEMICS_PLACEMENTS", "CONFESSIONS_GOSSIP", "EVENTS_HACKATHONS"],
          description: "Focus filter for the synthesized digest. Defaults to GENERAL.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_ask_academic_tutor",
    description:
      "EXCLUSIVE AI FEATURE: An intelligent campus tutor that answers exam questions, explains difficult formulas, and synthesizes study concepts grounded in verified notes from the student's college vault.",
    category: "Exclusive AI & Intelligence",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Academic question or conceptual topic to solve/explain.",
        },
        subject: {
          type: "string",
          description: "Target subject (e.g. 'Operating Systems', 'Calculus', 'Digital Electronics').",
        },
      },
      required: ["question"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_audit_post_safety",
    description:
      "EXCLUSIVE AI FEATURE: Doxx-Shield Preflight Check. Analyzes a draft post for accidental phone numbers, hostel room numbers, personal emails, or confidential placement disclosures before publishing.",
    category: "Exclusive AI & Intelligence",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Draft post content to audit.",
        },
        title: {
          type: "string",
          description: "Optional draft title.",
        },
      },
      required: ["text"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_dating_vibe_compatibility",
    description:
      "EXCLUSIVE AI FEATURE: Calculates multi-dimensional campus compatibility between the student and a target profile based on shared interests, branch, campus vibe, and activity vectors.",
    category: "Exclusive AI & Intelligence",
    inputSchema: {
      type: "object",
      properties: {
        targetUsername: {
          type: "string",
          description: "Target student's username to compute compatibility with.",
        },
      },
      required: ["targetUsername"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_trigger_community_webhook",
    description:
      "EXCLUSIVE AGENT FEATURE: Programmatically trigger an inbound webhook to publish an automated alert, GitHub release, or bot announcement into a community managed by the student.",
    category: "Exclusive AI & Intelligence",
    inputSchema: {
      type: "object",
      properties: {
        communityId: {
          type: "string",
          description: "The community ID.",
        },
        body: {
          type: "string",
          description: "Announcement text.",
        },
        title: {
          type: "string",
          description: "Optional announcement title.",
        },
        botName: {
          type: "string",
          description: "Display name for the bot (e.g. 'IDE Agent', 'Cursor Agent').",
        },
      },
      required: ["communityId", "body"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_campus_sentiment_pulse",
    description:
      "EXCLUSIVE AI FEATURE: Evaluates real-time campus mood and sentiment analysis across recent posts (exam pressure, fest excitement, hostel food satisfaction, placement climate).",
    category: "Exclusive AI & Intelligence",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },

  // ─── 8. EVENTS & OPPORTUNITIES ──────────────────────────────────────────────
  {
    name: "campusloop_get_events",
    description: "Fetch upcoming and active campus events, hackathons, workshops, cultural fests, and competitions.",
    category: "Events & Opportunities",
    inputSchema: {
      type: "object",
      properties: {
        scope: {
          type: "string",
          enum: ["CAMPUS", "GLOBAL"],
          description: "Scope of events: student's institution only ('CAMPUS') or all Indian universities ('GLOBAL'). Defaults to CAMPUS.",
        },
        type: {
          type: "string",
          enum: ["ALL", "HACKATHON", "WORKSHOP", "CULTURAL", "SPORTS", "SEMINAR", "FEST", "MEETUP", "COMPETITION"],
          description: "Filter by event category. Defaults to ALL.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Max number of events to return (default 20).",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_event_details",
    description: "Get comprehensive details of a specific campus event including dates, venue, organizers, and perks.",
    category: "Events & Opportunities",
    inputSchema: {
      type: "object",
      properties: {
        eventIdOrSlug: {
          type: "string",
          description: "The unique event ID or URL slug.",
        },
      },
      required: ["eventIdOrSlug"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_create_event",
    description: "Publish a new campus event, hackathon, workshop, or club meetup on CampusLoop.",
    category: "Events & Opportunities",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the event.",
        },
        description: {
          type: "string",
          description: "Full description, rules, agenda, and guidelines.",
        },
        clubName: {
          type: "string",
          description: "Hosting club, society, or organization name.",
        },
        eventType: {
          type: "string",
          enum: ["HACKATHON", "WORKSHOP", "CULTURAL", "SPORTS", "SEMINAR", "FEST", "MEETUP", "COMPETITION"],
          description: "Category of the event.",
        },
        mode: {
          type: "string",
          enum: ["OFFLINE", "ONLINE", "HYBRID"],
          description: "Event modality.",
        },
        venue: {
          type: "string",
          description: "Physical venue or hall (e.g. 'CAT Hall 2' or 'Auditorium').",
        },
        startDate: {
          type: "string",
          description: "Start timestamp in ISO 8601 format (e.g. '2026-11-01T10:00:00Z').",
        },
        endDate: {
          type: "string",
          description: "End timestamp in ISO 8601 format (e.g. '2026-11-02T18:00:00Z').",
        },
        entryFee: {
          type: "string",
          description: "Entry fee or 'Free'. Defaults to 'Free'.",
        },
      },
      required: ["title", "description", "clubName", "eventType", "startDate", "endDate"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_register_event",
    description: "Register or RSVP the authenticated student for an event or hackathon.",
    category: "Events & Opportunities",
    inputSchema: {
      type: "object",
      properties: {
        eventId: {
          type: "string",
          description: "The event ID to register for.",
        },
      },
      required: ["eventId"],
      additionalProperties: false,
    },
  },

  // ─── 9. ARTICLES & JOURNALISM ──────────────────────────────────────────────
  {
    name: "campusloop_get_articles",
    description: "Fetch campus articles, student editorials, placement experiences, tech deep-dives, and campus guides.",
    category: "Articles & Editorial",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Category filter (e.g. 'TECH_AND_CODE', 'PLACEMENTS', 'CAMPUS_LIFE', 'GUIDES'). Defaults to all.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Number of articles to fetch (default 20).",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_article_details",
    description: "Get full article content markdown, author info, claps/upvotes, and metadata.",
    category: "Articles & Editorial",
    inputSchema: {
      type: "object",
      properties: {
        articleIdOrSlug: {
          type: "string",
          description: "The article unique ID or URL slug.",
        },
      },
      required: ["articleIdOrSlug"],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_publish_article",
    description: "Publish a new student article or placement guide on CampusLoop.",
    category: "Articles & Editorial",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Article headline.",
        },
        content: {
          type: "string",
          description: "Full markdown content of the article.",
        },
        category: {
          type: "string",
          description: "Article category (e.g. 'TECH_AND_CODE', 'PLACEMENTS', 'CAMPUS_LIFE', 'GUIDES'). Defaults to 'GENERAL'.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for indexing (e.g. ['leetcode', 'faang', 'internship']).",
        },
        subtitle: {
          type: "string",
          description: "Optional secondary headline.",
        },
      },
      required: ["title", "content"],
      additionalProperties: false,
    },
  },

  // ─── 10. STREAKS & HEATMAP ─────────────────────────────────────────────────
  {
    name: "campusloop_get_streaks",
    description: "Fetch streak statistics, current streak count, longest streak, safe status today, and annual activity heatmap dates.",
    category: "Streaks & Clout",
    inputSchema: {
      type: "object",
      properties: {
        profileId: {
          type: "string",
          description: "Optional profile ID. Defaults to authenticated student.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_record_streak_activity",
    description: "Qualify today's streak run by recording a daily campus activity (e.g. posting, reading notes, voting).",
    category: "Streaks & Clout",
    inputSchema: {
      type: "object",
      properties: {
        eventType: {
          type: "string",
          enum: ["POST_CREATE", "POLL_VOTE", "COMMENT_CREATE", "ACADEMIC_UPLOAD", "DAILY_MISSION_COMPLETE"],
          description: "Type of campus activity. Defaults to DAILY_MISSION_COMPLETE.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },

  // ─── 11. COURSES & PLAYLISTS ───────────────────────────────────────────────
  {
    name: "campusloop_get_courses",
    description: "Browse curated video courses across CSE, ECE, EEE, Business, MBA, and Mathematics.",
    category: "Academics & Vault",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Course category (e.g. 'Computer Science', 'Business', 'ECE', 'Mathematics').",
        },
        query: {
          type: "string",
          description: "Search keyword in course title or description.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Max results to return (default 20).",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "campusloop_get_course_details",
    description: "Fetch course syllabus, curriculum sections, and video lectures.",
    category: "Academics & Vault",
    inputSchema: {
      type: "object",
      properties: {
        courseIdOrSlug: {
          type: "string",
          description: "The course ID or URL slug.",
        },
      },
      required: ["courseIdOrSlug"],
      additionalProperties: false,
    },
  },
];
