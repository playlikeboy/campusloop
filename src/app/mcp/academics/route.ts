import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  academicPlaylistItems,
  academicPlaylists,
  academicResources,
  institutions,
  userProfiles,
} from "@/db/schema";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Accept, Content-Type, Authorization, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID, x-api-key, X-API-KEY, x-campusloop-mcp-key, x-mcp-key",
};

const nanoid = (len = 12) => randomUUID().replace(/-/g, "").slice(0, len);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Authenticates whether the request includes a valid MCP API key.
 * Checks URL query params (?apikey= or ?api_key=), headers (x-api-key, x-mcp-key),
 * or Bearer authorization.
 * Key value is strictly read from environment variables to prevent leaking into codebase.
 */
function verifyApiKey(req: Request): boolean {
  const configuredKey =
    process.env.MCP_ACADEMICS_API_KEY ||
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

  const expectedKey = configuredKey.trim();
  return [queryKey, headerKey, bearerKey].some((candidateKey) => candidateKey?.trim() === expectedKey);
}

/**
 * Resolves an active institution and uploader profile in the database.
 * Prevents foreign key constraint violations during programmatic ingestion.
 */
async function resolveUploaderAndInstitution(
  db: ReturnType<typeof getDb>,
  requestedUploaderId?: string,
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

  let uploaderId = requestedUploaderId;
  if (uploaderId) {
    const prof = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, uploaderId),
      columns: { id: true, institutionId: true },
    });
    if (!prof) {
      uploaderId = undefined;
    } else if (!institutionId) {
      institutionId = prof.institutionId;
    }
  }

  if (!uploaderId) {
    const adminProf = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.role, "ADMIN"),
      columns: { id: true, institutionId: true },
    });
    if (adminProf) {
      uploaderId = adminProf.id;
      if (!institutionId) institutionId = adminProf.institutionId;
    } else {
      const anyProf = await db.query.userProfiles.findFirst({
        columns: { id: true, institutionId: true },
      });
      uploaderId = anyProf?.id;
      if (!institutionId && anyProf?.institutionId) {
        institutionId = anyProf.institutionId;
      }
    }
  }

  return { uploaderId, institutionId };
}

