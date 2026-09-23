import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { authenticateMcpKey, extractMcpKeyFromRequest } from "@/lib/mcp/auth";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
  if (!key) {
    return new NextResponse("Unauthorized: Missing MCP key", {
      status: 401,
      headers: CORS_HEADERS,
    });
  }

  try {
    await authenticateMcpKey(key);
  } catch (err: any) {
    return new NextResponse(`Authentication failed: ${err?.message}`, {
      status: 401,
      headers: CORS_HEADERS,
    });
  }

  const sessionId = randomUUID();
  const endpointUrl = `/api/mcp/message?sessionId=${sessionId}&key=${encodeURIComponent(key)}`;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      // Send initial endpoint event per MCP spec
      controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpointUrl}\n\n`));

      // Heartbeat keep-alive every 20 seconds
      const timer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          clearInterval(timer);
        }
      }, 20000);

      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        try {
          controller.close();
        } catch {}
      });
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
