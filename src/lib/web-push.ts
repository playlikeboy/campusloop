/**
 * Minimal Web Push sender built on Web Crypto, so it runs on Cloudflare
 * Workers where the usual `web-push` package (Node crypto) cannot.
 *
 * - VAPID (RFC 8292): an ES256 JWT signed with the server key pair.
 * - Payloads (RFC 8291 / RFC 8188 "aes128gcm"): the notification is encrypted
 *   to the browser's own key, so the push service only ever sees ciphertext.
 *   The service worker renders it directly, with no round trip that depends on
 *   the session cookie still being valid.
 * - Tickles: a payload-less push is still supported. The service worker then
 *   fetches /api/notifications/latest over the student's session instead.
 */

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function jsonToBase64Url(value: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export function getVapidKeys(): VapidKeys | null {
  // Secrets pasted into `wrangler secret put` often carry a trailing newline.
  const publicKey = (process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:hello@campusloop.space";

  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

/**
 * An uncompressed P-256 public key is 0x04 || X(32) || Y(32); the JWK import
 * needs X and Y split back out, alongside the raw private scalar as `d`.
 */
async function importVapidSigningKey(keys: VapidKeys): Promise<CryptoKey> {
  const publicBytes = base64UrlToBytes(keys.publicKey);
  if (publicBytes.length !== 65 || publicBytes[0] !== 0x04) {
    throw new Error("VAPID_PUBLIC_KEY must be an uncompressed P-256 point (65 bytes)");
  }

  return crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: bytesToBase64Url(publicBytes.slice(1, 33)),
      y: bytesToBase64Url(publicBytes.slice(33, 65)),
      d: keys.privateKey,
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

export async function createVapidHeader(endpoint: string, keys: VapidKeys): Promise<string> {
  const audience = new URL(endpoint).origin;
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: keys.subject,
  };

  const signingInput = `${jsonToBase64Url(header)}.${jsonToBase64Url(payload)}`;
  const signingKey = await importVapidSigningKey(keys);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    new TextEncoder().encode(signingInput)
  );

  return `vapid t=${signingInput}.${bytesToBase64Url(signature)}, k=${keys.publicKey}`;
}

export type PushResult = "sent" | "expired" | "failed" | "not-configured";

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data as BufferSource));
}

/** HKDF (RFC 5869) for outputs of at most one SHA-256 block, which is all RFC 8291 needs. */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const prk = await hmacSha256(salt, ikm);
  const okm = await hmacSha256(prk, concatBytes(info, new Uint8Array([1])));
  return okm.slice(0, length);
}

const encoder = new TextEncoder();

/** Record size advertised in the aes128gcm header. One record holds the whole payload. */
const RECORD_SIZE = 4096;
/** Push services accept at least 4096 bytes of body; header (86) + tag (16) + delimiter (1) fit around this. */
export const MAX_PUSH_PLAINTEXT = 3993;

export interface EncryptOptions {
  /** Fixed 16-byte salt. Tests only; production always uses a random one. */
  salt?: Uint8Array;
  /** Fixed sender key pair as base64url (raw 65-byte public, 32-byte private). Tests only. */
  senderKeys?: { publicKey: string; privateKey: string };
}

/**
 * Encrypt a push message for one subscription (RFC 8291, content coding
 * aes128gcm from RFC 8188). Returns the complete request body: the 86-byte
 * header (salt, record size, sender public key) followed by one record.
 */
