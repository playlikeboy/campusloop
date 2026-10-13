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
      title: "CampusLoop Articles & Student Journalism MCP Engine",
      version: "1.0.0",
      description:
        "Programmatically search, author, curate, publish, and manage student long-reads, tech deep-dives, placement guides, and campus stories across 1,350+ Indian colleges.",
      contact: {
        name: "CampusLoop Editorial & Articles Team",
        url: "https://campusloop.space/articles",
        email: "support@mail.campsy.app",
      },
    },
    servers: [
      {
        url: "https://campusloop.space",
        description: "CampusLoop Production API Server",
      },
      {
        url: url.origin,
        description: "Current Host",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyQuery: {
          type: "apiKey",
          in: "query",
          name: "apikey",
          description: "Admin & MCP authorization key supplied as URL query parameter",
        },
        ApiKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "Admin & MCP authorization key supplied via HTTP header",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Admin & MCP authorization key supplied as HTTP Bearer token",
        },
      },
    },
    security: [{ ApiKeyQuery: [] }, { ApiKeyHeader: [] }, { BearerAuth: [] }],
    paths: {
      "/mcp/articles": {
        get: {
          operationId: "list_articles",
          summary: "List, filter, and search campus articles",
          description:
            "Query published student articles, placement guides, tutorials, and long-reads with pagination, full-text search, and category filtering.",
          parameters: [
            {
              name: "q",
              in: "query",
              schema: { type: "string" },
              description: "Search keyword matching title, excerpt, content, or tags",
            },
            {
              name: "category",
              in: "query",
              schema: { type: "string" },
              description: "Filter by article category key (e.g. AI_AND_ML, WEB_DEVELOPMENT, PLACEMENTS, DSA)",
            },
            {
              name: "tag",
              in: "query",
              schema: { type: "string" },
              description: "Filter by specific tag without # prefix (e.g. react, leetcode, internship)",
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"], default: "PUBLISHED" },
              description: "Filter by publication status (drafts/archived require valid apikey)",
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1, minimum: 1 },
              description: "Page number for pagination",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20, maximum: 100 },
              description: "Number of articles per page",
            },
            {
              name: "apikey",
              in: "query",
              schema: { type: "string" },
              description: "Superpowers API key for drafts and privileged views",
            },
          ],
          responses: {
            "200": {
              description: "List of articles and category catalog",
            },
          },
        },
        post: {
          operationId: "create_article",
          summary: "Create and publish a new student article or guide",
          description:
            "Author and publish an article with markdown content, cover image, category, tags, and optional external resource links.",
          parameters: [
            {
              name: "apikey",
              in: "query",
              schema: { type: "string" },
              description: "Secret API key for MCP authorization",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "content"],
                  properties: {
                    title: { type: "string", description: "Title of the article" },
                    content: { type: "string", description: "Full markdown or rich text body of the article" },
                    subtitle: { type: "string", description: "Optional catchy subtitle" },
                    excerpt: { type: "string", description: "Short summary (auto-generated if omitted)" },
                    category: { type: "string", description: "Category key or slug (e.g. TECH_AND_PROGRAMMING, AI_AND_ML, PLACEMENTS)" },
                    tags: { type: "array", items: { type: "string" }, description: "Tags list (e.g. ['nextjs', 'fullstack', 'react'])" },
                    coverImageUrl: { type: "string", description: "Direct HTTPS URL for cover banner image" },
                    status: { type: "string", enum: ["PUBLISHED", "DRAFT", "ARCHIVED"], default: "PUBLISHED" },
                    authorId: { type: "string", description: "Optional author profile ID to attribute article to" },
                    isFeatured: { type: "boolean", description: "Whether to pin to featured carousel" },
                    isDemo: { type: "boolean", description: "Whether to mark as demo fixture" },
                    links: {
                      type: "array",
                      description: "External resources and links to attach",
                      items: {
                        type: "object",
                        required: ["url", "label"],
                        properties: {
                          url: { type: "string" },
                          label: { type: "string" },
                          description: { type: "string" },
                          type: { type: "string", enum: ["GITHUB", "DOCS", "DEMO", "REFERENCE", "PAPER", "RESOURCE"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Article created successfully" },
            "401": { description: "Unauthorized - Invalid or missing API key" },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiDoc, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
