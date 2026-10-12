import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, institutions, userProfiles } from "@/db/schema";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-api-key, X-API-KEY, x-campusloop-mcp-key, x-mcp-key",
};

const nanoid = (len = 12) => randomUUID().replace(/-/g, "").slice(0, len);

/**
 * Authenticates whether the request includes the valid MCP API key.
 * Checks URL query params (?apikey= or ?api_key=), headers (x-api-key, x-mcp-key),
 * or Bearer authorization.
 * Key value is strictly read from environment variables to prevent leaking into codebase.
 */
function verifyApiKey(req: Request): boolean {
  const configuredKey =
    process.env.MCP_EVENTS_API_KEY ||
    process.env.MCP_API_KEY ||
    process.env.CAMPUSLOOP_MCP_API_KEY;

  if (!configuredKey || configuredKey.trim() === "") {
    return false;
  }

  const url = new URL(req.url);
  const queryKey =
    url.searchParams.get("apikey") ||
    url.searchParams.get("api_key") ||
    url.searchParams.get("key");

  const headerKey =
    req.headers.get("x-api-key") ||
    req.headers.get("X-API-KEY") ||
    req.headers.get("x-mcp-key") ||
    req.headers.get("x-campusloop-mcp-key");

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const bearerKey = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const candidateKey = (queryKey || headerKey || bearerKey || "").trim();
  if (!candidateKey) return false;

  return candidateKey === configuredKey.trim();
}

/**
 * Resolves or falls back to an existing institution and organizer profile in the database.
 * Prevents foreign key constraint violations when remote events are ingested via API/MCP.
 */
async function resolveOrganizerAndInstitution(
  db: ReturnType<typeof getDb>,
  requestedOrganizerId?: string,
  requestedInstitutionId?: string
) {
  let institutionId = requestedInstitutionId;
  if (institutionId) {
    const inst = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId),
      columns: { id: true },
    });
    if (!inst) institutionId = undefined;
  }

  if (!institutionId) {
    const firstInst = await db.query.institutions.findFirst({
      columns: { id: true },
    });
    institutionId = firstInst?.id;
  }

  let organizerProfileId = requestedOrganizerId;
  if (organizerProfileId) {
    const prof = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, organizerProfileId),
      columns: { id: true, institutionId: true },
    });
    if (!prof) {
      organizerProfileId = undefined;
    } else if (!institutionId) {
      institutionId = prof.institutionId;
    }
  }

  if (!organizerProfileId) {
    const adminProf = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.role, "ADMIN"),
      columns: { id: true, institutionId: true },
    });
    if (adminProf) {
      organizerProfileId = adminProf.id;
      if (!institutionId) institutionId = adminProf.institutionId;
    } else {
      const anyProf = await db.query.userProfiles.findFirst({
        columns: { id: true, institutionId: true },
      });
      organizerProfileId = anyProf?.id;
      if (!institutionId && anyProf?.institutionId) {
        institutionId = anyProf.institutionId;
      }
    }
  }

  return { organizerProfileId, institutionId };
}

// MCP Tools Catalog for Model Context Protocol consumers
const MCP_EVENT_TOOLS = [
  {
    name: "list_events",
    description:
      "List and search college campus events, remote hackathons, virtual workshops, and internship opportunities across CampusLoop.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for title, club, or description" },
        mode: {
          type: "string",
          enum: ["ALL", "ONLINE", "HYBRID", "OFFLINE"],
          description: "Filter by mode: ONLINE (Remote), OFFLINE, HYBRID, or ALL",
        },
        category: {
          type: "string",
          enum: [
            "ALL",
            "HACKATHON",
            "WORKSHOP",
            "COMPETITION",
            "SEMINAR",
            "MEETUP",
            "CULTURAL",
            "SPORTS",
            "FEST",
          ],
          description: "Filter by category or event type",
        },
        remoteOnly: { type: "boolean", description: "Set true to strictly fetch remote/online opportunities" },
        limit: { type: "number", description: "Maximum number of events to return (default 20, max 100)" },
      },
    },
  },
  {
    name: "get_event",
    description: "Retrieve comprehensive details, rules, registration URL, and perks for a specific event by ID or slug.",
    inputSchema: {
      type: "object",
      properties: {
        idOrSlug: { type: "string", description: "Event ID (event_...) or URL slug" },
      },
      required: ["idOrSlug"],
    },
  },
  {
    name: "create_remote_event",
    description:
      "Create and publish a new remote hackathon, webinar, fellowship, competition, or student opportunity on CampusLoop. (Requires API key).",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event or Opportunity Title" },
        description: { type: "string", description: "Detailed description of the opportunity" },
        tagline: { type: "string", description: "Short catchy subtitle or headline" },
        clubName: {
          type: "string",
          description: "Name of the organizing company, club, or community (e.g. 'Google Developer Groups', 'Devfolio', 'MLH')",
        },
        eventType: {
          type: "string",
          enum: [
            "HACKATHON",
            "WORKSHOP",
            "COMPETITION",
            "SEMINAR",
            "MEETUP",
            "CULTURAL",
            "SPORTS",
            "FEST",
          ],
          description: "Type of event (default: HACKATHON)",
        },
        mode: {
          type: "string",
          enum: ["ONLINE", "HYBRID", "OFFLINE"],
          description: "Mode (default: ONLINE for remote opportunities)",
        },
        externalUrl: {
          type: "string",
          description: "External registration or project submission URL (e.g. Devfolio, Unstop, Google Form, Luma)",
        },
        venue: {
          type: "string",
          description: "Venue description (e.g. 'Remote (Discord / Zoom)', 'Online')",
        },
        startDate: { type: "string", description: "Start date (ISO-8601 string or YYYY-MM-DD)" },
        endDate: { type: "string", description: "End date (ISO-8601 string or YYYY-MM-DD)" },
        registrationDeadline: {
          type: "string",
          description: "Last date to apply or register (ISO-8601 or YYYY-MM-DD)",
        },
        prizesDescription: {
          type: "string",
          description: "Prizes, cash pool, swags, or perks (e.g. '₹1,00,000 Cash Pool + Free Swag')",
        },
        perks: {
          type: "array",
          items: { type: "string" },
          description: "List of perks (e.g. ['Certificates', 'Cash Prizes', 'Internships', 'Loop Points'])",
        },
        loopPointsReward: {
          type: "number",
          description: "Loop Points awarded to registered students upon participation (default: 30)",
        },
        isPaid: { type: "boolean", description: "Whether participation requires an entry fee (default: false)" },
        entryFee: { type: "string", description: "Fee description (default: 'Free')" },
        bannerUrl: { type: "string", description: "Public image URL for event banner" },
        status: { type: "string", enum: ["PUBLISHED", "DRAFT"], description: "Publication status (default: PUBLISHED)" },
      },
      required: ["title", "description"],
    },
  },
  {
    name: "update_event",
    description: "Update details, deadlines, prizes, or links of an existing event. (Requires API key).",
    inputSchema: {
      type: "object",
      properties: {
        idOrSlug: { type: "string", description: "Event ID or slug to update" },
        title: { type: "string", description: "New title" },
        description: { type: "string", description: "New description" },
        tagline: { type: "string", description: "New tagline" },
        externalUrl: { type: "string", description: "New external registration URL" },
        startDate: { type: "string", description: "New start date" },
        endDate: { type: "string", description: "New end date" },
        registrationDeadline: { type: "string", description: "New deadline" },
        prizesDescription: { type: "string", description: "Updated prizes" },
        status: { type: "string", enum: ["PUBLISHED", "DRAFT", "COMPLETED", "CANCELLED"] },
      },
      required: ["idOrSlug"],
    },
  },
  {
    name: "delete_event",
    description: "Delete or cancel an event by ID or slug. (Requires API key).",
    inputSchema: {
      type: "object",
      properties: {
        idOrSlug: { type: "string", description: "Event ID or slug to remove" },
      },
      required: ["idOrSlug"],
    },
  },
  {
    name: "get_event_categories",
    description: "Get allowed event categories, modes, statuses, and schema rules for CampusLoop events.",
    inputSchema: { type: "object", properties: {} },
  },
];