export async function encryptPushPayload(
  plaintext: Uint8Array | string,
  p256dh: string,
  authSecret: string,
  options: EncryptOptions = {}
): Promise<Uint8Array> {
  const data = typeof plaintext === "string" ? encoder.encode(plaintext) : plaintext;
  if (data.length > MAX_PUSH_PLAINTEXT) {
    throw new Error(`Push payload too large (${data.length} > ${MAX_PUSH_PLAINTEXT} bytes)`);
  }

  const uaPublic = base64UrlToBytes(p256dh);
  const auth = base64UrlToBytes(authSecret);
  if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) throw new Error("Invalid p256dh key");
  if (auth.length !== 16) throw new Error("Invalid auth secret");

  // Sender (application server) ephemeral key pair: fresh per message.
  let asPrivate: CryptoKey;
  let asPublic: Uint8Array;
  if (options.senderKeys) {
    asPublic = base64UrlToBytes(options.senderKeys.publicKey);
    asPrivate = await crypto.subtle.importKey(
      "jwk",
      {
        kty: "EC",
        crv: "P-256",
        x: bytesToBase64Url(asPublic.slice(1, 33)),
        y: bytesToBase64Url(asPublic.slice(33, 65)),
        d: options.senderKeys.privateKey,
        ext: true,
      },
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveBits"]
    );
  } else {
    const pair = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
      "deriveBits",
    ])) as CryptoKeyPair;
    asPrivate = pair.privateKey;
    asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  }

  const uaKey = await crypto.subtle.importKey(
    "raw",
    uaPublic as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPrivate, 256)
  );

  // RFC 8291 section 3.4: mix the auth secret and both public keys into the IKM.
  const keyInfo = concatBytes(encoder.encode("WebPush: info\0"), uaPublic, asPublic);
  const ikm = await hkdf(auth, ecdhSecret, keyInfo, 32);

  const salt = options.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);

  // Single (and therefore last) record: plaintext, then the 0x02 delimiter, no padding.
  const record = concatBytes(data, new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce as BufferSource }, aesKey, record as BufferSource)
  );

  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, RECORD_SIZE);
  header[20] = asPublic.length;
  header.set(asPublic, 21);

  return concatBytes(header, ciphertext);
}

export interface WebPushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface WebPushSendOptions {
  urgency?: "very-low" | "low" | "normal" | "high";
  /** Seconds the push service may hold the message for an offline device. */
  ttl?: number;
  /** Collapses undelivered messages with the same topic (max 32 base64url chars). */
  topic?: string;
}

export interface WebPushDetailedResult {
  result: PushResult;
  /** HTTP status from the push service, when a request was made. */
  status?: number;
  /** Short reason for failures, safe to show to the subscription owner. */
  detail?: string;
}

/**
 * Build the exact request a push service expects. Split from the send so tests
 * can check the wire format without the network.
 */
export async function buildWebPushRequest(
  target: WebPushTarget,
  payload: unknown,
  keys: VapidKeys,
  options: WebPushSendOptions = {}
): Promise<{ url: string; init: RequestInit & { headers: Record<string, string> } }> {
  const body =
    payload === undefined || payload === null
      ? null
      : await encryptPushPayload(JSON.stringify(payload), target.p256dh, target.auth);

  const headers: Record<string, string> = {
    Authorization: await createVapidHeader(target.endpoint, keys),
    TTL: String(Math.max(0, Math.floor(options.ttl ?? 86400))),
    Urgency: options.urgency ?? "normal",
  };
  if (options.topic) headers.Topic = options.topic.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
  if (body) {
    headers["Content-Encoding"] = "aes128gcm";
    headers["Content-Type"] = "application/octet-stream";
    headers["Content-Length"] = String(body.length);
  } else {
    headers["Content-Length"] = "0";
  }

  return { url: target.endpoint, init: { method: "POST", headers, body: body as BodyInit | null } };
}

/**
 * Send one encrypted push. "expired" (404/410) means the subscription is dead
 * and the caller should delete it. Never throws.
 */
export async function sendWebPush(
  target: WebPushTarget,
  payload: unknown,
  options: WebPushSendOptions = {},
  fetchImpl: typeof fetch = fetch
): Promise<WebPushDetailedResult> {
  const keys = getVapidKeys();
  if (!keys) return { result: "not-configured", detail: "VAPID keys are not set on the server" };

  try {
    const { url, init } = await buildWebPushRequest(target, payload, keys, options);
    const res = await fetchImpl(url, init);
    if (res.status === 404 || res.status === 410) return { result: "expired", status: res.status };
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).slice(0, 200);
      console.warn(`Web push rejected (${res.status}): ${text}`);
      return { result: "failed", status: res.status, detail: text || res.statusText };
    }
    return { result: "sent", status: res.status };
  } catch (error) {
    console.error("Web push send failed:", error);
    return { result: "failed", detail: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Send one payload-less push. "expired" means the endpoint is dead (404/410)
 * and the caller should drop the stored subscription.
 */
export async function sendPushTickle(
  endpoint: string,
  urgency: "normal" | "high" = "normal"
): Promise<PushResult> {
  const keys = getVapidKeys();
  if (!keys) return "not-configured";

  try {
    const authorization = await createVapidHeader(endpoint, keys);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authorization,
        TTL: "86400",
        Urgency: urgency,
        "Content-Length": "0",
      },
    });

    if (res.status === 404 || res.status === 410) return "expired";
    if (!res.ok) {
      console.warn(`Web push rejected (${res.status}): ${await res.text().catch(() => "")}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("Web push send failed:", error);
    return "failed";
  }
}
