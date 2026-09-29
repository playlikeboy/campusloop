import { describe, expect, it } from "vitest";
import { GET as getFileRoute } from "@/app/api/files/r2/[...key]/route";
import { deleteR2Object, getR2Object, putR2Object } from "@/lib/r2";
import { NextRequest } from "next/server";

describe("R2 File Storage & Delivery Pipeline", () => {
  it("should upload binary image and retrieve it via GET route with correct headers", async () => {
    const key = "images/user_test/2026-09-29/avatar.png";
    const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG Magic Bytes
    
    // Put to storage
    const putRes = await putR2Object(key, fakePng, "image/png", { userId: "user_test" });
    expect(putRes.url).toBe(`/api/files/r2/${key}`);
    expect(putRes.size).toBe(8);

    // Request via Route
    const req = new NextRequest(`https://campusloop.space/api/files/r2/${key}`);
    const res = await getFileRoute(req, {
      params: Promise.resolve({ key: key.split("/") }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");

    const bodyBytes = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(bodyBytes)).toEqual(Array.from(fakePng));
  });

  it("should handle video range requests with HTTP 206 Partial Content", async () => {
    const key = "videos/user_test/2026-09-29/sample.mp4";
    const videoData = new Uint8Array(100).map((_, i) => i);

    await putR2Object(key, videoData, "video/mp4");

    const req = new NextRequest(`https://campusloop.space/api/files/r2/${key}`, {
      headers: { range: "bytes=10-24" },
    });
    const res = await getFileRoute(req, {
      params: Promise.resolve({ key: key.split("/") }),
    });

    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 10-24/100");
    expect(res.headers.get("Content-Length")).toBe("15");
    expect(res.headers.get("Content-Type")).toBe("video/mp4");

    const sliced = new Uint8Array(await res.arrayBuffer());
    expect(sliced.length).toBe(15);
    expect(sliced[0]).toBe(10);
    expect(sliced[14]).toBe(24);
  });

  it("should block path traversal attacks with HTTP 400", async () => {
    const maliciousReq = new NextRequest("https://campusloop.space/api/files/r2/../../etc/passwd");
    const res = await getFileRoute(maliciousReq, {
      params: Promise.resolve({ key: ["..", "..", "etc", "passwd"] }),
    });

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe("Invalid file path");
  });

  it("should enforce sandboxed CSP and attachment disposition for dangerous content types", async () => {
    const key = "documents/user_test/2026-09-29/script.html";
    const htmlPayload = new TextEncoder().encode("<script>alert('xss')</script>");

    await putR2Object(key, htmlPayload, "text/html");

    const req = new NextRequest(`https://campusloop.space/api/files/r2/${key}`);
    const res = await getFileRoute(req, {
      params: Promise.resolve({ key: key.split("/") }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
    expect(res.headers.get("Content-Disposition")).toBe("attachment");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("should return HTTP 404 when file does not exist", async () => {
    const req = new NextRequest("https://campusloop.space/api/files/r2/non-existent-file.jpg");
    const res = await getFileRoute(req, {
      params: Promise.resolve({ key: ["non-existent-file.jpg"] }),
    });

    expect(res.status).toBe(404);
  });
});
