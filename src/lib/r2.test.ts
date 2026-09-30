import { describe, expect, it } from "vitest";
import { deleteR2Object, getR2Object, putR2Object } from "./r2";

describe("R2 Cloudflare Storage Engine", () => {
  it("should successfully put an object into storage and return correct metadata", async () => {
    const key = "test/probe-1.txt";
    const testData = new TextEncoder().encode("Hello CampusLoop R2 Storage!");
    const contentType = "text/plain";

    const result = await putR2Object(key, testData, contentType, { tag: "verification" });

    expect(result.key).toBe(key);
    expect(result.url).toBe(`/api/files/r2/${key}`);
    expect(result.contentType).toBe(contentType);
    expect(result.size).toBe(testData.byteLength);
  });

  it("should retrieve stored objects with correct content type and data", async () => {
    const key = "test/probe-get.json";
    const payload = JSON.stringify({ status: "ok", app: "campusloop" });
    const bytes = new TextEncoder().encode(payload);

    await putR2Object(key, bytes, "application/json");

    const retrieved = await getR2Object(key);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.contentType).toBe("application/json");
    expect(retrieved?.size).toBe(bytes.byteLength);

    if (retrieved?.body instanceof Uint8Array) {
      const decoded = new TextDecoder().decode(retrieved.body);
      expect(decoded).toBe(payload);
    }
  });

  it("should return null when getting non-existent objects", async () => {
    const nonExistent = await getR2Object("non-existent-key-12345");
    expect(nonExistent).toBeNull();
  });

  it("should support HTTP byte range slicing for media streaming", async () => {
    const key = "test/range-probe.mp4";
    const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    await putR2Object(key, data, "video/mp4");
    const ranged = await getR2Object(key, "bytes=2-6");

    expect(ranged).not.toBeNull();
    expect(ranged?.range).toEqual({ offset: 2, length: 5 });
    expect(ranged?.size).toBe(10);
    if (ranged?.body instanceof Uint8Array) {
      expect(Array.from(ranged.body)).toEqual([2, 3, 4, 5, 6]);
    }
  });

  it("should successfully delete objects from storage", async () => {
    const key = "test/delete-target.txt";
    const data = new TextEncoder().encode("to be deleted");

    await putR2Object(key, data, "text/plain");
    const before = await getR2Object(key);
    expect(before).not.toBeNull();

    const deleted = await deleteR2Object(key);
    expect(deleted).toBe(true);

    const after = await getR2Object(key);
    expect(after).toBeNull();
  });

  it("should fail clearly in production mode if required R2 binding is missing", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalVitest = process.env.VITEST;
    try {
      // Emulate production environment without Vitest override
      delete (process.env as any).VITEST;
      (process.env as any).NODE_ENV = "production";

      const key = "test/prod-probe.mp4";
      const data = new Uint8Array([1, 2, 3]);

      await expect(putR2Object(key, data, "video/mp4")).rejects.toThrow(
        /MEDIA_BUCKET/
      );

      await expect(getR2Object(key)).rejects.toThrow(/MEDIA_BUCKET/);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalVitest) process.env.VITEST = originalVitest;
    }
  });
});
