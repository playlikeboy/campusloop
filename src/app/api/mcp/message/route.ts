import { NextResponse } from "next/server";
import { authenticateMcpKey, extractMcpKeyFromRequest } from "@/lib/mcp/auth";
import { handleMcpJsonRpc } from "@/lib/mcp/server";
import type { JsonRpcRequest } from "@/lib/mcp/types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-campusloop-mcp-key, x-mcp-key",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  const key = extractMcpKeyFromRequest(req);
  if (!key) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Unauthorized: Missing MCP key" },
      },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  let context;
  try {
    context = await authenticateMcpKey(key, req.headers.get("user-agent"));
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: `Auth error: ${err?.message}` },
      },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  let body: JsonRpcRequest;
  try {
    body = (await req.json()) as JsonRpcRequest;
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Invalid JSON payload" },
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
