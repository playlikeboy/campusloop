import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { getR2Object } from "@/lib/r2";
import { timingSafeCompare } from "@/lib/security/timing";

export const dynamic = "force-dynamic";
interface RouteParams {
  params: Promise<{ key: string[] }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const uploadApiKey = process.env.UPLOAD_API_KEY || process.env.ADMIN_PASSKEY || "";
    const { key: keyParts } = await params;
    if (!keyParts || keyParts.length === 0) {
      return new NextResponse("File key required", { status: 400 });
    }

    // Prevent path traversal attacks
    if (keyParts.some((part) => part.includes("..") || part.includes("\0") || part.includes("/") || part.includes("\\"))) {
      return new NextResponse("Invalid file path", { status: 400 });
    }

    const key = keyParts.join("/");
    const rangeHeader = req.headers.get("range");

    const obj = await getR2Object(key, rangeHeader);
    if (!obj) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Identify private student documents
    const isPrivateDoc =
      keyParts[0] === "private" ||
      obj.customMetadata?.isPrivate === "true" ||
      obj.customMetadata?.privacy === "private";

    if (isPrivateDoc) {
      let currentUserId: string | null = null;
      let isAdmin = false;

      // 1. Check API token / Admin passkey
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
      const apiKeyHeader =
        req.headers.get("x-api-key") ||
        req.headers.get("x-admin-key") ||
        req.headers.get("x-admin-passkey") ||
        "";

      if (
        (uploadApiKey && timingSafeCompare(token, uploadApiKey)) ||
        (uploadApiKey && timingSafeCompare(apiKeyHeader, uploadApiKey))
      ) {
        currentUserId = "admin_api_user";
        isAdmin = true;
      }

      // 2. Check Hexclave student session
      if (!currentUserId) {
        try {
          const hexUser = await hexclaveServerApp.getUser();
          if (hexUser?.id) {
            currentUserId = hexUser.id;
            const db = getDb();
            const profile = await db.query.userProfiles.findFirst({
              where: eq(userProfiles.userId, hexUser.id),
              columns: { id: true, role: true },
            });
            if (profile) {
              if (profile.role === "ADMIN") isAdmin = true;
              // Allow either Hexclave userId or student profile id
              if (profile.id) currentUserId = profile.id;
            }
          }
        } catch {
          currentUserId = null;
        }
      }

      if (!currentUserId) {
        return new NextResponse("Unauthorized: Authentication required to access private student documents", {
          status: 401,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
      }

      // 3. Ownership verification
      const uploaderId =
        obj.customMetadata?.uploadedBy || (keyParts[0] === "private" ? keyParts[1] : null);
      const isOwner =
        uploaderId &&
        (currentUserId === uploaderId ||
          currentUserId.replace(/[^a-zA-Z0-9_-]/g, "") === uploaderId);

      if (!isOwner && !isAdmin) {
        return new NextResponse("Forbidden: You do not have permission to access this student document", {
          status: 403,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
      }
    }

    const headers = new Headers();
    const contentType = (obj.contentType || "application/octet-stream").toLowerCase();
    headers.set("Content-Type", contentType);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Accept-Ranges", "bytes");

    // Private student documents MUST NEVER be served with Cache-Control: public
    if (isPrivateDoc) {
      headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
    } else {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

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
