import { getCloudflareContext } from "@opennextjs/cloudflare";

// Local fallback used by Vitest/dev only. Production uploads must use a real
// Cloudflare R2 binding and must never silently fall back to transient memory.
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
 * Write an object to R2. ReadableStreams are forwarded directly to R2 in
 * production so video/audio uploads are not unnecessarily buffered twice.
 */
export async function putR2Object(
  key: string,
  data: R2Body,
  contentType: string,
  customMetadata: Record<string, string> = {},
  sizeHint?: number
): Promise<R2UploadResult> {
  const bucket = getR2Bucket();

  if (bucket && typeof bucket.put === "function") {
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
  }

  if (isProductionRuntime()) {
    throw new Error(
      "Cloudflare R2 MEDIA_BUCKET is not configured. Refusing to store production media in transient Worker memory."
    );
  }

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

  if (bucket && typeof bucket.get === "function") {
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
    if (!obj) return null;

    return {
      body: obj.body,
      contentType: obj.httpMetadata?.contentType || "application/octet-stream",
      size: obj.size,
      range: obj.range,
    };
  }

  if (isProductionRuntime()) {
    throw new Error(
      "Cloudflare R2 MEDIA_BUCKET is not configured. Refusing to read production media from transient Worker memory."
    );
  }

  const local = localDevMemoryStorage.get(key);
  if (!local) return null;

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

export async function deleteR2Object(key: string): Promise<boolean> {
  const bucket = getR2Bucket();

  if (bucket && typeof bucket.delete === "function") {
    await bucket.delete(key);
    return true;
  }

  if (isProductionRuntime()) {
    throw new Error(
      "Cloudflare R2 MEDIA_BUCKET is not configured. Refusing to mutate transient production storage."
    );
  }

  localDevMemoryStorage.delete(key);
  return true;
}
