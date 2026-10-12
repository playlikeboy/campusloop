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
  const apikey = url.searchParams.get("apikey") || url.searchParams.get("api_key") || "";

  const openApiDoc = {
    openapi: "3.1.0",
    info: {
      title: "CampusLoop Remote Events & Opportunities Engine",
      version: "1.0.0",
      description:
        "Programmatically discover campus hackathons and publish external remote opportunities to 1,350+ university feeds across India.",
    },
    servers: [
      {
        url: "https://campusloop.space",
        description: "CampusLoop Production Server",
      },
    ],
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
              description: "Filter by mode (ONLINE = Remote, OFFLINE = On-Campus)",
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

  return NextResponse.json(openApiDoc, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}
