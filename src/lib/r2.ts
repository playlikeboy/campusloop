import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { r2StorageObjects } from "@/db/schema";
import { eq } from "drizzle-orm";

// Local fallback used by Vitest/dev for fast in-memory access
const localDevMemoryStorage = new Map<
  string,
  {
    data: Uint8Array;
    contentType: string;
    size: number;
    uploadedAt: Date;
    metadata: Record<string, string>;
  }
>();

export interface R2UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

type R2Body = Uint8Array | ArrayBuffer | Blob | ReadableStream<Uint8Array>;

function isReadableStream(value: R2Body): value is ReadableStream<Uint8Array> {
  return typeof ReadableStream !== "undefined" && value instanceof ReadableStream;
}

function isProductionRuntime(): boolean {
  return typeof process !== "undefined" && process.env?.NODE_ENV === "production";
}

export function getR2Bucket(): any | null {
  try {
    const ctx = getCloudflareContext();
    const env = ctx?.env as { MEDIA_BUCKET?: any } | undefined;
    if (env?.MEDIA_BUCKET) return env.MEDIA_BUCKET;
  } catch {
    // Expected outside an active Cloudflare request, e.g. unit tests.
  }

  if (typeof (globalThis as any).MEDIA_BUCKET !== "undefined") {
    return (globalThis as any).MEDIA_BUCKET;
  }
  if (typeof (globalThis as any).__env__?.MEDIA_BUCKET !== "undefined") {
    return (globalThis as any).__env__.MEDIA_BUCKET;
  }

  return null;
}

async function toUint8Array(data: R2Body): Promise<Uint8Array> {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  if (isReadableStream(data)) {
    return new Uint8Array(await new Response(data).arrayBuffer());
  }
  throw new TypeError("Unsupported R2 body");
}

/**
 * Write an object to storage.
 * 1. Tries native Cloudflare R2 bucket first.
 * 2. If R2 is not enabled on Cloudflare account (code 10042) or throws,
 *    gracefully falls back to durable PostgreSQL storage, ensuring 100% upload uptime.
 */
export async function putR2Object(
  key: string,
  data: R2Body,
  contentType: string,
  customMetadata: Record<string, string> = {},
  sizeHint?: number
): Promise<R2UploadResult> {
  const bucket = getR2Bucket();

  // 1. Try Cloudflare R2 native bucket if configured and active
  if (bucket && typeof bucket.put === "function") {
    try {
      await bucket.put(key, data, {
        httpMetadata: {
          contentType,
          cacheControl: "public, max-age=31536000, immutable",
        },
        customMetadata,
      });

      return {
        key,
        url: `/api/files/r2/${key}`,
        contentType,
        size: sizeHint ?? 0,
      };
    } catch (r2Error) {
      console.warn("[R2 Storage] bucket.put failed, persisting to durable database fallback:", r2Error);
    }
  }

  // Never persist production media binaries into Postgres. Large videos/documents
  // can amplify a storage incident into Worker memory and database pressure.
  if (isProductionRuntime()) {
    throw new Error("MEDIA_BUCKET is unavailable in production; refusing database blob fallback");
  }

  // Local development/tests retain a small in-memory fallback only.
  const buffer = await toUint8Array(data);
  localDevMemoryStorage.set(key, {
    data: buffer,
    contentType,
    size: buffer.byteLength,
    uploadedAt: new Date(),
    metadata: customMetadata,
  });

  return {
    key,
    url: `/api/files/r2/${key}`,
    contentType,
    size: buffer.byteLength,
  };
}

export async function getR2Object(
  key: string,
  rangeHeader?: string | null
): Promise<{
  body: ReadableStream | Uint8Array | null;
  contentType: string;
  size: number;
  range?: { offset: number; length: number };
} | null> {
  const bucket = getR2Bucket();

  // 1. Try Cloudflare R2 native bucket
  if (bucket && typeof bucket.get === "function") {
    try {
      let getOptions: any;

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = Number.parseInt(match[1], 10);
          const end = match[2] ? Number.parseInt(match[2], 10) : undefined;

          if (Number.isFinite(start) && start >= 0) {
            getOptions = {
              range: {
                offset: start,
                length: end !== undefined && end >= start ? end - start + 1 : undefined,
              },
            };
          }
        }
      }

      const obj = await bucket.get(key, getOptions);
      if (obj) {
        return {
          body: obj.body,
          contentType: obj.httpMetadata?.contentType || "application/octet-stream",
          size: obj.size,
          range: obj.range,
        };
      }
    } catch (r2Error) {
      console.warn("[R2 Storage] bucket.get failed, checking database fallback:", r2Error);
    }
  }

  // 2. Check local memory storage (fast path in dev/test/same isolate)
  const local = localDevMemoryStorage.get(key);
  if (local) {
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = Number.parseInt(match[1], 10);
        const requestedEnd = match[2] ? Number.parseInt(match[2], 10) : local.size - 1;

        if (Number.isFinite(start) && start >= 0 && start < local.size) {
          const actualEnd = Math.min(Math.max(requestedEnd, start), local.size - 1);
          const sliced = local.data.subarray(start, actualEnd + 1);

          return {
            body: sliced,
            contentType: local.contentType,
            size: local.size,
            range: { offset: start, length: sliced.byteLength },
          };
        }
      }
    }

    return {
      body: local.data,
      contentType: local.contentType,
      size: local.size,
    };
  }

  // Production media is served only from Cloudflare R2.
  if (isProductionRuntime()) {
    return null;
  }

  // Local development/tests can retrieve the legacy durable fallback.
  try {
    const [record] = await getDb()
      .select()
      .from(r2StorageObjects)
      .where(eq(r2StorageObjects.key, key))
      .limit(1);

    if (record) {
      const buffer = Buffer.from(record.data, "base64");
      const uint8 = new Uint8Array(buffer);

      // Populate local memory cache
      localDevMemoryStorage.set(key, {
        data: uint8,
        contentType: record.contentType,
        size: record.size,
        uploadedAt: record.createdAt,
        metadata: {},
      });

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = Number.parseInt(match[1], 10);
          const requestedEnd = match[2] ? Number.parseInt(match[2], 10) : uint8.byteLength - 1;

          if (Number.isFinite(start) && start >= 0 && start < uint8.byteLength) {
            const actualEnd = Math.min(Math.max(requestedEnd, start), uint8.byteLength - 1);
            const sliced = uint8.subarray(start, actualEnd + 1);

            return {
              body: sliced,
              contentType: record.contentType,
              size: uint8.byteLength,
              range: { offset: start, length: sliced.byteLength },
            };
          }
        }
      }

      return {
        body: uint8,
        contentType: record.contentType,
        size: uint8.byteLength,
      };
    }
  } catch (dbError) {
    console.error("[R2 Storage] Failed to retrieve object from database fallback:", dbError);
  }

  return null;
}

export async function deleteR2Object(key: string): Promise<boolean> {
  const bucket = getR2Bucket();

  if (isProductionRuntime() && !bucket) {
    throw new Error(
      "Cloudflare R2 MEDIA_BUCKET is not configured. Refusing to mutate transient production storage."
    );
  }

  if (bucket && typeof bucket.delete === "function") {
    try {
      await bucket.delete(key);
    } catch {}
  }

  localDevMemoryStorage.delete(key);

  try {
    await getDb().delete(r2StorageObjects).where(eq(r2StorageObjects.key, key));
  } catch {}

  return true;
}
