import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, X-API-KEY",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const openApiDoc = {
    openapi: "3.1.0",
    info: {
      title: "CampusLoop Academic Vault & Notes Engine",
      version: "1.0.0",
      description:
        "Programmatically search, upload, organize, and curate university study materials, PYQs, and semester packs across 1,350+ Indian colleges.",
      contact: {
        name: "CampusLoop Academics Team",
        url: "https://campusloop.space/academics",
        email: "support@mail.campsy.app",
      },
    },
    servers: [
      {
        url: "https://campusloop.space",
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
                    isVerified: { type: "boolean", default: true },
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

  return NextResponse.json(openApiDoc, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