// Model Context Protocol (MCP) Tools Catalog for Academic Vault & Notes
const MCP_ACADEMIC_TOOLS = [
  {
    name: "list_academic_resources",
    description:
      "Search and list verified university study materials, notes, previous year questions (PYQs), lab manuals, cheat sheets, and course books across CampusLoop.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query across title, subject, description, or code" },
        subjectCode: { type: "string", description: "Filter by course code (e.g., 'CS201', 'MA101', 'EC302')" },
        branch: {
          type: "string",
          description: "Engineering / academic branch (e.g. 'Computer Science', 'ECE', 'Mechanical', 'Civil', 'Electrical', 'All')",
        },
        semester: { type: "integer", minimum: 1, maximum: 8, description: "Academic semester (1 to 8)" },
        resourceType: {
          type: "string",
          enum: ["ALL", "NOTES", "PYQ", "LAB_MANUAL", "CHEAT_SHEET", "BOOK", "PPT", "MODULE"],
          description: "Type of study material",
        },
        institutionId: { type: "string", description: "Filter by institution/university ID" },
        verifiedOnly: { type: "boolean", description: "Filter only resources marked verified" },
        offset: { type: "integer", minimum: 0, default: 0, description: "Zero-based offset for scanning the complete catalog" },
        limit: { type: "integer", default: 20, maximum: 100, description: "Number of resources to return" },
      },
    },
  },
  {
    name: "get_academic_resource",
    description:
      "Retrieve full details, PDF/Drive links, syllabus coverage, attachments, and stats for a specific study resource by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Resource ID (e.g. res_...)" },
      },
      required: ["id"],
    },
  },
  {
    name: "create_academic_resource",
    description:
      "Index an existing source-linked study resource, notes, PYQ, lab manual, or formula sheet. New records remain unverified until reviewed. (Requires API key).",
    inputSchema: {
      type: "object",
      required: ["title", "subjectCode", "subjectName"],
      properties: {
        title: { type: "string", description: "Descriptive document title (e.g. 'Complete DSA Notes with Visual Diagrams')" },
        subjectCode: { type: "string", description: "Course code (e.g. 'CS201', 'MA101')" },
        subjectName: { type: "string", description: "Course name (e.g. 'Data Structures & Algorithms')" },
        branch: { type: "string", default: "All", description: "Academic branch (e.g. 'Computer Science', 'ECE', 'All')" },
        semester: { type: "integer", default: 1, minimum: 1, maximum: 8, description: "Semester (1 to 8)" },
        resourceType: {
          type: "string",
          enum: ["NOTES", "PYQ", "LAB_MANUAL", "CHEAT_SHEET", "BOOK", "PPT", "MODULE"],
          default: "NOTES",
          description: "Type of material",
        },
        description: { type: "string", description: "Summary of syllabus topics or modules covered" },
        moduleOrChapter: { type: "string", description: "e.g. 'Unit 1-4', 'Mid-Sem Modules', 'Complete Book'" },
        fileUrl: { type: "string", description: "Direct PDF or document URL" },
        driveUrl: { type: "string", description: "Google Drive view or folder URL" },
        tags: { type: "array", items: { type: "string" }, description: "Search tags (e.g. ['Trees', 'Graphs', 'PYQ 2025'])" },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              url: { type: "string" },
              size: { type: "number" },
            },
          },
          description: "Additional files or supplementary attachments",
        },
        institutionId: { type: "string", description: "University institution ID" },
        isVerified: { type: "boolean", default: false, description: "Set true only after human/editor review" },
      },
    },
  },
  {
    name: "update_academic_resource",
    description: "Update metadata, file links, tags, or verification status of an existing academic resource. (Requires API key).",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "Academic resource ID to update" },
        title: { type: "string" },
        description: { type: "string" },
        subjectCode: { type: "string" },
        subjectName: { type: "string" },
        branch: { type: "string" },
        semester: { type: "integer", minimum: 1, maximum: 8 },
        resourceType: {
          type: "string",
          enum: ["NOTES", "PYQ", "LAB_MANUAL", "CHEAT_SHEET", "BOOK", "PPT", "MODULE"],
        },
        moduleOrChapter: { type: "string" },
        fileUrl: { type: "string" },
        driveUrl: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        attachments: { type: "array", items: { type: "object", properties: { title: { type: "string" }, name: { type: "string" }, url: { type: "string" }, sizeBytes: { type: "number" } } } },
        isVerified: { type: "boolean" },
      },
    },
  },
  {
    name: "delete_academic_resource",
    description: "Permanently delete an academic resource from the Vault. (Requires API key).",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "Resource ID to delete" },
      },
    },
  },
  {
    name: "list_academic_playlists",
    description:
      "Browse curated semester study packs, exam bundles, GATE packages, and student-curated collections.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["ALL", "SEMESTER_PACK", "EXAM_PREP", "SUBJECT_BUNDLE", "GATE", "CUSTOM"],
          description: "Playlist collection category",
        },
        branch: { type: "string", description: "Academic branch filter" },
        semester: { type: "integer", minimum: 1, maximum: 8, description: "Semester filter" },
        featuredOnly: { type: "boolean", description: "Filter only featured playlists" },
        query: { type: "string", description: "Search playlist title, description, or branch" },
        offset: { type: "integer", minimum: 0, default: 0 },
        limit: { type: "integer", default: 20, maximum: 50 },
      },
    },
  },
  {
    name: "get_academic_playlist",
    description: "Retrieve comprehensive playlist details and all attached study resources in ordered sequence.",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Playlist ID or unique URL slug" },
      },
    },
  },
  {
    name: "create_academic_playlist",
    description:
      "Create a curated semester study pack or subject bundle on CampusLoop. (Requires API key).",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string", description: "Playlist Title (e.g. '3rd Sem CSE Complete Exam Pack')" },
        description: { type: "string", description: "Curator notes and bundle summary" },
        branch: { type: "string", default: "All", description: "Target branch" },
        semester: { type: "integer", minimum: 1, maximum: 8, description: "Target semester" },
        category: {
          type: "string",
          enum: ["SEMESTER_PACK", "EXAM_PREP", "SUBJECT_BUNDLE", "GATE", "CUSTOM"],
          default: "SEMESTER_PACK",
        },
        visibility: { type: "string", enum: ["PUBLIC", "UNLISTED", "PRIVATE"], default: "PUBLIC" },
        coverGradient: { type: "string", default: "from-slate-900 to-stone-900" },
        tags: { type: "array", items: { type: "string" } },
        isFeatured: { type: "boolean", default: false },
        isVerified: { type: "boolean", default: false, description: "Only set true after curator review" },
        resourceIds: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of resource IDs to immediately bundle into this playlist",
        },
      },
    },
  },
  {
    name: "update_academic_playlist",
    description: "Update title, category, visibility, or verification of an academic playlist. (Requires API key).",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Playlist ID or slug to update" },
        title: { type: "string" },
        description: { type: "string" },
        branch: { type: "string" },
        semester: { type: "integer" },
        category: {
          type: "string",
          enum: ["SEMESTER_PACK", "EXAM_PREP", "SUBJECT_BUNDLE", "GATE", "CUSTOM"],
        },
        visibility: { type: "string", enum: ["PUBLIC", "UNLISTED", "PRIVATE"] },
        coverGradient: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        isFeatured: { type: "boolean" },
        isVerified: { type: "boolean" },
      },
    },
  },
  {
    name: "delete_academic_playlist",
    description: "Permanently delete an academic playlist and unbundle its items. (Requires API key).",
    inputSchema: {
      type: "object",
      required: ["idOrSlug"],
      properties: {
        idOrSlug: { type: "string", description: "Playlist ID or slug to delete" },
      },
    },
  },
  {
    name: "manage_playlist_item",
    description: "Add, reorder, or remove an academic resource from a study playlist. (Requires API key).",
    inputSchema: {
      type: "object",
      required: ["playlistId", "resourceId"],
      properties: {
        playlistId: { type: "string", description: "Playlist ID" },
        resourceId: { type: "string", description: "Academic Resource ID" },
        action: { type: "string", enum: ["ADD", "REMOVE"], default: "ADD" },
        sectionName: { type: "string", default: "Core Materials", description: "Section header in playlist" },
        sortOrder: { type: "integer", default: 0, description: "Sorting index" },
        curatorNote: { type: "string", description: "Helpful tip or exam advice for this note" },
      },
    },
  },
  {
    name: "get_academic_metadata",
    description: "Get standardized lists of departments, semesters, resource categories, and branches.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Pure OpenAPI 3.1.0 Specification definition for Composio, Swagger, and GPTs
function getOpenApiSpec(serverUrl = "https://campusloop.space") {
  return {
    openapi: "3.1.0",
    info: {
      title: "CampusLoop Academic Vault & Notes Engine",
      version: "1.0.0",
      description:
        "Programmatically search, upload, organize, and curate university study materials, PYQs, and semester packs across 1,350+ Indian engineering & degree colleges.",
      contact: {
        name: "CampusLoop Academics Team",
        url: "https://campusloop.space/academics",
        email: "support@mail.campsy.app",
      },
    },
    servers: [
      {
        url: serverUrl,
        description: "CampusLoop Production API Server",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyQuery: {
          type: "apiKey",
          in: "query",
          name: "apikey",
          description: "CampusLoop MCP API Key passed as URL query parameter",
        },
        ApiKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "CampusLoop MCP API Key passed in request headers",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "APIKey",
        },
      },
    },
    security: [{ ApiKeyQuery: [] }, { ApiKeyHeader: [] }, { BearerAuth: [] }],
    paths: {
      "/mcp/academics": {
        get: {
          operationId: "list_academic_resources",
          summary: "Search and list academic resources and notes",
          description:
            "Fetch verified university notes, PYQs, cheat sheets, or playlists. Filter by query, branch, semester, or resourceType.",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
            { name: "subjectCode", in: "query", schema: { type: "string" }, description: "Course code (e.g. CS201)" },
            { name: "branch", in: "query", schema: { type: "string" }, description: "Engineering/study branch" },
            { name: "semester", in: "query", schema: { type: "integer", minimum: 1, maximum: 8 }, description: "Semester 1-8" },
            {
              name: "type",
              in: "query",
              schema: {
                type: "string",
                enum: ["ALL", "NOTES", "PYQ", "LAB_MANUAL", "CHEAT_SHEET", "BOOK", "PPT", "MODULE", "PLAYLISTS"],
              },
              description: "Filter by resource type or 'PLAYLISTS'",
            },
            { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
            { name: "apikey", in: "query", schema: { type: "string" }, description: "Secret API key" },
          ],
          responses: {
            "200": { description: "Academic resources retrieved successfully" },
          },
        },
        post: {
          operationId: "create_academic_resource",
          summary: "Create a verified study note or playlist",
          description:
            "Add a new study resource (notes, PYQs, syllabus) or playlist to the CampusLoop Academic Vault. (Requires API key).",
          parameters: [
            { name: "apikey", in: "query", schema: { type: "string" }, description: "Secret API key" },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title"],
                  properties: {
                    type: { type: "string", enum: ["resource", "playlist"], default: "resource" },
                    title: { type: "string", description: "Title of document or playlist" },
                    subjectCode: { type: "string", description: "Course code (e.g. CS201)" },
                    subjectName: { type: "string", description: "Course name" },
                    branch: { type: "string", default: "All" },
                    semester: { type: "integer", default: 1 },
                    resourceType: {
                      type: "string",
                      enum: ["NOTES", "PYQ", "LAB_MANUAL", "CHEAT_SHEET", "BOOK", "PPT", "MODULE"],
                      default: "NOTES",
                    },
                    description: { type: "string" },
                    fileUrl: { type: "string", description: "Direct PDF or drive URL" },
                    driveUrl: { type: "string", description: "Google Drive view URL" },
                    tags: { type: "array", items: { type: "string" } },
                    isVerified: { type: "boolean", default: false, description: "Only set true after curator review" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Resource or Playlist successfully created" },
            "401": { description: "Unauthorized: Missing or invalid API key" },
          },
        },
        put: {
          operationId: "update_academic_resource",
          summary: "Update an academic resource or playlist",
          description: "Update details, links, tags, or items for an existing resource or playlist.",
          parameters: [
            { name: "apikey", in: "query", schema: { type: "string" }, description: "Secret API key" },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id"],
                  properties: {
                    id: { type: "string", description: "Resource ID or Playlist ID" },
                    type: { type: "string", enum: ["resource", "playlist", "playlist_item"] },
                    title: { type: "string" },
                    description: { type: "string" },
                    fileUrl: { type: "string" },
                    driveUrl: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                    isVerified: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated successfully" },
            "401": { description: "Unauthorized" },
          },
        },
        delete: {
          operationId: "delete_academic_resource",
          summary: "Delete an academic resource or playlist",
          description: "Permanently delete study material or playlist from the Academic Vault.",
          parameters: [
            { name: "id", in: "query", required: true, schema: { type: "string" }, description: "ID to delete" },
            { name: "type", in: "query", schema: { type: "string", enum: ["resource", "playlist"] }, default: "resource" },
            { name: "apikey", in: "query", schema: { type: "string" }, description: "Secret API key" },
          ],
          responses: {
            "200": { description: "Deleted successfully" },
            "401": { description: "Unauthorized" },
          },
        },
      },
    },
  };
}

// Convert MCP Tool specs to OpenAI function definitions
function getOpenAiFunctions() {
  return MCP_ACADEMIC_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  }));
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isAuthenticated = verifyApiKey(req);
  const wantsSse = req.headers.get("accept") === "text/event-stream" || url.searchParams.get("transport") === "sse";
  const acceptsHtml = req.headers.get("accept")?.includes("text/html");
  const hasAuthAttempt = Boolean(
    url.searchParams.get("apikey") ||
    url.searchParams.get("api_key") ||
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")
  );

  // Return HTML interactive documentation ONLY if browser requests HTML and no API key was provided
  if (acceptsHtml && !hasAuthAttempt && !url.searchParams.get("format") && !url.searchParams.get("json")) {
    return new NextResponse(getDocumentationHtml(), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Handle MCP Server-Sent Events (SSE) transport
  if (wantsSse) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const payload = JSON.stringify({
          jsonrpc: "2.0",
          method: "endpoint",
          params: { endpoint: "https://campusloop.space/mcp/academics" },
        });
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${payload}\n\n`));
        const toolsPayload = JSON.stringify({
          jsonrpc: "2.0",
          result: { tools: MCP_ACADEMIC_TOOLS },
        });
        controller.enqueue(encoder.encode(`event: message\ndata: ${toolsPayload}\n\n`));
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // Pure query filters
  const query = (url.searchParams.get("q") || url.searchParams.get("query") || "").trim().toLowerCase();
  const subjectCode = (url.searchParams.get("subjectCode") || "").trim().toUpperCase();
  const branch = url.searchParams.get("branch");
  const semesterParam = url.searchParams.get("semester");
  const semester = semesterParam ? parseInt(semesterParam, 10) : undefined;
  const resourceType = url.searchParams.get("type") || url.searchParams.get("resourceType") || "ALL";
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "25", 10), 1), 100);
  const resourceId = url.searchParams.get("id");
  const playlistId = url.searchParams.get("playlistId");

  try {
    const db = getDb();

    // 1. Single Resource details lookup
    if (resourceId) {
      const resource = await db.query.academicResources.findFirst({
        where: eq(academicResources.id, resourceId),
        with: {
          institution: {
            columns: { id: true, name: true, slug: true, district: true, state: true },
          },
          uploader: {
            columns: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      });

      if (!resource) {
        return NextResponse.json(
          { error: `Academic resource '${resourceId}' not found.` },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      return NextResponse.json(
        {
          success: true,
          resource: formatResource(resource),
          tools: MCP_ACADEMIC_TOOLS,
          openapi: "3.1.0",
        },
        { headers: CORS_HEADERS }
      );
    }

    // 2. Playlists query
    if (resourceType === "PLAYLISTS" || playlistId) {
      if (playlistId) {
        const playlist = await db.query.academicPlaylists.findFirst({
          where: or(eq(academicPlaylists.id, playlistId), eq(academicPlaylists.slug, playlistId)),
          with: {
            institution: { columns: { id: true, name: true, slug: true } },
            creator: { columns: { id: true, username: true, displayName: true, avatarUrl: true } },
            items: {
              with: {
                resource: true,
              },
            },
          },
        });

        if (!playlist) {
          return NextResponse.json(
            { error: `Academic playlist '${playlistId}' not found.` },
            { status: 404, headers: CORS_HEADERS }
          );
        }

        return NextResponse.json(
          {
            success: true,
            playlist: formatPlaylist(playlist),
            tools: MCP_ACADEMIC_TOOLS,
            openapi: "3.1.0",
          },
          { headers: CORS_HEADERS }
        );
      }

      const playlists = await db.query.academicPlaylists.findMany({
        where: and(
          branch && branch !== "All" ? eq(academicPlaylists.branch, branch) : undefined,
          semester ? eq(academicPlaylists.semester, semester) : undefined
        ),
        orderBy: [desc(academicPlaylists.starsCount), desc(academicPlaylists.createdAt)],
        limit,
        with: {
          institution: { columns: { id: true, name: true, slug: true } },
          creator: { columns: { id: true, username: true, displayName: true } },
        },
      });

      return NextResponse.json(
        {
          openapi: "3.1.0",
          info: {
            title: "CampusLoop Academic Vault & Notes Engine",
            version: "1.0.0",
          },
          tools: MCP_ACADEMIC_TOOLS,
          result: { tools: MCP_ACADEMIC_TOOLS },
          playlists: playlists.map(formatPlaylist),
          metrics: { count: playlists.length },
        },
        { headers: CORS_HEADERS }
      );
    }

    // 3. General Academic Resources listing
    const conditions = [];

    if (query) {
      conditions.push(
        or(
          ilike(academicResources.title, `%${query}%`),
          ilike(academicResources.subjectName, `%${query}%`),
          ilike(academicResources.subjectCode, `%${query}%`),
          ilike(academicResources.description, `%${query}%`)
        )
      );
    }

    if (subjectCode) {
      conditions.push(eq(academicResources.subjectCode, subjectCode));
    }

    if (branch && branch !== "All" && branch !== "ALL") {
      conditions.push(eq(academicResources.branch, branch));
    }

    if (semester && !Number.isNaN(semester)) {
      conditions.push(eq(academicResources.semester, semester));
    }

    if (resourceType && resourceType !== "ALL") {
      conditions.push(eq(academicResources.resourceType, resourceType));
    }

    const resources = await db.query.academicResources.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(academicResources.isVerified), desc(academicResources.upvotesCount), desc(academicResources.createdAt)],
      limit,
      with: {
        institution: {
          columns: { id: true, name: true, slug: true, district: true, state: true },
        },
        uploader: {
          columns: { id: true, username: true, displayName: true },
        },
      },
    });

    // Also fetch featured playlists for high-value bundle discovery
    const featuredPlaylists = await db.query.academicPlaylists.findMany({
      where: eq(academicPlaylists.visibility, "PUBLIC"),
      orderBy: [desc(academicPlaylists.isFeatured), desc(academicPlaylists.starsCount)],
      limit: 5,
      columns: { id: true, slug: true, title: true, branch: true, semester: true, category: true, itemsCount: true },
    });

    const openApiDoc = getOpenApiSpec(url.origin);

    return NextResponse.json(
      {
        openapi: "3.1.0",
        info: openApiDoc.info,
        servers: openApiDoc.servers,
        paths: openApiDoc.paths,
        components: openApiDoc.components,
        tools: MCP_ACADEMIC_TOOLS,
        result: {
          tools: MCP_ACADEMIC_TOOLS,
        },
        functions: getOpenAiFunctions(),
        resources: resources.map(formatResource),
        featuredPlaylists,
        metrics: {
          count: resources.length,
          limit,
          query: query || null,
          subjectCode: subjectCode || null,
          branch: branch || "All",
          semester: semester || null,
          resourceType,
          authenticated: isAuthenticated,
        },
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[MCP_ACADEMICS] GET error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch academic resources from database",
        details: message,
        tools: MCP_ACADEMIC_TOOLS,
        openapi: "3.1.0",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body provided" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // 1. Handle Model Context Protocol (MCP) JSON-RPC 2.0 requests
  if (body.jsonrpc === "2.0") {
    return handleJsonRpcRequest(req, body);
  }

  // 2. Standard REST POST for creating academic resources or playlists
  if (!verifyApiKey(req)) {
    return NextResponse.json(
      {
        error: "Unauthorized: Missing or invalid API key.",
        message: "Academic management requires authentication. Pass your API key via ?apikey=... query param, x-api-key header, or Authorization: Bearer <key>",
        documentation: "https://campusloop.space/mcp/academics",
      },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const db = getDb();

  try {
    // A. Playlist Creation
    if (body.type === "playlist" || body.category) {
      const title = String(body.title || "").trim();
      if (!title) {
        return NextResponse.json(
          { error: "Validation Error: 'title' is required for playlists." },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const playlistBranch = typeof body.branch === "string" && body.branch.trim() ? body.branch.trim() : "All";
      const playlistSemester = typeof body.semester === "number" ? body.semester : null;
      const playlistCategory = typeof body.category === "string" ? body.category : "SEMESTER_PACK";
      const samePlaylist = await db.query.academicPlaylists.findFirst({
        where: and(
          eq(academicPlaylists.title, title),
          eq(academicPlaylists.branch, playlistBranch),
          eq(academicPlaylists.category, playlistCategory),
          playlistSemester === null ? isNull(academicPlaylists.semester) : eq(academicPlaylists.semester, playlistSemester)
        ),
      });
      if (samePlaylist) {
        const full = await db.query.academicPlaylists.findFirst({
          where: eq(academicPlaylists.id, samePlaylist.id),
          with: { institution: { columns: { id: true, name: true, slug: true } }, creator: { columns: { username: true, displayName: true } } },
        });
        return NextResponse.json(
          { success: true, duplicate: true, message: "Matching playlist already exists; nothing was created.", playlist: formatPlaylist(full || samePlaylist), publicUrl: "https://campusloop.space/academics/playlists/" + samePlaylist.slug },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      const { uploaderId, institutionId } = await resolveUploaderAndInstitution(
        db,
        typeof body.creatorId === "string" ? body.creatorId : undefined,
        typeof body.institutionId === "string" ? body.institutionId : undefined
      );

      if (!uploaderId) {
        return NextResponse.json(
          { error: "Cannot create playlist: No active creator profile available." },
          { status: 500, headers: CORS_HEADERS }
        );
      }

      const playlistId = `pl_${nanoid(12)}`;
      const playlistSlug = `${slugify(title)}-${nanoid(6)}`;

      const [newPlaylist] = await db
        .insert(academicPlaylists)
        .values({
          id: playlistId,
          slug: playlistSlug,
          title,
          description: typeof body.description === "string" ? body.description : null,
          creatorId: uploaderId,
          institutionId: institutionId || null,
          branch: playlistBranch,
          semester: playlistSemester,
          category: playlistCategory,
          visibility: typeof body.visibility === "string" ? body.visibility : "PUBLIC",
          coverGradient: typeof body.coverGradient === "string" ? body.coverGradient : "from-slate-900 to-stone-900",
          isFeatured: Boolean(body.isFeatured),
          isVerified: false,
          tags: Array.isArray(body.tags) ? body.tags : [],
        })
        .returning();

      // If initial resourceIds were provided, batch link them
      if (Array.isArray(body.resourceIds) && body.resourceIds.length > 0) {
        let order = 0;
        for (const resId of body.resourceIds) {
          if (typeof resId === "string") {
            try {
              await db.insert(academicPlaylistItems).values({
                id: `item_${nanoid(12)}`,
                playlistId: newPlaylist.id,
                resourceId: resId,
                sortOrder: order++,
                sectionName: "Core Materials",
              });
            } catch {}
          }
        }
        await db
          .update(academicPlaylists)
          .set({ itemsCount: order })
          .where(eq(academicPlaylists.id, newPlaylist.id));
      }

      return NextResponse.json(
        {
          success: true,
          message: `Academic Playlist '${title}' created successfully!`,
          playlist: formatPlaylist(newPlaylist),
          publicUrl: `https://campusloop.space/academics/playlists/${newPlaylist.slug}`,
        },
        { status: 201, headers: CORS_HEADERS }
      );
    }

    // B. Study Resource Creation
    const title = String(body.title || "").trim();
    const subjectCode = String(body.subjectCode || "").trim().toUpperCase();
    const subjectName = String(body.subjectName || "").trim();

    if (!title || !subjectCode || !subjectName) {
      return NextResponse.json(
        {
          error: "Validation Error: 'title', 'subjectCode', and 'subjectName' are required.",
          example: {
            title: "Operating Systems Virtual Memory Hand-Curated Notes",
            subjectCode: "CS204",
            subjectName: "Operating Systems",
            branch: "Computer Science",
            semester: 4,
            resourceType: "NOTES",
            fileUrl: "https://example.com/notes.pdf",
          },
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const branch = typeof body.branch === "string" && body.branch.trim() ? body.branch.trim() : "All";
    const semester = typeof body.semester === "number" ? body.semester : 1;
    const resourceType = typeof body.resourceType === "string" ? body.resourceType.toUpperCase() : "NOTES";
    const moduleOrChapter = typeof body.moduleOrChapter === "string" ? body.moduleOrChapter.trim() : "";
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return NextResponse.json({ error: "Validation Error: semester must be an integer from 1 to 8." }, { status: 400, headers: CORS_HEADERS });
    }
    if (!["NOTES", "PYQ", "LAB_MANUAL", "CHEAT_SHEET", "BOOK", "PPT", "MODULE"].includes(resourceType)) {
      return NextResponse.json({ error: "Validation Error: unsupported resourceType." }, { status: 400, headers: CORS_HEADERS });
    }

    const fileUrl = typeof body.fileUrl === "string" ? validateAcademicResourceUrl(body.fileUrl, "fileUrl") : null;
    const driveUrl = typeof body.driveUrl === "string" ? validateAcademicResourceUrl(body.driveUrl, "driveUrl") : null;
    if (!fileUrl && !driveUrl) {
      return NextResponse.json({ error: "Validation Error: provide a stable HTTPS fileUrl or driveUrl." }, { status: 400, headers: CORS_HEADERS });
    }

    const rawAttachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 20) : [];
    const attachments = rawAttachments.filter((item: any) => item && typeof item === "object" && typeof item.url === "string").map((item: any, index: number) => {
      const url = validateAcademicResourceUrl(item.url, "attachment URL");
      return { id: typeof item.id === "string" ? item.id : "att_" + nanoid(10) + "_" + (index + 1), title: String(item.title || item.name || ("Attachment " + (index + 1))).slice(0, 200), url, type: inferAcademicAttachmentType(url) };
    });
    const incomingUrls = new Set([fileUrl, driveUrl, ...attachments.map((attachment: any) => attachment.url)].filter(Boolean).map((url) => canonicalAcademicUrl(String(url))));
    const urlConditions = [];
    for (const url of [fileUrl, driveUrl, ...attachments.map((attachment: any) => attachment.url)].filter((v): v is string => Boolean(v))) {
      urlConditions.push(eq(academicResources.fileUrl, url));
      urlConditions.push(eq(academicResources.driveUrl, url));
    }
    let duplicate: any = null;
    if (urlConditions.length) {
      const byUrl = await db.query.academicResources.findMany({ where: or(...urlConditions), limit: 100 });
      duplicate = byUrl.find((item) => [item.fileUrl, item.driveUrl, ...(Array.isArray(item.attachments) ? item.attachments.map((attachment: any) => attachment?.url) : [])].filter(Boolean).some((url) => incomingUrls.has(canonicalAcademicUrl(String(url))))) || null;
    }
    if (!duplicate) {
      const sameCourse = await db.query.academicResources.findMany({
        where: and(eq(academicResources.subjectCode, subjectCode), eq(academicResources.branch, branch), eq(academicResources.semester, semester), eq(academicResources.resourceType, resourceType)),
        limit: 100,
      });
      const titleKey = normalizeAcademicTitle(title);
      const moduleKey = normalizeAcademicTitle(moduleOrChapter);
      duplicate = sameCourse.find((item) => normalizeAcademicTitle(item.title) === titleKey && normalizeAcademicTitle(item.moduleOrChapter || "") === moduleKey) || null;
    }
    if (duplicate) {
      const full = await db.query.academicResources.findFirst({ where: eq(academicResources.id, duplicate.id), with: { institution: { columns: { id: true, name: true, slug: true } }, uploader: { columns: { username: true, displayName: true } } } });
      return NextResponse.json({ success: true, duplicate: true, message: "Matching resource already exists; nothing was inserted.", resource: formatResource(full || duplicate), publicUrl: "https://campusloop.space/academics/" + duplicate.id }, { status: 200, headers: CORS_HEADERS });
    }

    const { uploaderId, institutionId } = await resolveUploaderAndInstitution(
      db,
      typeof body.uploaderId === "string" ? body.uploaderId : undefined,
      typeof body.institutionId === "string" ? body.institutionId : undefined
    );

    if (!institutionId || !uploaderId) {
      return NextResponse.json(
        { error: "Cannot create resource: Database missing default institution or profile." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const resourceId = `res_${nanoid(12)}`;

    const [newResource] = await db
      .insert(academicResources)
      .values({
        id: resourceId,
        institutionId,
        uploaderId,
        title,
        description: typeof body.description === "string" ? body.description : null,
        subjectCode,
        subjectName,
        branch,
        semester,
        resourceType,
        moduleOrChapter: moduleOrChapter || null,
        fileUrl,
        driveUrl,
        attachments,
        tags: Array.isArray(body.tags) ? [...new Set(body.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim()).filter(Boolean))].slice(0, 30) : [],
        isVerified: false,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: `Academic resource '${title}' created successfully!`,
        resource: formatResource(newResource),
        publicUrl: "https://campusloop.space/academics/" + newResource.id,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[MCP_ACADEMICS] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create academic resource", details: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PUT(req: Request) {
  if (!verifyApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid API key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body provided" }, { status: 400, headers: CORS_HEADERS });
  }

  const db = getDb();

  try {
    // A. Playlist item management
    if (body.action && body.playlistId && body.resourceId) {
      const playlistId = String(body.playlistId);
      const resourceId = String(body.resourceId);
      const action = String(body.action).toUpperCase();

      if (action === "REMOVE") {
        await db
          .delete(academicPlaylistItems)
          .where(
            and(
              eq(academicPlaylistItems.playlistId, playlistId),
              eq(academicPlaylistItems.resourceId, resourceId)
            )
          );

        const remaining = await db.query.academicPlaylistItems.findMany({
          where: eq(academicPlaylistItems.playlistId, playlistId),
          columns: { id: true },
        });

        await db
          .update(academicPlaylists)
          .set({ itemsCount: remaining.length, updatedAt: new Date() })
          .where(eq(academicPlaylists.id, playlistId));

        return NextResponse.json(
          { success: true, message: "Resource removed from playlist", itemsCount: remaining.length },
          { headers: CORS_HEADERS }
        );
      }

      // ADD action
      const itemId = `item_${nanoid(12)}`;
      await db
        .insert(academicPlaylistItems)
        .values({
          id: itemId,
          playlistId,
          resourceId,
          sectionName: typeof body.sectionName === "string" ? body.sectionName : "Core Materials",
          sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
          curatorNote: typeof body.curatorNote === "string" ? body.curatorNote : null,
        })
        .onConflictDoNothing();

      const allItems = await db.query.academicPlaylistItems.findMany({
        where: eq(academicPlaylistItems.playlistId, playlistId),
        columns: { id: true },
      });

      await db
        .update(academicPlaylists)
        .set({ itemsCount: allItems.length, updatedAt: new Date() })
        .where(eq(academicPlaylists.id, playlistId));

      return NextResponse.json(
        { success: true, message: "Resource added to playlist", itemsCount: allItems.length },
        { headers: CORS_HEADERS }
      );
    }

    // B. Playlist metadata update
    if (body.type === "playlist" || (body.id && String(body.id).startsWith("pl_"))) {
      const playlistId = String(body.id);
      const existing = await db.query.academicPlaylists.findFirst({
        where: or(eq(academicPlaylists.id, playlistId), eq(academicPlaylists.slug, playlistId)),
      });

      if (!existing) {
        return NextResponse.json({ error: "Playlist not found" }, { status: 404, headers: CORS_HEADERS });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (typeof body.title === "string") updateData.title = body.title.trim();
      if (typeof body.description === "string") updateData.description = body.description;
      if (typeof body.branch === "string") updateData.branch = body.branch;
      if (typeof body.semester === "number") updateData.semester = body.semester;
      if (typeof body.category === "string") updateData.category = body.category;
      if (typeof body.visibility === "string") updateData.visibility = body.visibility;
      if (typeof body.isFeatured === "boolean") updateData.isFeatured = body.isFeatured;
      if (typeof body.isVerified === "boolean") updateData.isVerified = body.isVerified;
      if (Array.isArray(body.tags)) updateData.tags = body.tags;

      const [updated] = await db
        .update(academicPlaylists)
        .set(updateData)
        .where(eq(academicPlaylists.id, existing.id))
        .returning();

      return NextResponse.json(
        { success: true, message: "Playlist updated", playlist: formatPlaylist(updated) },
        { headers: CORS_HEADERS }
      );
    }

    // C. Resource update
    const resourceId = String(body.id || "");
    if (!resourceId) {
      return NextResponse.json({ error: "Resource 'id' is required for update" }, { status: 400, headers: CORS_HEADERS });
    }

    const existingRes = await db.query.academicResources.findFirst({
      where: eq(academicResources.id, resourceId),
    });

    if (!existingRes) {
      return NextResponse.json({ error: `Resource '${resourceId}' not found` }, { status: 404, headers: CORS_HEADERS });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.title === "string") updateData.title = body.title.trim();
    if (typeof body.description === "string") updateData.description = body.description;
    if (typeof body.subjectCode === "string") updateData.subjectCode = body.subjectCode.trim().toUpperCase();
    if (typeof body.subjectName === "string") updateData.subjectName = body.subjectName.trim();
    if (typeof body.branch === "string") updateData.branch = body.branch;
    if (typeof body.semester === "number") updateData.semester = body.semester;
    if (typeof body.resourceType === "string") updateData.resourceType = body.resourceType;
    if (typeof body.moduleOrChapter === "string") updateData.moduleOrChapter = body.moduleOrChapter;
    if (typeof body.fileUrl === "string") updateData.fileUrl = body.fileUrl;
    if (typeof body.driveUrl === "string") updateData.driveUrl = body.driveUrl;
    if (Array.isArray(body.tags)) updateData.tags = body.tags;
    if (typeof body.isVerified === "boolean") updateData.isVerified = body.isVerified;

    const [updated] = await db
      .update(academicResources)
      .set(updateData)
      .where(eq(academicResources.id, resourceId))
      .returning();

    return NextResponse.json(
      { success: true, message: "Resource updated successfully", resource: formatResource(updated) },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[MCP_ACADEMICS] PUT error:", err);
    return NextResponse.json({ error: "Failed to update academic item", details: message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function DELETE(req: Request) {
  if (!verifyApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid API key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id") || url.searchParams.get("playlistId") || url.searchParams.get("resourceId");
  const type = url.searchParams.get("type") || (id && id.startsWith("pl_") ? "playlist" : "resource");

  if (!id) {
    return NextResponse.json({ error: "Missing 'id' query parameter to delete" }, { status: 400, headers: CORS_HEADERS });
  }

  const db = getDb();

  try {
    if (type === "playlist") {
      const existing = await db.query.academicPlaylists.findFirst({
        where: or(eq(academicPlaylists.id, id), eq(academicPlaylists.slug, id)),
      });

      if (!existing) {
        return NextResponse.json({ error: `Playlist '${id}' not found` }, { status: 404, headers: CORS_HEADERS });
      }

      await db.delete(academicPlaylists).where(eq(academicPlaylists.id, existing.id));

      return NextResponse.json(
        { success: true, message: `Playlist '${existing.title}' deleted successfully`, deletedId: existing.id },
        { headers: CORS_HEADERS }
      );
    }

    // Delete Resource
    const existing = await db.query.academicResources.findFirst({
      where: eq(academicResources.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: `Resource '${id}' not found` }, { status: 404, headers: CORS_HEADERS });
    }

    await db.delete(academicResources).where(eq(academicResources.id, existing.id));

    return NextResponse.json(
      { success: true, message: `Resource '${existing.title}' deleted successfully`, deletedId: existing.id },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[MCP_ACADEMICS] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete academic item", details: message }, { status: 500, headers: CORS_HEADERS });
  }
}

// Model Context Protocol JSON-RPC 2.0 Dispatcher
async function handleJsonRpcRequest(req: Request, body: Record<string, unknown>) {
  const method = String(body.method || "");
  const id = body.id ?? null;
  const params = (body.params as Record<string, unknown>) || {};
  const isAuthenticated = verifyApiKey(req);

  if (method === "initialize") {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "campusloop-academics-mcp",
            version: "1.0.0",
          },
          capabilities: {
            tools: { listChanged: false },
          },
        },
      },
      { headers: CORS_HEADERS }
    );
  }

  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  }

  if (method === "ping") {
    return NextResponse.json({ jsonrpc: "2.0", id, result: {} }, { headers: CORS_HEADERS });
  }

  if (method === "tools/list") {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_ACADEMIC_TOOLS },
      },
      { headers: CORS_HEADERS }
    );
  }

  if (method === "tools/call") {
    const toolName = String(params.name || "");
    const args = (params.arguments as Record<string, unknown>) || {};
    const db = getDb();
    const mutationTools = ["create_academic_resource", "update_academic_resource", "delete_academic_resource", "create_academic_playlist", "update_academic_playlist", "delete_academic_playlist", "manage_playlist_item"];
    if (mutationTools.includes(toolName) && !isAuthenticated) {
      return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32001, message: "Unauthorized: mutation tools require a valid MCP API key" } }, { headers: CORS_HEADERS });
    }

    try {
      if (toolName === "list_academic_resources") {
        const query = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
        const subjectCode = typeof args.subjectCode === "string" ? args.subjectCode.trim().toUpperCase() : "";
        const branch = typeof args.branch === "string" ? args.branch : undefined;
        const semester = typeof args.semester === "number" ? args.semester : undefined;
        const resourceType = typeof args.resourceType === "string" ? args.resourceType : "ALL";
        const institutionId = typeof args.institutionId === "string" ? args.institutionId.trim() : "";
        const verifiedOnly = args.verifiedOnly === true;
        const offset = typeof args.offset === "number" ? Math.max(0, Math.floor(args.offset)) : 0;
        const limit = typeof args.limit === "number" ? Math.min(Math.max(Math.floor(args.limit), 1), 100) : 20;

        const conditions = [];
        if (query) {
          conditions.push(
            or(
              ilike(academicResources.title, `%${query}%`),
              ilike(academicResources.subjectName, `%${query}%`),
              ilike(academicResources.subjectCode, `%${query}%`),
              ilike(academicResources.description, `%${query}%`)
            )
          );
        }
        if (subjectCode) conditions.push(eq(academicResources.subjectCode, subjectCode));
        if (branch && branch !== "All" && branch !== "ALL") conditions.push(eq(academicResources.branch, branch));
        if (semester) conditions.push(eq(academicResources.semester, semester));
        if (resourceType && resourceType !== "ALL") conditions.push(eq(academicResources.resourceType, resourceType));
        if (institutionId) conditions.push(eq(academicResources.institutionId, institutionId));
        if (verifiedOnly) conditions.push(eq(academicResources.isVerified, true));

        const resources = await db.query.academicResources.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          orderBy: [desc(academicResources.isVerified), desc(academicResources.upvotesCount), desc(academicResources.createdAt), desc(academicResources.id)],
          limit,
          offset,
          with: {
            institution: { columns: { id: true, name: true, slug: true } },
            uploader: { columns: { username: true, displayName: true } },
          },
        });

        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(resources.map(formatResource), null, 2),
                },
              ],
            },
          },
          { headers: CORS_HEADERS }
        );
      }

      if (toolName === "get_academic_resource") {
        const resId = String(args.id || "");
        const res = await db.query.academicResources.findFirst({
          where: eq(academicResources.id, resId),
          with: {
            institution: true,
            uploader: { columns: { username: true, displayName: true } },
          },
        });

        if (!res) {
          return NextResponse.json(
            { jsonrpc: "2.0", id, error: { code: -32602, message: `Resource '${resId}' not found` } },
            { headers: CORS_HEADERS }
          );
        }

        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(formatResource(res), null, 2) }],
            },
          },
          { headers: CORS_HEADERS }
        );
      }

      if (toolName === "create_academic_resource") {
        const title = String(args.title || "").trim();
        const subjectCode = String(args.subjectCode || "").trim().toUpperCase();
        const subjectName = String(args.subjectName || "").trim();
        const branch = typeof args.branch === "string" && args.branch.trim() ? args.branch.trim() : "All";
        const semester = typeof args.semester === "number" ? Math.floor(args.semester) : 1;
        const resourceType = typeof args.resourceType === "string" ? args.resourceType.toUpperCase() : "NOTES";
        const moduleOrChapter = typeof args.moduleOrChapter === "string" ? args.moduleOrChapter.trim() : "";
        if (!title || !subjectCode || !subjectName) throw new Error("Missing required fields: title, subjectCode, subjectName");
        if (title.length > 240 || subjectCode.length > 64 || subjectName.length > 200) throw new Error("Title, subject code, or subject name exceeds its supported length");
        if (!Number.isInteger(semester) || semester < 1 || semester > 8) throw new Error("semester must be an integer from 1 to 8");
        const allowedTypes = ["NOTES", "PYQ", "LAB_MANUAL", "CHEAT_SHEET", "BOOK", "PPT", "MODULE"];
        if (!allowedTypes.includes(resourceType)) throw new Error("Invalid resourceType: " + resourceType);
        const fileUrl = typeof args.fileUrl === "string" ? validateAcademicResourceUrl(args.fileUrl, "fileUrl") : null;
        const driveUrl = typeof args.driveUrl === "string" ? validateAcademicResourceUrl(args.driveUrl, "driveUrl") : null;
        if (!fileUrl && !driveUrl) throw new Error("At least one stable HTTPS fileUrl or driveUrl is required");
        const incomingUrls = new Set([fileUrl, driveUrl].filter(Boolean).map((value) => canonicalAcademicUrl(String(value))));
        const urlConditions = [];
        for (const value of [fileUrl, driveUrl].filter((v): v is string => Boolean(v))) { urlConditions.push(eq(academicResources.fileUrl, value)); urlConditions.push(eq(academicResources.driveUrl, value)); }
        let duplicate: any = null;
        if (urlConditions.length) {
          const byUrl = await db.query.academicResources.findMany({ where: or(...urlConditions), limit: 100 });
          duplicate = byUrl.find((item) => [item.fileUrl, item.driveUrl].filter(Boolean).some((value) => incomingUrls.has(canonicalAcademicUrl(String(value))))) || null;
        }
        if (!duplicate) {
          const sameCourse = await db.query.academicResources.findMany({ where: and(eq(academicResources.subjectCode, subjectCode), eq(academicResources.branch, branch), eq(academicResources.semester, semester), eq(academicResources.resourceType, resourceType)), limit: 100 });
          const titleKey = normalizeAcademicTitle(title), moduleKey = normalizeAcademicTitle(moduleOrChapter);
          duplicate = sameCourse.find((item) => normalizeAcademicTitle(item.title) === titleKey && normalizeAcademicTitle(item.moduleOrChapter || "") === moduleKey) || null;
        }
        if (duplicate) {
          const full = await db.query.academicResources.findFirst({ where: eq(academicResources.id, duplicate.id), with: { institution: { columns: { id: true, name: true, slug: true } }, uploader: { columns: { username: true, displayName: true } } } });
          return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, duplicate: true, message: "Matching resource already exists; nothing was inserted.", resource: formatResource(full || duplicate) }) }] } }, { headers: CORS_HEADERS });
        }
        const resolved = await resolveUploaderAndInstitution(db, undefined, typeof args.institutionId === "string" ? args.institutionId : undefined);
        if (!resolved.uploaderId || !resolved.institutionId) throw new Error("Cannot create resource: no valid uploader profile or institution is configured");
        const rawAttachments = Array.isArray(args.attachments) ? args.attachments.slice(0, 20) : [];
        const attachments = rawAttachments.filter((item: any) => item && typeof item === "object" && typeof item.url === "string").map((item: any, index: number) => {
          const url = validateAcademicResourceUrl(item.url, "attachment URL");
          return { id: typeof item.id === "string" ? item.id : "att_" + nanoid(10) + "_" + (index + 1), title: String(item.title || item.name || ("Attachment " + (index + 1))).slice(0, 200), url, type: inferAcademicAttachmentType(url) };
        });
        const tags = Array.isArray(args.tags) ? [...new Set(args.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim()).filter(Boolean))].slice(0, 30) : [];
        const [created] = await db.insert(academicResources).values({ id: "res_" + nanoid(12), institutionId: resolved.institutionId, uploaderId: resolved.uploaderId, title, description: typeof args.description === "string" ? args.description.trim().slice(0, 10000) : null, subjectCode, subjectName, branch, semester, resourceType, moduleOrChapter: moduleOrChapter || null, fileUrl, driveUrl, attachments, tags, isVerified: args.isVerified === true }).returning();
        const full = await db.query.academicResources.findFirst({ where: eq(academicResources.id, created.id), with: { institution: { columns: { id: true, name: true, slug: true } }, uploader: { columns: { username: true, displayName: true } } } });
        return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, duplicate: false, resource: formatResource(full || created) }) }] } }, { headers: CORS_HEADERS });
      }

      if (toolName === "list_academic_playlists") {
        const category = typeof args.category === "string" ? args.category : "ALL";
        const branch = typeof args.branch === "string" ? args.branch : "";
        const semester = typeof args.semester === "number" ? args.semester : undefined;
        const query = typeof args.query === "string" ? args.query.trim() : "";
        const offset = typeof args.offset === "number" ? Math.max(0, Math.floor(args.offset)) : 0;
        const limit = typeof args.limit === "number" ? Math.min(Math.max(Math.floor(args.limit), 1), 50) : 20;
        const conditions = [eq(academicPlaylists.visibility, "PUBLIC")];
        if (category !== "ALL") conditions.push(eq(academicPlaylists.category, category));
        if (branch && branch !== "All" && branch !== "ALL") conditions.push(or(eq(academicPlaylists.branch, branch), eq(academicPlaylists.branch, "All"))!);
        if (semester && semester >= 1 && semester <= 8) conditions.push(eq(academicPlaylists.semester, semester));
        if (args.featuredOnly === true) conditions.push(eq(academicPlaylists.isFeatured, true));
        if (query) conditions.push(or(ilike(academicPlaylists.title, "%" + query + "%"), ilike(academicPlaylists.description, "%" + query + "%"), ilike(academicPlaylists.branch, "%" + query + "%"))!);
        const playlists = await db.query.academicPlaylists.findMany({ where: and(...conditions), orderBy: [desc(academicPlaylists.isFeatured), desc(academicPlaylists.starsCount), desc(academicPlaylists.createdAt)], limit, offset, with: { institution: { columns: { id: true, name: true, slug: true } }, creator: { columns: { username: true, displayName: true } } } });
        return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(playlists.map(formatPlaylist), null, 2) }] } }, { headers: CORS_HEADERS });
      }

      if (toolName === "update_academic_resource") {
        const resourceId = String(args.id || "").trim(); if (!resourceId) throw new Error("id is required");
        const existing = await db.query.academicResources.findFirst({ where: eq(academicResources.id, resourceId) }); if (!existing) throw new Error("Academic resource not found: " + resourceId);
        const updates: Record<string, any> = { updatedAt: new Date() };
        if (typeof args.title === "string") updates.title = args.title.trim().slice(0, 240);
        if (typeof args.description === "string") updates.description = args.description.trim().slice(0, 10000);
        if (typeof args.subjectCode === "string") updates.subjectCode = args.subjectCode.trim().toUpperCase();
        if (typeof args.subjectName === "string") updates.subjectName = args.subjectName.trim();
        if (typeof args.branch === "string") updates.branch = args.branch.trim() || "All";
        if (args.semester !== undefined) { const semester = Number(args.semester); if (!Number.isInteger(semester) || semester < 1 || semester > 8) throw new Error("semester must be an integer from 1 to 8"); updates.semester = semester; }
        if (typeof args.resourceType === "string") { const type = args.resourceType.toUpperCase(); if (!["NOTES","PYQ","LAB_MANUAL","CHEAT_SHEET","BOOK","PPT","MODULE"].includes(type)) throw new Error("Invalid resourceType"); updates.resourceType = type; }
        if (typeof args.moduleOrChapter === "string") updates.moduleOrChapter = args.moduleOrChapter.trim() || null;
        if (typeof args.fileUrl === "string") updates.fileUrl = validateAcademicResourceUrl(args.fileUrl, "fileUrl");
        if (typeof args.driveUrl === "string") updates.driveUrl = validateAcademicResourceUrl(args.driveUrl, "driveUrl");
        if (Array.isArray(args.tags)) updates.tags = [...new Set(args.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim()).filter(Boolean))].slice(0, 30);
        if (Array.isArray(args.attachments)) updates.attachments = args.attachments.slice(0, 20).filter((item: any) => item && typeof item.url === "string").map((item: any, index: number) => { const url = validateAcademicResourceUrl(item.url, "attachment URL"); return { id: typeof item.id === "string" ? item.id : "att_" + nanoid(10) + "_" + (index + 1), title: String(item.title || item.name || ("Attachment " + (index + 1))).slice(0, 200), url, type: inferAcademicAttachmentType(url) }; });
        if (typeof args.isVerified === "boolean") updates.isVerified = args.isVerified;
        const nextValues = [typeof updates.fileUrl === "string" ? updates.fileUrl : existing.fileUrl, typeof updates.driveUrl === "string" ? updates.driveUrl : existing.driveUrl].filter((v): v is string => Boolean(v));
        const nextUrls = new Set(nextValues.map((value: string) => canonicalAcademicUrl(value))); const dupeConditions = [];
        for (const value of nextValues) { dupeConditions.push(eq(academicResources.fileUrl, value)); dupeConditions.push(eq(academicResources.driveUrl, value)); }
        if (dupeConditions.length) { const candidates = await db.query.academicResources.findMany({ where: or(...dupeConditions), limit: 100 }); const duplicate = candidates.find((item) => item.id !== resourceId && [item.fileUrl,item.driveUrl].filter(Boolean).some((value) => nextUrls.has(canonicalAcademicUrl(String(value))))); if (duplicate) throw new Error("This URL is already indexed by resource " + duplicate.id + "; update rejected to avoid a duplicate."); }
        const [updated] = await db.update(academicResources).set(updates).where(eq(academicResources.id, resourceId)).returning();
        const full = await db.query.academicResources.findFirst({ where: eq(academicResources.id, resourceId), with: { institution: { columns: { id: true, name: true, slug: true } }, uploader: { columns: { username: true, displayName: true } } } });
        return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, resource: formatResource(full || updated) }) }] } }, { headers: CORS_HEADERS });
      }

      if (toolName === "delete_academic_resource") {
        const resourceId = String(args.id || "").trim(); if (!resourceId) throw new Error("id is required");
        const existing = await db.query.academicResources.findFirst({ where: eq(academicResources.id, resourceId), columns: { id: true, title: true } }); if (!existing) throw new Error("Academic resource not found: " + resourceId);
        const playlistIds = await db.query.academicPlaylistItems.findMany({ where: eq(academicPlaylistItems.resourceId, resourceId), columns: { playlistId: true } });
        await db.delete(academicResources).where(eq(academicResources.id, resourceId));
        for (const playlistId of [...new Set(playlistIds.map((item) => item.playlistId))]) { const remaining = await db.query.academicPlaylistItems.findMany({ where: eq(academicPlaylistItems.playlistId, playlistId), columns: { id: true } }); await db.update(academicPlaylists).set({ itemsCount: remaining.length, updatedAt: new Date() }).where(eq(academicPlaylists.id, playlistId)); }
        return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, deletedId: resourceId, title: existing.title }) }] } }, { headers: CORS_HEADERS });
      }

      if (toolName === "get_academic_playlist") {
        const target = String(args.idOrSlug || "").trim(); if (!target) throw new Error("idOrSlug is required");
        const playlist = await db.query.academicPlaylists.findFirst({ where: or(eq(academicPlaylists.id, target), eq(academicPlaylists.slug, target)), with: { institution: { columns: { id: true, name: true, slug: true } }, creator: { columns: { id: true, username: true, displayName: true } }, items: { with: { resource: true } } } });
        if (!playlist) throw new Error("Academic playlist not found: " + target);
        if (playlist.visibility !== "PUBLIC" && !isAuthenticated) throw new Error("This playlist is not public.");
        return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(formatPlaylist(playlist), null, 2) }] } }, { headers: CORS_HEADERS });
      }

      if (toolName === "create_academic_playlist") {
        const title = String(args.title || "").trim(); if (!title) throw new Error("title is required"); if (title.length > 200) throw new Error("title must be 200 characters or fewer");
        const branch = typeof args.branch === "string" && args.branch.trim() ? args.branch.trim() : "All";
        const semester = args.semester === undefined || args.semester === null ? null : Number(args.semester); if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 8)) throw new Error("semester must be null or an integer from 1 to 8");
        const category = typeof args.category === "string" ? args.category : "SEMESTER_PACK"; if (!["SEMESTER_PACK","EXAM_PREP","SUBJECT_BUNDLE","GATE","CUSTOM"].includes(category)) throw new Error("Invalid playlist category");
        const visibility = typeof args.visibility === "string" ? args.visibility : "PUBLIC"; if (!["PUBLIC","UNLISTED","PRIVATE"].includes(visibility)) throw new Error("Invalid playlist visibility");
        const dupeConditions = [eq(academicPlaylists.title, title), eq(academicPlaylists.branch, branch), eq(academicPlaylists.category, category), semester === null ? isNull(academicPlaylists.semester) : eq(academicPlaylists.semester, semester)];
        const sameTitle = await db.query.academicPlaylists.findFirst({ where: and(...dupeConditions) });
        if (sameTitle) { const full = await db.query.academicPlaylists.findFirst({ where: eq(academicPlaylists.id, sameTitle.id), with: { institution: { columns: { id: true, name: true, slug: true } }, creator: { columns: { username: true, displayName: true } } } }); return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, duplicate: true, playlist: formatPlaylist(full || sameTitle) }) }] } }, { headers: CORS_HEADERS }); }
        const resolved = await resolveUploaderAndInstitution(db); if (!resolved.uploaderId) throw new Error("No valid creator profile is configured");
        const [created] = await db.insert(academicPlaylists).values({ id: "pl_" + nanoid(12), slug: (slugify(title).slice(0, 60) || "study-pack") + "-" + nanoid(5).toLowerCase(), title, description: typeof args.description === "string" ? args.description.trim().slice(0, 5000) : null, creatorId: resolved.uploaderId, institutionId: resolved.institutionId || null, branch, semester, category, visibility, coverGradient: typeof args.coverGradient === "string" && args.coverGradient.trim() ? args.coverGradient.trim().slice(0, 160) : "from-slate-900 to-stone-900", tags: Array.isArray(args.tags) ? [...new Set(args.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim()).filter(Boolean))].slice(0, 30) : [], isFeatured: false, isVerified: args.isVerified === true, itemsCount: 0 }).returning();
        const resourceIds = Array.isArray(args.resourceIds) ? [...new Set(args.resourceIds.filter((value: unknown): value is string => typeof value === "string" && Boolean(value.trim())).map((value: string) => value.trim()))].slice(0, 100) : [];
        let added = 0;
        for (const resourceId of resourceIds) { const resource = await db.query.academicResources.findFirst({ where: eq(academicResources.id, resourceId), columns: { id: true } }); if (!resource) continue; const exists = await db.query.academicPlaylistItems.findFirst({ where: and(eq(academicPlaylistItems.playlistId, created.id), eq(academicPlaylistItems.resourceId, resourceId)), columns: { id: true } }); if (exists) continue; await db.insert(academicPlaylistItems).values({ playlistId: created.id, resourceId, sortOrder: added, sectionName: "Core Materials" }); added++; }
        if (added) await db.update(academicPlaylists).set({ itemsCount: added, updatedAt: new Date() }).where(eq(academicPlaylists.id, created.id));
        const full = await db.query.academicPlaylists.findFirst({ where: eq(academicPlaylists.id, created.id), with: { institution: { columns: { id: true, name: true, slug: true } }, creator: { columns: { id: true, username: true, displayName: true } }, items: { with: { resource: true } } } });
        return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, duplicate: false, playlist: formatPlaylist(full || created) }, null, 2) }] } }, { headers: CORS_HEADERS });
      }

      if (toolName === "update_academic_playlist") {
        const target = String(args.idOrSlug || "").trim(); if (!target) throw new Error("idOrSlug is required");
        const playlist = await db.query.academicPlaylists.findFirst({ where: or(eq(academicPlaylists.id, target), eq(academicPlaylists.slug, target)) }); if (!playlist) throw new Error("Academic playlist not found: " + target);
        const updates: Record<string, any> = { updatedAt: new Date() };
        if (typeof args.title === "string") updates.title = args.title.trim().slice(0, 200);
        if (typeof args.description === "string") updates.description = args.description.trim().slice(0, 5000);
        if (typeof args.branch === "string") updates.branch = args.branch.trim() || "All";
        if (args.semester !== undefined) { const semester = args.semester === null ? null : Number(args.semester); if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 8)) throw new Error("semester must be null or an integer from 1 to 8"); updates.semester = semester; }
        if (typeof args.category === "string") { if (!["SEMESTER_PACK","EXAM_PREP","SUBJECT_BUNDLE","GATE","CUSTOM"].includes(args.category)) throw new Error("Invalid playlist category"); updates.category = args.category; }
        if (typeof args.visibility === "string") { if (!["PUBLIC","UNLISTED","PRIVATE"].includes(args.visibility)) throw new Error("Invalid playlist visibility"); updates.visibility = args.visibility; }
        if (typeof args.coverGradient === "string") updates.coverGradient = args.coverGradient.trim().slice(0, 160);
        if (Array.isArray(args.tags)) updates.tags = [...new Set(args.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim()).filter(Boolean))].slice(0, 30);
        if (typeof args.isVerified === "boolean") updates.isVerified = args.isVerified;
        if (typeof args.isFeatured === "boolean") updates.isFeatured = args.isFeatured;
        const [updated] = await db.update(academicPlaylists).set(updates).where(eq(academicPlaylists.id, playlist.id)).returning();
        const full = await db.query.academicPlaylists.findFirst({ where: eq(academicPlaylists.id, playlist.id), with: { institution: { columns: { id: true, name: true, slug: true } }, creator: { columns: { username: true, displayName: true } } } });
        return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, playlist: formatPlaylist(full || updated) }) }] } }, { headers: CORS_HEADERS });
      }

      if (toolName === "delete_academic_playlist") {
        const target = String(args.idOrSlug || "").trim(); if (!target) throw new Error("idOrSlug is required");
        const playlist = await db.query.academicPlaylists.findFirst({ where: or(eq(academicPlaylists.id, target), eq(academicPlaylists.slug, target)), columns: { id: true, title: true } });
        if (!playlist) throw new Error("Academic playlist not found: " + target);
        await db.delete(academicPlaylistItems).where(eq(academicPlaylistItems.playlistId, playlist.id));
        await db.delete(academicPlaylists).where(eq(academicPlaylists.id, playlist.id));
        return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, deletedId: playlist.id, title: playlist.title }) }] } }, { headers: CORS_HEADERS });
      }

      if (toolName === "manage_playlist_item") {
        const playlistTarget = String(args.playlistId || "").trim(), resourceId = String(args.resourceId || "").trim(); if (!playlistTarget || !resourceId) throw new Error("playlistId and resourceId are required");
        const playlist = await db.query.academicPlaylists.findFirst({ where: or(eq(academicPlaylists.id, playlistTarget), eq(academicPlaylists.slug, playlistTarget)) }); if (!playlist) throw new Error("Academic playlist not found: " + playlistTarget);
        const resource = await db.query.academicResources.findFirst({ where: eq(academicResources.id, resourceId), columns: { id: true } }); if (!resource) throw new Error("Academic resource not found: " + resourceId);
        const action = typeof args.action === "string" ? args.action.toUpperCase() : "ADD"; if (!["ADD","REMOVE"].includes(action)) throw new Error("action must be ADD or REMOVE");
        const existing = await db.query.academicPlaylistItems.findFirst({ where: and(eq(academicPlaylistItems.playlistId, playlist.id), eq(academicPlaylistItems.resourceId, resourceId)) });
        if (action === "ADD") {
          if (existing) return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, duplicate: true, itemId: existing.id, message: "Resource is already in this playlist" }) }] } }, { headers: CORS_HEADERS });
          const sortOrder = typeof args.sortOrder === "number" && Number.isInteger(args.sortOrder) ? args.sortOrder : playlist.itemsCount;
          const [item] = await db.insert(academicPlaylistItems).values({ playlistId: playlist.id, resourceId, sortOrder, sectionName: typeof args.sectionName === "string" && args.sectionName.trim() ? args.sectionName.trim().slice(0, 120) : "Core Materials", curatorNote: typeof args.curatorNote === "string" ? args.curatorNote.trim().slice(0, 1000) || null : null }).returning();
          const afterAdd = await db.query.academicPlaylistItems.findMany({ where: eq(academicPlaylistItems.playlistId, playlist.id), columns: { id: true } });
          await db.update(academicPlaylists).set({ itemsCount: afterAdd.length, updatedAt: new Date() }).where(eq(academicPlaylists.id, playlist.id));
          return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, duplicate: false, itemId: item.id, playlistId: playlist.id, resourceId }) }] } }, { headers: CORS_HEADERS });
        }
        if (!existing) return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, removed: false, message: "Resource was not in this playlist" }) }] } }, { headers: CORS_HEADERS });
        await db.delete(academicPlaylistItems).where(eq(academicPlaylistItems.id, existing.id));
        const remaining = await db.query.academicPlaylistItems.findMany({ where: eq(academicPlaylistItems.playlistId, playlist.id), columns: { id: true } });
        await db.update(academicPlaylists).set({ itemsCount: remaining.length, updatedAt: new Date() }).where(eq(academicPlaylists.id, playlist.id));
        return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ success: true, removed: true, playlistId: playlist.id, resourceId }) }] } }, { headers: CORS_HEADERS });
      }

      if (toolName === "get_academic_metadata") {
        const metadata = {
          branches: ["Computer Science", "ECE", "Mechanical", "Civil", "Electrical", "Information Technology", "Chemical", "Biotech", "All"],
          semesters: [1, 2, 3, 4, 5, 6, 7, 8],
          resourceTypes: ["NOTES", "PYQ", "LAB_MANUAL", "CHEAT_SHEET", "BOOK", "PPT", "MODULE"],
          playlistCategories: ["SEMESTER_PACK", "EXAM_PREP", "SUBJECT_BUNDLE", "GATE", "CUSTOM"],
        };

        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }],
            },
          },
          { headers: CORS_HEADERS }
        );
      }

      return NextResponse.json(
        { jsonrpc: "2.0", id, error: { code: -32601, message: `Tool '${toolName}' is not implemented yet` } },
        { headers: CORS_HEADERS }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { jsonrpc: "2.0", id, error: { code: -32603, message: "Internal tool execution error", data: message } },
        { headers: CORS_HEADERS }
      );
    }
  }

  return NextResponse.json(
    { jsonrpc: "2.0", id, error: { code: -32601, message: `Method '${method}' not found` } },
    { headers: CORS_HEADERS }
  );
}

