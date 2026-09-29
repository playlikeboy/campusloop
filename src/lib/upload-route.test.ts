import { describe, expect, it, vi } from "vitest";
import { POST as uploadRoute } from "@/app/api/upload/route";
import { NextRequest } from "next/server";

// Mock hexclave authentication
vi.mock("@/hexclave/server", () => ({
  hexclaveServerApp: {
    getUser: vi.fn(),
  },
}));

import { hexclaveServerApp } from "@/hexclave/server";

describe("Upload Route API Security & Handling", () => {
  it("should reject unauthenticated upload requests with 401", async () => {
    (hexclaveServerApp.getUser as any).mockResolvedValue(null);

    const formData = new FormData();
    formData.append("file", new File(["test content"], "photo.jpg", { type: "image/jpeg" }));

    const req = new NextRequest("https://campusloop.space/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await uploadRoute(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Please sign in");
  });

  it("should reject dangerous executable files with 400", async () => {
    (hexclaveServerApp.getUser as any).mockResolvedValue({ id: "user_123" });

    const dangerousFiles = [
      { name: "malware.exe", type: "application/x-msdownload" },
      { name: "script.sh", type: "application/x-sh" },
      { name: "exploit.php", type: "application/x-php" },
      { name: "payload.bat", type: "application/x-bat" },
    ];

    for (const item of dangerousFiles) {
      const formData = new FormData();
      formData.append("file", new File(["dangerous"], item.name, { type: item.type }));

      const req = new NextRequest("https://campusloop.space/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("security reasons");
    }
  });

  it("should successfully upload safe media and return R2 file URL", async () => {
    (hexclaveServerApp.getUser as any).mockResolvedValue({ id: "user_test_456" });

    const formData = new FormData();
    formData.append(
      "file",
      new File([new Uint8Array([1, 2, 3, 4])], "notes.pdf", { type: "application/pdf" })
    );
    formData.append("category", "document");

    const req = new NextRequest("https://campusloop.space/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await uploadRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.url).toContain("/api/files/r2/documents/user_test_456/");
    expect(json.type).toBe("document");
    expect(json.provider).toBe("r2");
    expect(json.size).toBe(4);
  });
});