const OPENAI_FUNCTION_TOOLS = MCP_EVENT_TOOLS.map((t) => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.inputSchema,
  },
}));

const CAMPUSLOOP_EVENTS_OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "CampusLoop Remote Events & Campus Opportunities",
    version: "1.0.0",
    description:
      "Authoritative OpenAPI 3.1 & MCP engine for CampusLoop. Discover campus hackathons and add remote opportunities programmatically to student feeds across India.",
  },
  servers: [{ url: "https://campusloop.space", description: "CampusLoop Production" }],
  paths: {
    "/mcp/events": {
      get: {
        operationId: "list_events",
        summary: "List campus events and remote opportunities",
        description:
          "Fetch active events, hackathons, workshops, and competitions. Filter by remote, mode, category, or search query.",
        parameters: [
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Search keyword for event title, club, or description",
          },
          {
            name: "mode",
            in: "query",
            schema: { type: "string", enum: ["ALL", "ONLINE", "HYBRID", "OFFLINE"] },
            description: "Filter by mode: ONLINE (Remote), OFFLINE, HYBRID, or ALL",
          },
          {
            name: "category",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "ALL",
                "HACKATHON",
                "WORKSHOP",
                "COMPETITION",
                "SEMINAR",
                "MEETUP",
                "CULTURAL",
                "SPORTS",
                "FEST",
              ],
            },
            description: "Filter by event category",
          },
          {
            name: "remote",
            in: "query",
            schema: { type: "boolean" },
            description: "Set to true to strictly fetch remote/virtual opportunities",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 30, maximum: 100 },
            description: "Number of events to retrieve",
          },
          {
            name: "apikey",
            in: "query",
            schema: { type: "string" },
            description: "Secret API key for superpowers and draft views",
          },
        ],
        responses: {
          "200": {
            description: "Events retrieved successfully",
          },
        },
      },
      post: {
        operationId: "create_remote_event",
        summary: "Create and publish a remote event, hackathon, or student opportunity",
        description:
          "Publish a remote opportunity (Devfolio, Unstop, MLH hackathon, fellowship, virtual workshop) to 1,350+ campus feeds across India.",
        parameters: [
          {
            name: "apikey",
            in: "query",
            schema: { type: "string" },
            description: "Secret API key for authorization",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description"],
                properties: {
                  title: { type: "string", description: "Title of the hackathon or event" },
                  description: { type: "string", description: "Full description of rules and tracks" },
                  tagline: { type: "string", description: "Short catchy subtitle" },
                  clubName: {
                    type: "string",
                    description: "Host/Organizer name (e.g. Google Developer Groups, Devfolio)",
                  },
                  eventType: {
                    type: "string",
                    enum: [
                      "HACKATHON",
                      "WORKSHOP",
                      "COMPETITION",
                      "SEMINAR",
                      "MEETUP",
                      "CULTURAL",
                      "SPORTS",
                      "FEST",
                    ],
                    default: "HACKATHON",
                  },
                  mode: {
                    type: "string",
                    enum: ["ONLINE", "HYBRID", "OFFLINE"],
                    default: "ONLINE",
                  },
                  externalUrl: {
                    type: "string",
                    description: "External registration URL (Devfolio, Unstop, Google Form, Luma)",
                  },
                  venue: { type: "string", description: "Venue (e.g. Remote / Discord, Online)" },
                  startDate: { type: "string", description: "Start date (YYYY-MM-DD or ISO-8601)" },
                  endDate: { type: "string", description: "End date (YYYY-MM-DD or ISO-8601)" },
                  registrationDeadline: { type: "string", description: "Application deadline" },
                  prizesDescription: {
                    type: "string",
                    description: "Cash prizes, swags, or goodies description",
                  },
                  perks: {
                    type: "array",
                    items: { type: "string" },
                    description: "Perks list (e.g. ['Cash Prizes', 'Swags', 'Loop Points'])",
                  },
                  loopPointsReward: { type: "integer", default: 30 },
                  isPaid: { type: "boolean", default: false },
                  entryFee: { type: "string", default: "Free" },
                  bannerUrl: { type: "string", description: "Event banner image URL" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Remote event successfully published on CampusLoop",
          },
          "401": {
            description: "Unauthorized - API key missing or invalid",
          },
        },
      },
      put: {
        operationId: "update_event",
        summary: "Update event details or extend deadlines",
        description: "Modify an existing event's title, description, deadline, or registration links.",
        parameters: [
          {
            name: "apikey",
            in: "query",
            schema: { type: "string" },
            description: "Secret API key",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idOrSlug"],
                properties: {
                  idOrSlug: { type: "string", description: "Event ID or slug" },
                  title: { type: "string" },
                  description: { type: "string" },
                  tagline: { type: "string" },
                  externalUrl: { type: "string" },
                  registrationDeadline: { type: "string" },
                  prizesDescription: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["PUBLISHED", "DRAFT", "COMPLETED", "CANCELLED"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Event updated successfully" },
          "401": { description: "Unauthorized" },
        },
      },
      delete: {
        operationId: "delete_event",
        summary: "Delete or cancel an event",
        description: "Remove an event by ID or slug.",
        parameters: [
          {
            name: "id",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Event ID or slug to delete",
          },
          {
            name: "apikey",
            in: "query",
            schema: { type: "string" },
            description: "Secret API key",
          },
        ],
        responses: {
          "200": { description: "Event deleted successfully" },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyQuery: {
        type: "apiKey",
        in: "query",
        name: "apikey",
        description: "Pass as ?apikey=YOUR_KEY query parameter",
      },
      ApiKeyHeader: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "Pass as x-api-key header",
      },
    },
  },
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /mcp/events
 * Supports:
 * - Unauthenticated: Reading and listing public events, remote opportunities, schema, and MCP tool catalog.
 * - Authenticated (?apikey=...): Includes admin metrics, draft events, and management status.
 * - HTML View: Rich developer documentation with curl snippets, schema explorer, and Claude/Cursor configs.
 */
export async function GET(req: Request) {
  try {
    const db = getDb();
    const url = new URL(req.url);
    const isAuthenticated = verifyApiKey(req);

    const accept = req.headers.get("accept") || "";
    const format = url.searchParams.get("format");
    const hasExplicitApiKey =
      url.searchParams.has("apikey") ||
      url.searchParams.has("api_key") ||
      Boolean(req.headers.get("x-api-key")) ||
      Boolean(req.headers.get("x-mcp-key"));

    // SSE support for MCP clients (Composio, Cursor, Cline, Claude Desktop)
    if (accept.includes("text/event-stream") || url.searchParams.get("transport") === "sse") {
      const sessionId = randomUUID();
      const endpointUrl = `/mcp/events?sessionId=${sessionId}${hasExplicitApiKey ? `&apikey=${url.searchParams.get("apikey") || url.searchParams.get("api_key") || ""}` : ""}`;
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpointUrl}\n\n`));
          const timer = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
            } catch {
              clearInterval(timer);
            }
          }, 20000);
          req.signal.addEventListener("abort", () => clearInterval(timer));
        },
      });
      return new NextResponse(stream, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    if (format === "openapi" || url.searchParams.get("spec") === "openapi") {
      return NextResponse.json(CAMPUSLOOP_EVENTS_OPENAPI_SPEC, {
        headers: CORS_HEADERS,
      });
    }

    // Only render HTML if human browser visit with no API key and accept text/html
    const isHtmlRequest =
      !hasExplicitApiKey &&
      format !== "json" &&
      format !== "openapi" &&
      !url.searchParams.has("spec") &&
      accept.includes("text/html") &&
      !accept.includes("application/json") &&
      !accept.includes("text/event-stream");

    const eventId = url.searchParams.get("id");
    const eventSlug = url.searchParams.get("slug");
    const singleLookup = eventId || eventSlug;

    // Single Event Detail Fetch
    if (singleLookup) {
      const event = await db.query.events.findFirst({
        where: or(eq(events.id, singleLookup), eq(events.slug, singleLookup)),
        with: {
          institution: true,
          organizer: true,
        },
      });

      if (!event) {
        return NextResponse.json(
          { error: "Event not found", lookup: singleLookup },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      return NextResponse.json(
        {
          event: formatEventOutput(event),
          authenticated: isAuthenticated,
        },
        { headers: CORS_HEADERS }
      );
    }

    // List Events Filter Parameters
    const query = url.searchParams.get("q") || url.searchParams.get("query") || "";
    const mode = (url.searchParams.get("mode") || "ALL").toUpperCase();
    const category = (url.searchParams.get("category") || "ALL").toUpperCase();
    const remoteOnly = url.searchParams.get("remote") === "true";
    const statusParam = (url.searchParams.get("status") || "PUBLISHED").toUpperCase();
    const limit = Math.min(Math.max(1, Number(url.searchParams.get("limit")) || 30), 100);

    const conditions = [];

    if (remoteOnly) {
      conditions.push(eq(events.mode, "ONLINE"));
    } else if (mode !== "ALL") {
      conditions.push(eq(events.mode, mode));
    }

    if (category !== "ALL") {
      conditions.push(eq(events.eventType, category));
    }

    if (!isAuthenticated) {
      // Unauthenticated viewers only see PUBLISHED and PUBLIC events
      conditions.push(eq(events.status, "PUBLISHED"));
      conditions.push(eq(events.visibility, "PUBLIC"));
    } else if (statusParam !== "ALL") {
      conditions.push(eq(events.status, statusParam));
    }

    if (query.trim()) {
      const q = `%${query.trim()}%`;
      const searchCond = or(
        ilike(events.title, q),
        ilike(events.description, q),
        ilike(events.clubName, q),
        ilike(events.tagline, q)
      );
      if (searchCond) conditions.push(searchCond);
    }

    const eventList = await db.query.events.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(events.createdAt)],
      limit,
      with: {
        institution: {
          columns: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
    });

    const enrichedList = eventList.map(formatEventOutput);
    const remoteCount = enrichedList.filter((e) => e.mode === "ONLINE").length;
    const hackathonCount = enrichedList.filter((e) => e.eventType === "HACKATHON").length;

    // Return Developer Documentation HTML when requested via browser
    if (isHtmlRequest) {
      return new NextResponse(
        renderMcpEventsDocumentationHtml({
          isAuthenticated,
          events: enrichedList,
          remoteCount,
          tools: MCP_EVENT_TOOLS,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Default JSON Response (fully OpenAPI 3.1 & MCP compliant)
    return NextResponse.json(
      {
        ...CAMPUSLOOP_EVENTS_OPENAPI_SPEC,
        mcp: {
          name: "campusloop-events-mcp",
          version: "1.0.0",
          protocolVersion: "2024-11-05",
          description:
            "CampusLoop Model Context Protocol (MCP) & Remote Opportunities Engine. Read public events without auth. CRUD remote hackathons, workshops & opportunities with API key.",
          endpoint: "https://campusloop.space/mcp/events",
          auth: {
            authenticated: isAuthenticated,
            requiredForMutations: true,
            supportedMethods: ["Query Parameter (?apikey=...)", "Header (x-api-key)", "Authorization (Bearer ...)"],
          },
        },
        tools: MCP_EVENT_TOOLS,
        functions: OPENAI_FUNCTION_TOOLS,
        result: {
          tools: MCP_EVENT_TOOLS,
        },
        metrics: {
          totalReturned: enrichedList.length,
          remoteOnlineCount: remoteCount,
          hackathonsCount: hackathonCount,
        },
        events: enrichedList,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("GET /mcp/events error:", error);
    return NextResponse.json(
      { error: "Failed to process MCP events request", details: String(error?.message || error) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /mcp/events
 * Handles both:
 * 1. Standard Model Context Protocol (MCP) JSON-RPC requests (initialize, tools/list, tools/call)
 * 2. Direct REST API calls to create new remote events and opportunities (requires API key)
 */
export async function POST(req: Request) {
  try {
    const db = getDb();
    const isAuthenticated = verifyApiKey(req);
    const rawBody = await req.json().catch(() => null);

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const body = rawBody as Record<string, any>;

    // Case 1: Model Context Protocol (MCP) JSON-RPC Request
    if (body.jsonrpc === "2.0" || typeof body.method === "string") {
      return handleMcpJsonRpcRequest({
        req,
        body,
        db,
        isAuthenticated,
      });
    }

    // Case 2: Direct REST API Event Creation
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: "Unauthorized: Missing or invalid API key.",
          message:
            "Event creation requires authentication. Pass your API key via ?apikey=... query parameter, x-api-key header, or Authorization: Bearer <key>",
          documentation: "https://campusloop.space/mcp/events",
        },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const createResult = await executeCreateEvent(db, body);
    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const createdEvent = createResult.event;

    return NextResponse.json(
      {
        success: true,
        message: "Remote event successfully created on CampusLoop!",
        event: createdEvent,
        urls: {
          public: `https://campusloop.space/events/${createdEvent.slug}`,
          short: `https://campusloop.space/e/${createdEvent.slug}`,
        },
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("POST /mcp/events error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error?.message || error) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * PUT / PATCH /mcp/events
 * Update an existing event by ID or slug. Requires API key.
 */
export async function PUT(req: Request) {
  return handleEventUpdate(req);
}

export async function PATCH(req: Request) {
  return handleEventUpdate(req);
}

async function handleEventUpdate(req: Request) {
  try {
    if (!verifyApiKey(req)) {
      return NextResponse.json(
        {
          error: "Unauthorized: Valid API key required for updates.",
          hint: "Provide ?apikey=... query parameter, x-api-key header, or Authorization header.",
        },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const db = getDb();
    const url = new URL(req.url);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;

    const lookup = url.searchParams.get("id") || url.searchParams.get("slug") || body.id || body.slug || body.idOrSlug;
    if (!lookup) {
      return NextResponse.json(
        { error: "Event identifier (id or slug) is required to update an event." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const existing = await db.query.events.findFirst({
      where: or(eq(events.id, lookup), eq(events.slug, lookup)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Event not found", lookup },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.tagline !== undefined) updates.tagline = body.tagline?.trim() || null;
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.clubName !== undefined) updates.clubName = String(body.clubName).trim();
    if (body.bannerUrl !== undefined) updates.bannerUrl = body.bannerUrl || null;
    if (body.eventType !== undefined) updates.eventType = String(body.eventType).toUpperCase();
    if (body.mode !== undefined) updates.mode = String(body.mode).toUpperCase();
    if (body.venue !== undefined) updates.venue = body.venue?.trim() || null;
    if (body.externalUrl !== undefined || body.meetingUrl !== undefined) {
      updates.meetingUrl = (body.externalUrl || body.meetingUrl)?.trim() || null;
    }
    if (body.startDate !== undefined) updates.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updates.endDate = new Date(body.endDate);
    if (body.registrationDeadline !== undefined) {
      updates.registrationDeadline = body.registrationDeadline ? new Date(body.registrationDeadline) : null;
    }
    if (body.prizesDescription !== undefined) updates.prizesDescription = body.prizesDescription?.trim() || null;
    if (body.entryFee !== undefined) updates.entryFee = body.entryFee || "Free";
    if (body.isPaid !== undefined) updates.isPaid = Boolean(body.isPaid);
    if (body.perks !== undefined) updates.perks = Array.isArray(body.perks) ? body.perks : [body.perks];
    if (body.loopPointsReward !== undefined) updates.loopPointsReward = Number(body.loopPointsReward) || 30;
    if (body.status !== undefined) updates.status = String(body.status).toUpperCase();
    if (body.visibility !== undefined) updates.visibility = String(body.visibility).toUpperCase();

    const [updated] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, existing.id))
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Event successfully updated",
        event: formatEventOutput(updated),
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("PUT/PATCH /mcp/events error:", error);
    return NextResponse.json(
      { error: "Failed to update event", details: String(error?.message || error) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * DELETE /mcp/events
 * Deletes or cancels an event by ID or slug. Requires API key.
 */
export async function DELETE(req: Request) {
  try {
    if (!verifyApiKey(req)) {
      return NextResponse.json(
        {
          error: "Unauthorized: Valid API key required for deletion.",
          hint: "Provide ?apikey=... query parameter, x-api-key header, or Authorization header.",
        },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const db = getDb();
    const url = new URL(req.url);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const lookup = url.searchParams.get("id") || url.searchParams.get("slug") || body.id || body.slug || body.idOrSlug;

    if (!lookup) {
      return NextResponse.json(
        { error: "Event identifier (id or slug) is required for deletion." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const existing = await db.query.events.findFirst({
      where: or(eq(events.id, lookup), eq(events.slug, lookup)),
      columns: { id: true, title: true, slug: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Event not found", lookup },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    await db.delete(events).where(eq(events.id, existing.id));

    return NextResponse.json(
      {
        success: true,
        message: `Event '${existing.title}' (${existing.slug}) was deleted successfully.`,
        deletedId: existing.id,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("DELETE /mcp/events error:", error);
    return NextResponse.json(
      { error: "Failed to delete event", details: String(error?.message || error) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * Handles standard Model Context Protocol (MCP) JSON-RPC calls
 */
async function handleMcpJsonRpcRequest({
  req,
  body,
  db,
  isAuthenticated,
}: {
  req: Request;
  body: any;
  db: ReturnType<typeof getDb>;
  isAuthenticated: boolean;
}) {
  const { id = null, method, params = {} } = body;

  switch (method) {
    case "initialize":
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
            },
            serverInfo: {
              name: "campusloop-events-mcp",
              version: "1.0.0",
              description: "Authoritative MCP Server for Remote Events & Campus Opportunities",
            },
          },
        },
        { headers: CORS_HEADERS }
      );

    case "tools/list":
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            tools: MCP_EVENT_TOOLS,
          },
        },
        { headers: CORS_HEADERS }
      );

    case "tools/call": {
      const toolName = params.name || params.tool;
      const args = params.arguments || params.args || {};

      // Mutation tools require API key
      if (["create_remote_event", "update_event", "delete_event"].includes(toolName)) {
        if (!isAuthenticated) {
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              result: {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: `Error: Tool '${toolName}' modifies event data and requires authentication. Pass ?apikey=... query parameter or x-api-key header.`,
                  },
                ],
              },
            },
            { headers: CORS_HEADERS }
          );
        }
      }

      try {
        let toolOutput: any;

        if (toolName === "list_events") {
          const limit = Math.min(Math.max(1, Number(args.limit) || 20), 100);
          const conditions = [eq(events.status, "PUBLISHED")];
          if (args.remoteOnly || args.mode === "ONLINE") {
            conditions.push(eq(events.mode, "ONLINE"));
          } else if (args.mode && args.mode !== "ALL") {
            conditions.push(eq(events.mode, args.mode));
          }
          if (args.category && args.category !== "ALL") {
            conditions.push(eq(events.eventType, args.category));
          }
          if (args.query) {
            const q = `%${args.query}%`;
            const searchCond = or(ilike(events.title, q), ilike(events.description, q), ilike(events.clubName, q));
            if (searchCond) conditions.push(searchCond);
          }

          const rawEvents = await db.query.events.findMany({
            where: and(...conditions),
            orderBy: [desc(events.createdAt)],
            limit,
          });
          toolOutput = rawEvents.map(formatEventOutput);
        } else if (toolName === "get_event") {
          const target = args.idOrSlug || args.id || args.slug;
          const found = await db.query.events.findFirst({
            where: or(eq(events.id, target), eq(events.slug, target)),
            with: { institution: true },
          });
          if (!found) throw new Error(`Event '${target}' not found`);
          toolOutput = formatEventOutput(found);
        } else if (toolName === "get_event_categories") {
          toolOutput = {
            eventTypes: [
              "HACKATHON",
              "WORKSHOP",
              "COMPETITION",
              "SEMINAR",
              "MEETUP",
              "CULTURAL",
              "SPORTS",
              "FEST",
            ],
            modes: ["ONLINE", "HYBRID", "OFFLINE"],
            participationTypes: ["SOLO", "TEAM", "BOTH"],
            statuses: ["PUBLISHED", "DRAFT", "COMPLETED", "CANCELLED"],
            visibilities: ["PUBLIC", "UNLISTED", "PRIVATE"],
          };
        } else if (toolName === "create_remote_event") {
          const res = await executeCreateEvent(db, args);
          if (!res.success) throw new Error(res.error);
          const createdEv = res.event;
          toolOutput = {
            event: createdEv,
            publicUrl: `https://campusloop.space/events/${createdEv.slug}`,
          };
        } else if (toolName === "update_event") {
          const target = args.idOrSlug;
          const existing = await db.query.events.findFirst({
            where: or(eq(events.id, target), eq(events.slug, target)),
          });
          if (!existing) throw new Error(`Event '${target}' not found`);

          const updates: Record<string, any> = { updatedAt: new Date() };
          if (args.title) updates.title = args.title;
          if (args.description) updates.description = args.description;
          if (args.tagline) updates.tagline = args.tagline;
          if (args.externalUrl) updates.meetingUrl = args.externalUrl;
          if (args.startDate) updates.startDate = new Date(args.startDate);
          if (args.endDate) updates.endDate = new Date(args.endDate);
          if (args.registrationDeadline) updates.registrationDeadline = new Date(args.registrationDeadline);
          if (args.prizesDescription) updates.prizesDescription = args.prizesDescription;
          if (args.status) updates.status = args.status;

          const [updated] = await db.update(events).set(updates).where(eq(events.id, existing.id)).returning();
          toolOutput = formatEventOutput(updated);
        } else if (toolName === "delete_event") {
          const target = args.idOrSlug;
          const existing = await db.query.events.findFirst({
            where: or(eq(events.id, target), eq(events.slug, target)),
            columns: { id: true, title: true },
          });
          if (!existing) throw new Error(`Event '${target}' not found`);
          await db.delete(events).where(eq(events.id, existing.id));
          toolOutput = { success: true, message: `Event '${existing.title}' deleted.` };
        } else {
          throw new Error(`Unknown tool '${toolName}'`);
        }

        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(toolOutput, null, 2) }],
            },
          },
          { headers: CORS_HEADERS }
        );
      } catch (err: any) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              isError: true,
              content: [{ type: "text", text: `Tool error: ${err.message}` }],
            },
          },
          { headers: CORS_HEADERS }
        );
      }
    }

    case "resources/list":
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            resources: [
              {
                uri: "campusloop://events/recent",
                name: "Recent CampusLoop Events & Hackathons",
                description: "Live snapshot of the most recent events and remote opportunities",
                mimeType: "application/json",
              },
              {
                uri: "campusloop://events/remote",
                name: "Remote Opportunities & Virtual Hackathons",
                description: "All online, remote, and virtual campus opportunities",
                mimeType: "application/json",
              },
            ],
          },
        },
        { headers: CORS_HEADERS }
      );

    case "resources/read": {
      const uri = params.uri || "";
      let resourceEvents = [];
      if (uri === "campusloop://events/remote") {
        resourceEvents = await db.query.events.findMany({
          where: eq(events.mode, "ONLINE"),
          orderBy: [desc(events.createdAt)],
          limit: 25,
        });
      } else {
        resourceEvents = await db.query.events.findMany({
          orderBy: [desc(events.createdAt)],
          limit: 25,
        });
      }

      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(resourceEvents.map(formatEventOutput), null, 2),
              },
            ],
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    default:
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method '${method}' not found` },
        },
        { status: 404, headers: CORS_HEADERS }
      );
  }
}

type CreateEventResult =
  | { success: true; event: ReturnType<typeof formatEventOutput> }
  | { success: false; error: string };

/**
 * Shared executor to create an event and insert into Postgres
 */
async function executeCreateEvent(
  db: ReturnType<typeof getDb>,
  input: Record<string, any>
): Promise<CreateEventResult> {
  const {
    title,
    description,
    tagline,
    clubName,
    organizerName,
    eventType = "HACKATHON",
    mode = "ONLINE",
    venue,
    meetingUrl,
    externalUrl,
    registrationUrl,
    startDate,
    endDate,
    registrationDeadline,
    participationType = "SOLO",
    minTeamSize = 1,
    maxTeamSize = 4,
    maxParticipants,
    isPaid = false,
    entryFee = "Free",
    prizesDescription,
    perks = ["Certificates", "Prizes", "Remote Experience", "Loop Points"],
    loopPointsReward = 30,
    bannerUrl,
    status = "PUBLISHED",
    visibility = "PUBLIC",
    eligibleInstitutionIds = ["ALL"],
    organizerProfileId,
    institutionId,
  } = input;

  if (!title || !description) {
    return { success: false, error: "Title and description are required." };
  }

  const resolvedClub = (clubName || organizerName || "CampusLoop Remote Opportunities").trim();
  const resolvedUrl = (externalUrl || registrationUrl || meetingUrl || "").trim() || null;
  const resolvedVenue = venue?.trim() || (mode === "ONLINE" ? "Remote / Online" : null);

  // Time handling: default startDate to +1 day, endDate to +4 days
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
  const deadline = registrationDeadline ? new Date(registrationDeadline) : start;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { success: false, error: "Invalid startDate or endDate provided." };
  }

  // Resolve foreign keys
  const { organizerProfileId: finalOrgId, institutionId: finalInstId } =
    await resolveOrganizerAndInstitution(db, organizerProfileId, institutionId);

  if (!finalOrgId || !finalInstId) {
    return {
      success: false,
      error: "Unable to associate event with an organizer or campus hub in database.",
    };
  }

  const baseSlug = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${baseSlug || "opportunity"}-${nanoid(6)}`;
  const eventId = `event_${nanoid(12)}`;

  const newEventData = {
    id: eventId,
    slug,
    title: String(title).trim(),
    tagline: tagline ? String(tagline).trim() : null,
    description: String(description).trim(),
    bannerUrl: bannerUrl ? String(bannerUrl).trim() : null,
    clubName: resolvedClub,
    organizerProfileId: finalOrgId,
    institutionId: finalInstId,
    eligibleInstitutionIds: Array.isArray(eligibleInstitutionIds) ? eligibleInstitutionIds : ["ALL"],
    eventType: String(eventType).toUpperCase(),
    mode: String(mode).toUpperCase(),
    venue: resolvedVenue,
    meetingUrl: resolvedUrl,
    startDate: start,
    endDate: end,
    registrationDeadline: deadline,
    participationType: String(participationType).toUpperCase(),
    minTeamSize: Number(minTeamSize) || 1,
    maxTeamSize: Number(maxTeamSize) || 4,
    maxParticipants: maxParticipants ? Number(maxParticipants) : null,
    isPaid: Boolean(isPaid),
    entryFee: entryFee || "Free",
    prizesDescription: prizesDescription ? String(prizesDescription).trim() : null,
    perks: Array.isArray(perks) ? perks : [perks],
    loopPointsReward: Number(loopPointsReward) || 30,
    status: status === "DRAFT" ? "DRAFT" : "PUBLISHED",
    visibility: ["PUBLIC", "UNLISTED", "PRIVATE"].includes(visibility) ? visibility : "PUBLIC",
  };

  const [inserted] = await db.insert(events).values(newEventData).returning();

  return {
    success: true,
    event: formatEventOutput(inserted),
  };
}

/**
 * Normalizes event outputs for consistent JSON formatting
 */
function formatEventOutput(ev: any) {
  return {
    id: ev.id,
    slug: ev.slug,
    title: ev.title,
    tagline: ev.tagline,
    description: ev.description,
    bannerUrl: ev.bannerUrl,
    clubName: ev.clubName,
    eventType: ev.eventType,
    mode: ev.mode,
    isRemote: ev.mode === "ONLINE",
    venue: ev.venue,
    externalUrl: ev.meetingUrl,
    registrationUrl: ev.meetingUrl,
    startDate: ev.startDate,
    endDate: ev.endDate,
    registrationDeadline: ev.registrationDeadline,
    participationType: ev.participationType,
    minTeamSize: ev.minTeamSize,
    maxTeamSize: ev.maxTeamSize,
    maxParticipants: ev.maxParticipants,
    isPaid: ev.isPaid,
    entryFee: ev.entryFee,
    prizesDescription: ev.prizesDescription,
    perks: ev.perks,
    loopPointsReward: ev.loopPointsReward,
    status: ev.status,
    visibility: ev.visibility,
    institution: ev.institution
      ? {
          id: ev.institution.id,
          name: ev.institution.name,
          slug: ev.institution.slug,
        }
      : undefined,
    publicUrl: `https://campusloop.space/events/${ev.slug}`,
    shortUrl: `https://campusloop.space/e/${ev.slug}`,
    createdAt: ev.createdAt,
    updatedAt: ev.updatedAt,
  };
}

/**
 * Generates an interactive, responsive HTML documentation and test console
 * for developers and AI agents inspecting https://campusloop.space/mcp/events
 */
function renderMcpEventsDocumentationHtml({
  isAuthenticated,
  events,
  remoteCount,
  tools,
}: {
  isAuthenticated: boolean;
  events: any[];
  remoteCount: number;
  tools: any[];
}) {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampusLoop MCP Events Engine · Developer & AI Agent Docs</title>
  <link rel="icon" href="https://campusloop.space/favicon.ico">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    pre code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen antialiased selection:bg-orange-500 selection:text-white">
  <div class="max-w-5xl mx-auto px-4 py-10 sm:px-6">
    <!-- Header -->
    <header class="border-b border-neutral-800 pb-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950 text-orange-400 border border-orange-800">
            Model Context Protocol
          </span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isAuthenticated
              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
              : "bg-neutral-800 text-neutral-400 border border-neutral-700"
          }">
            ${isAuthenticated ? "Authenticated · Superpowers Active" : "Public Read-Only Mode"}
          </span>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          CampusLoop Events MCP
        </h1>
        <p class="text-sm text-neutral-400 mt-1 max-w-2xl">
          Remote hackathons, virtual workshops, fellowships, and campus opportunities engine.
          Public read access with zero auth, plus authenticated remote CRUD for AI agents and administrators.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <a href="?format=json" class="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium border border-neutral-700 transition">
          View JSON
        </a>
        <a href="https://campusloop.space/events" class="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-medium text-white transition">
          Explore /events
        </a>
      </div>
    </header>

    <!-- Quick Stats Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div class="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div class="text-xs text-neutral-400 font-medium">Public Opportunities</div>
        <div class="text-2xl font-bold text-white mt-1">${events.length}</div>
      </div>
      <div class="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div class="text-xs text-neutral-400 font-medium">Remote / Online</div>
        <div class="text-2xl font-bold text-orange-400 mt-1">${remoteCount}</div>
      </div>
      <div class="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div class="text-xs text-neutral-400 font-medium">Available MCP Tools</div>
        <div class="text-2xl font-bold text-emerald-400 mt-1">${tools.length}</div>
      </div>
      <div class="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div class="text-xs text-neutral-400 font-medium">Auth Status</div>
        <div class="text-sm font-semibold ${isAuthenticated ? "text-emerald-400" : "text-neutral-400"} mt-2 truncate">
          ${isAuthenticated ? "API Key Verified" : "Public (No Key)"}
        </div>
      </div>
    </div>

    <!-- Quick Start Tabs / Cards -->
    <section class="space-y-6 mb-12">
      <h2 class="text-xl font-bold text-white flex items-center gap-2">
        <span>Endpoints &amp; Usage</span>
      </h2>

      <!-- 1. Authentication Guide -->
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-neutral-200 mb-2">1. Authentication Methods</h3>
        <p class="text-xs text-neutral-400 mb-3">
          Reading public events requires <strong>no authentication</strong>. To execute CRUD operations (creating remote hackathons, updating, or deleting), provide the secret API key through any of these methods:
        </p>
        <div class="space-y-2 text-xs">
          <div class="p-2.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-neutral-300">
            <strong>Query Parameter:</strong> <span class="text-orange-400">https://campusloop.space/mcp/events?apikey=YOUR_API_KEY</span>
          </div>
          <div class="p-2.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-neutral-300">
            <strong>HTTP Header:</strong> <span class="text-orange-400">x-api-key: YOUR_API_KEY</span>
          </div>
          <div class="p-2.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-neutral-300">
            <strong>Authorization Header:</strong> <span class="text-orange-400">Authorization: Bearer YOUR_API_KEY</span>
          </div>
        </div>
      </div>

      <!-- 2. cURL REST Examples -->
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-neutral-200 mb-2">2. REST API Examples</h3>
        <div class="space-y-4">
          <!-- GET example -->
          <div>
            <div class="text-xs font-semibold text-neutral-400 mb-1">A. Query Remote Opportunities (No Auth Required)</div>
            <pre class="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 overflow-x-auto"><code>curl -s "https://campusloop.space/mcp/events?remote=true&category=HACKATHON"</code></pre>
          </div>

          <!-- POST create example -->
          <div>
            <div class="text-xs font-semibold text-neutral-400 mb-1">B. Create Remote Event / External Opportunity (Requires API Key)</div>
            <pre class="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 overflow-x-auto"><code>curl -X POST "https://campusloop.space/mcp/events?apikey=YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Global AI Agents Hackathon 2026",
    "description": "Build autonomous agents using modern LLMs, MCP, and vector search. 48-hour remote buildathon with mentors.",
    "clubName": "Devfolio & CampusLoop Spotlight",
    "eventType": "HACKATHON",
    "mode": "ONLINE",
    "venue": "Remote / Discord",
    "externalUrl": "https://devfolio.co/hackathons/sample",
    "startDate": "2026-11-01T10:00:00Z",
    "endDate": "2026-11-03T18:00:00Z",
    "registrationDeadline": "2026-10-31T23:59:59Z",
    "prizesDescription": "₹1,50,000 Cash Prize Pool + Fast-track Interviews",
    "perks": ["Cash Prizes", "Swag Kits", "Certificates", "Loop Points"],
    "loopPointsReward": 50
  }'</code></pre>
          </div>

          <!-- PUT update example -->
          <div>
            <div class="text-xs font-semibold text-neutral-400 mb-1">C. Update Event or Extend Deadline (Requires API Key)</div>
            <pre class="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 overflow-x-auto"><code>curl -X PUT "https://campusloop.space/mcp/events?apikey=YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "idOrSlug": "global-ai-agents-hackathon-2026-xyz123",
    "registrationDeadline": "2026-11-02T12:00:00Z",
    "prizesDescription": "₹2,00,000 Cash Prize Pool (Prize pool increased!)"
  }'</code></pre>
          </div>

          <!-- DELETE example -->
          <div>
            <div class="text-xs font-semibold text-neutral-400 mb-1">D. Delete Event (Requires API Key)</div>
            <pre class="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 overflow-x-auto"><code>curl -X DELETE "https://campusloop.space/mcp/events?id=event_123456&apikey=YOUR_API_KEY"</code></pre>
          </div>
        </div>
      </div>

      <!-- 3. Model Context Protocol (MCP) Config -->
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-neutral-200 mb-2">3. Connect to Claude Desktop, Cursor, or AI Agents</h3>
        <p class="text-xs text-neutral-400 mb-3">
          Add CampusLoop as an MCP server to your AI coding agents:
        </p>
        <pre class="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 overflow-x-auto"><code>{
  "mcpServers": {
    "campusloop-events": {
      "url": "https://campusloop.space/mcp/events?apikey=YOUR_API_KEY",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}</code></pre>
      </div>
    </section>

    <!-- MCP Tools Directory -->
    <section class="mb-12">
      <h2 class="text-xl font-bold text-white mb-4">MCP Tool Directory (${tools.length} Tools)</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${tools
          .map(
            (t) => `
          <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div class="flex items-center justify-between mb-1">
              <code class="text-sm font-bold text-orange-400">${t.name}</code>
              <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                ["create_remote_event", "update_event", "delete_event"].includes(t.name)
                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                  : "bg-emerald-950 text-emerald-400 border border-emerald-800"
              }">
                ${["create_remote_event", "update_event", "delete_event"].includes(t.name) ? "Requires Key" : "Public"}
              </span>
            </div>
            <p class="text-xs text-neutral-300 mt-2">${t.description}</p>
          </div>
        `
          )
          .join("")}
      </div>
    </section>

    <!-- Live Opportunities Snapshot -->
    <section>
      <h2 class="text-xl font-bold text-white mb-4">Active Events Preview (${events.length})</h2>
      <div class="space-y-3">
        ${
          events.length === 0
            ? `<div class="p-8 text-center text-neutral-500 bg-neutral-900 rounded-xl border border-neutral-800">
                No active events found. Use POST to add the first remote opportunity!
               </div>`
            : events
                .slice(0, 5)
                .map(
                  (ev) => `
          <div class="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  ${ev.eventType}
                </span>
                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  ev.isRemote ? "bg-orange-950 text-orange-400 border border-orange-800" : "bg-neutral-800 text-neutral-400"
                }">
                  ${ev.mode}
                </span>
                <span class="text-xs text-neutral-400 font-medium">${ev.clubName}</span>
              </div>
              <a href="${ev.publicUrl}" target="_blank" class="text-sm font-semibold text-white hover:text-orange-400 transition">
                ${ev.title}
              </a>
              ${ev.tagline ? `<p class="text-xs text-neutral-400 mt-0.5">${ev.tagline}</p>` : ""}
            </div>
            <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
              ${
                ev.externalUrl
                  ? `<a href="${ev.externalUrl}" target="_blank" class="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition">
                      External Link ↗
                     </a>`
                  : ""
              }
              <a href="${ev.publicUrl}" target="_blank" class="px-2.5 py-1 text-xs rounded bg-orange-600 hover:bg-orange-500 text-white transition">
                View Event →
              </a>
            </div>
          </div>
        `
                )
                .join("")
        }
      </div>
    </section>

    <!-- Footer -->
    <footer class="mt-16 pt-8 border-t border-neutral-800 text-center text-xs text-neutral-500">
      CampusLoop &middot; Verified Student Network &middot; <a href="https://campusloop.space" class="text-neutral-400 hover:underline">campusloop.space</a>
    </footer>
  </div>
</body>
</html>`;
}