// Helpers
// URL and title normalization shared by MCP indexing and deduplication.
function canonicalAcademicUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !url.hostname) return "";
    url.hash = ""; url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) if (key.toLowerCase().startsWith("utm_") || ["ref", "referrer", "source", "campaign", "fbclid", "gclid"].includes(key.toLowerCase())) url.searchParams.delete(key);
    const result = url.toString(); return result.endsWith("/") && url.pathname !== "/" ? result.slice(0, -1) : result;
  } catch { return ""; }
}
function validateAcademicResourceUrl(value: string, fieldName: string): string {
  const canonical = canonicalAcademicUrl(value); if (!canonical) throw new Error(fieldName + " must be a valid public HTTPS URL");
  if (/academic-sample[.]pdf|campusloop-demo|(^|[.])example[.]com([/:]|$)|placeholder|sample[.]pdf/i.test(canonical)) throw new Error(fieldName + " points to a demo/placeholder source and cannot be published");
  return canonical;
}
function normalizeAcademicTitle(value: string): string {
  return String(value || "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function inferAcademicAttachmentType(value: string): string {
  const url = new URL(value), path = url.pathname.toLowerCase();
  if (path.endsWith(".pdf")) return "PDF";
  if (path.endsWith(".ppt") || path.endsWith(".pptx")) return "PPT";
  if (path.endsWith(".doc") || path.endsWith(".docx")) return "DOCX";
  if (path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".webp")) return "IMAGE";
  if (url.hostname.includes("drive.google.com")) return "DRIVE";
  if (path.endsWith(".mp4") || path.endsWith(".m3u8")) return "VIDEO";
  return "LINK";
}
function isPlaceholderAcademicResource(res: any): boolean {
  const sources = [res?.fileUrl, res?.driveUrl, ...(Array.isArray(res?.attachments) ? res.attachments.map((attachment: any) => attachment?.url) : [])];
  return /academic-sample[.]pdf|campusloop-demo|placeholder|sample[.]pdf/i.test(sources.filter(Boolean).join(" "));
}

