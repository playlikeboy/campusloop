import { NextResponse } from "next/server";
import { authenticateMcpKey, extractMcpKeyFromRequest } from "@/lib/mcp/auth";
import { handleMcpJsonRpc } from "@/lib/mcp/server";
import { CAMPUSLOOP_MCP_TOOLS } from "@/lib/mcp/tools-catalog";
import type { JsonRpcRequest } from "@/lib/mcp/types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-campusloop-mcp-key, x-mcp-key",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: Request) {
  const key = extractMcpKeyFromRequest(req);

  return NextResponse.json(
    {
      service: "CampusLoop Model Context Protocol (MCP) Server",
      protocolVersion: "2024-11-05",
      status: "ONLINE",
      authenticated: Boolean(key),
      documentation: "Connect this endpoint to Cursor, Windsurf, Claude Desktop, Cline, or any AI agent.",
      endpoints: {
        streamableHttp: "/api/mcp",
        sse: "/api/mcp/sse",
        message: "/api/mcp/message?sessionId=SESSION_ID",
      },
      availableToolsCount: CAMPUSLOOP_MCP_TOOLS.length,
      sampleIdeConfig: {
        cursor: {
          mcpServers: {
            campusloop: {
              url: "https://campusloop.space/api/mcp",
              headers: {
                Authorization: "Bearer YOUR_MCP_KEY",
              },
            },
          },
        },
      },
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: Request) {
  const key = extractMcpKeyFromRequest(req);
  if (!key) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message:
            "Unauthorized: Missing MCP API key. Provide via Authorization: Bearer cl_mcp_... or x-campusloop-mcp-key header.",
        },
      },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const clientInfo = req.headers.get("user-agent") || null;

  let context;
  try {
    context = await authenticateMcpKey(key, clientInfo);
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message: `Authentication failed: ${err?.message || "Invalid MCP key"}`,
        },
      },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  let body: JsonRpcRequest;
  try {
    const raw = await req.json();
    body = raw as JsonRpcRequest;
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error: Invalid JSON was received by the server",
        },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const response = await handleMcpJsonRpc(body, context);

  return NextResponse.json(response, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
