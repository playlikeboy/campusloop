import { type NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/r2";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ key: string[] }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { key: keyParts } = await params;
    if (!keyParts || keyParts.length === 0) {
      return new NextResponse("File key required", { status: 400 });
    }

    // Prevent path traversal attacks
    if (keyParts.some((part) => part.includes("..") || part.includes("\0"))) {
      return new NextResponse("Invalid file path", { status: 400 });
    }

    const key = keyParts.join("/");
    const rangeHeader = req.headers.get("range");

    const obj = await getR2Object(key, rangeHeader);
    if (!obj) {
      return new NextResponse("File not found", { status: 404 });
    }

    const headers = new Headers();
    const contentType = (obj.contentType || "application/octet-stream").toLowerCase();
    headers.set("Content-Type", contentType);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // Prevent Stored XSS: If the object is HTML, SVG, or scriptable, sandboxed CSP and attachment disposition are enforced
    if (
      contentType.includes("html") ||
      contentType.includes("svg") ||
      contentType.includes("javascript") ||
      contentType.includes("xml")
    ) {
      headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
      headers.set("Content-Disposition", "attachment");
      headers.set("X-Frame-Options", "DENY");
    }

    // Check if Range was requested and fulfilled
    if (obj.range && rangeHeader) {
      const start = obj.range.offset;
      const end = obj.range.offset + obj.range.length - 1;
      headers.set("Content-Range", `bytes ${start}-${end}/${obj.size}`);
      headers.set("Content-Length", obj.range.length.toString());

      return new NextResponse(obj.body as any, {
        status: 206,
        headers,
      });
    }

    headers.set("Content-Length", obj.size.toString());
    return new NextResponse(obj.body as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Storage file stream error:", error);
    return new NextResponse("Failed to stream file", { status: 500 });
  }
}