function formatResource(res: any) {
  return {
    id: res.id,
    title: res.title,
    description: res.description,
    subjectCode: res.subjectCode,
    subjectName: res.subjectName,
    branch: res.branch,
    semester: res.semester,
    resourceType: res.resourceType,
    moduleOrChapter: res.moduleOrChapter,
    fileUrl: res.fileUrl,
    driveUrl: res.driveUrl,
    attachments: res.attachments || [],
    tags: res.tags || [],
    upvotesCount: res.upvotesCount || 0,
    downloadsCount: res.downloadsCount || 0,
    viewsCount: res.viewsCount || 0,
    isVerified: Boolean(res.isVerified) && !isPlaceholderAcademicResource(res),
    institution: res.institution ? { id: res.institution.id, name: res.institution.name, slug: res.institution.slug } : null,
    uploader: res.uploader ? { username: res.uploader.username, displayName: res.uploader.displayName } : null,
    publicUrl: "https://campusloop.space/academics/" + res.id,
    createdAt: res.createdAt,
    updatedAt: res.updatedAt,
  };
}

function formatPlaylist(pl: any) {
  return {
    id: pl.id,
    slug: pl.slug,
    title: pl.title,
    description: pl.description,
    branch: pl.branch,
    semester: pl.semester,
    category: pl.category,
    visibility: pl.visibility,
    coverGradient: pl.coverGradient,
    starsCount: pl.starsCount || 0,
    viewsCount: pl.viewsCount || 0,
    itemsCount: pl.itemsCount || 0,
    isVerified: pl.isVerified,
    isFeatured: pl.isFeatured,
    tags: pl.tags || [],
    institution: pl.institution ? { id: pl.institution.id, name: pl.institution.name } : null,
    creator: pl.creator ? { username: pl.creator.username, displayName: pl.creator.displayName } : null,
    items: Array.isArray(pl.items)
      ? pl.items.map((item: any) => ({
          id: item.id,
          sectionName: item.sectionName,
          sortOrder: item.sortOrder,
          curatorNote: item.curatorNote,
          resource: item.resource ? formatResource(item.resource) : null,
        }))
      : undefined,
    publicUrl: `https://campusloop.space/academics/playlists/${pl.slug}`,
    createdAt: pl.createdAt,
    updatedAt: pl.updatedAt,
  };
}

function getDocumentationHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampusLoop MCP Academic Vault & Notes Engine</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #18181b;
      --border: #27272a;
      --primary: #f97316;
      --foreground: #fafafa;
      --muted: #a1a1aa;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--foreground);
      margin: 0;
      padding: 2rem 1rem;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 0.5rem;
      color: #fff;
    }
    .badge {
      display: inline-block;
      background: rgba(249, 115, 22, 0.15);
      color: var(--primary);
      border: 1px solid rgba(249, 115, 22, 0.3);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    code {
      background: #27272a;
      padding: 0.2rem 0.4rem;
      border-radius: 0.375rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875rem;
    }
    pre {
      background: #121215;
      border: 1px solid var(--border);
      padding: 1rem;
      border-radius: 0.75rem;
      overflow-x: auto;
      font-size: 0.875rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .tool-item {
      background: #202024;
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
    }
    .tool-name {
      font-weight: 700;
      color: var(--primary);
      font-family: monospace;
      margin-bottom: 0.25rem;
    }
    .method {
      display: inline-block;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      margin-right: 0.5rem;
    }
    .get { background: #15803d; color: #fff; }
    .post { background: #0369a1; color: #fff; }
    .put { background: #b45309; color: #fff; }
    .delete { background: #b91c1c; color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">CampusLoop Developer & AI Agent Protocol</span>
    <h1>Academic Vault & Notes MCP Engine</h1>
    <p style="color: var(--muted); margin-bottom: 2rem;">
      Programmatically search, curate, and index verified engineering notes, PYQs, and semester packs across 1,350+ Indian colleges.
    </p>

    <div class="card">
      <h2 style="margin-top:0;">1. Quick Integration for Composio & Cursor</h2>
      <p>Add this endpoint URL directly into Composio, Cursor, or your MCP client:</p>
      <pre><code>https://campusloop.space/mcp/academics?apikey=YOUR_API_KEY</code></pre>
      <p>Or import the pure OpenAPI 3.1.0 specification:</p>
      <pre><code>https://campusloop.space/mcp/academics/openapi.json</code></pre>
    </div>

    <div class="card">
      <h2 style="margin-top:0;">2. Available MCP Tools</h2>
      <div class="grid">
        <div class="tool-item">
          <div class="tool-name">list_academic_resources</div>
          <div style="font-size: 0.8125rem; color: var(--muted);">Search notes, PYQs, and books by branch, semester, or course code.</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">get_academic_resource</div>
          <div style="font-size: 0.8125rem; color: var(--muted);">Get full PDF links, drive links, and tags for a resource.</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">create_academic_resource</div>
          <div style="font-size: 0.8125rem; color: var(--muted);">Add verified study notes or formula sheets. (Requires API key).</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">update_academic_resource</div>
          <div style="font-size: 0.8125rem; color: var(--muted);">Update links, tags, or verified badge. (Requires API key).</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">delete_academic_resource</div>
          <div style="font-size: 0.8125rem; color: var(--muted);">Remove resource from Vault. (Requires API key).</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">list_academic_playlists</div>
          <div style="font-size: 0.8125rem; color: var(--muted);">Explore semester bundles and exam packages.</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">create_academic_playlist</div>
          <div style="font-size: 0.8125rem; color: var(--muted);">Create a bundle or semester pack. (Requires API key).</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">manage_playlist_item</div>
          <div style="font-size: 0.8125rem; color: var(--muted);">Add or remove resources from a playlist.</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 style="margin-top:0;">3. REST Endpoints</h2>
      <p><span class="method get">GET</span> <code>/mcp/academics</code> — Public search & discovery (no auth required)</p>
      <p><span class="method post">POST</span> <code>/mcp/academics?apikey=...</code> — Create resource or playlist</p>
      <p><span class="method put">PUT</span> <code>/mcp/academics?apikey=...</code> — Update resource or manage playlist items</p>
      <p><span class="method delete">DELETE</span> <code>/mcp/academics?id=...&apikey=...</code> — Delete resource or playlist</p>
    </div>
  </div>
</body>
</html>`;
}
