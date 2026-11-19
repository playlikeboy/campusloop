import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildWebPushRequest,
  encryptPushPayload,
  sendWebPush,
  type VapidKeys,
  type WebPushTarget,
} from "@/lib/web-push";

const b64u = {
  decode(value: string): Uint8Array {
    return new Uint8Array(Buffer.from(value, "base64url"));
  },
  encode(bytes: ArrayBuffer | Uint8Array): string {
    return Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString("base64url");
  },
};

/** RFC 8291 Appendix A: the published end-to-end example. */
const RFC = {
  plaintext: "When I grow up, I want to be a watermelon",
  asPublic: "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
  asPrivate: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
  uaPublic: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
  uaPrivate: "q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94",
  authSecret: "BTBZMqHH6r4Tts7J_aSIgg",
  salt: "DGv6ra1nlYgDCS1FRnbzlw",
  body:
    "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
};

async function hmac(key: Uint8Array, data: Uint8Array) {
  const k = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data as BufferSource));
}

const cat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

/**
 * Independent user-agent side of RFC 8291 + RFC 8188, written from the spec
 * the way a browser decrypts: parse the header, derive with the UA private key,
 * AES-GCM decrypt, strip the delimiter.
 */
async function decryptAsBrowser(body: Uint8Array, uaPublicB64: string, uaPrivateB64: string, authB64: string) {
  const salt = body.slice(0, 16);
  const rs = new DataView(body.buffer, body.byteOffset).getUint32(16);
  const idlen = body[20];
  const asPublic = body.slice(21, 21 + idlen);
  const ciphertext = body.slice(21 + idlen);
  const uaPublic = b64u.decode(uaPublicB64);

  const uaPriv = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: b64u.encode(uaPublic.slice(1, 33)),
      y: b64u.encode(uaPublic.slice(33, 65)),
      d: uaPrivateB64,
    },
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );
  const asKey = await crypto.subtle.importKey("raw", asPublic as BufferSource, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: asKey }, uaPriv, 256));

  const enc = new TextEncoder();
  const prkKey = await hmac(b64u.decode(authB64), shared);
  const ikm = await hmac(prkKey, cat(enc.encode("WebPush: info\0"), uaPublic, asPublic, new Uint8Array([1])));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, enc.encode("Content-Encoding: aes128gcm\0\x01"))).slice(0, 16);
  const nonce = (await hmac(prk, enc.encode("Content-Encoding: nonce\0\x01"))).slice(0, 12);

  const key = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["decrypt"]);
  const padded = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce as BufferSource }, key, ciphertext as BufferSource)
  );
  // Last record: strip trailing zero padding, then the 0x02 delimiter.
  let end = padded.length - 1;
  while (end >= 0 && padded[end] === 0) end--;
  expect(padded[end]).toBe(2);
  return { rs, idlen, asPublic, text: new TextDecoder().decode(padded.slice(0, end)) };
}

async function newUserAgentKeys() {
  const pair = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ])) as CryptoKeyPair;
  const pub = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return {
    p256dh: b64u.encode(pub),
    privateKey: jwk.d as string,
    auth: b64u.encode(crypto.getRandomValues(new Uint8Array(16))),
  };
}

async function newVapidKeys(): Promise<VapidKeys> {
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const pub = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return { publicKey: b64u.encode(pub), privateKey: jwk.d as string, subject: "mailto:test@example.com" };
}

describe("encryptPushPayload (RFC 8291)", () => {
  it("reproduces the RFC 8291 Appendix A message byte for byte", async () => {
    const body = await encryptPushPayload(RFC.plaintext, RFC.uaPublic, RFC.authSecret, {
      salt: b64u.decode(RFC.salt),
      senderKeys: { publicKey: RFC.asPublic, privateKey: RFC.asPrivate },
    });
    expect(b64u.encode(body)).toBe(RFC.body);
  });

  it("the RFC message decrypts with the RFC user-agent key", async () => {
    const out = await decryptAsBrowser(b64u.decode(RFC.body), RFC.uaPublic, RFC.uaPrivate, RFC.authSecret);
    expect(out.text).toBe(RFC.plaintext);
  });

  it("round-trips a JSON payload with fresh keys and writes a valid aes128gcm header", async () => {
    const ua = await newUserAgentKeys();
    const payload = JSON.stringify({ title: "Asha replied", body: "नमस्ते 👋", url: "/post/1", unreadCount: 3 });
    const body = await encryptPushPayload(payload, ua.p256dh, ua.auth);

    const out = await decryptAsBrowser(body, ua.p256dh, ua.privateKey, ua.auth);
    expect(out.text).toBe(payload);
    expect(out.rs).toBe(4096);
    expect(out.idlen).toBe(65);
    expect(out.asPublic[0]).toBe(0x04);
    // header 86 + plaintext + delimiter 1 + GCM tag 16
    expect(body.length).toBe(86 + new TextEncoder().encode(payload).length + 1 + 16);
  });

  it("uses a fresh salt and sender key for every message", async () => {
    const ua = await newUserAgentKeys();
    const a = await encryptPushPayload("x", ua.p256dh, ua.auth);
    const b = await encryptPushPayload("x", ua.p256dh, ua.auth);
    expect(b64u.encode(a.slice(0, 16))).not.toBe(b64u.encode(b.slice(0, 16)));
    expect(b64u.encode(a.slice(21, 86))).not.toBe(b64u.encode(b.slice(21, 86)));
  });

  it("rejects bad keys and oversize payloads", async () => {
    const ua = await newUserAgentKeys();
    await expect(encryptPushPayload("x", "AAAA", ua.auth)).rejects.toThrow(/p256dh/);
    await expect(encryptPushPayload("x", ua.p256dh, "AAAA")).rejects.toThrow(/auth/);
    await expect(encryptPushPayload("x".repeat(4000), ua.p256dh, ua.auth)).rejects.toThrow(/too large/);
  });
});

describe("buildWebPushRequest (RFC 8030 / RFC 8292 wire format)", () => {
  it("sends a verifiable VAPID JWT, aes128gcm body and delivery headers", async () => {
    const vapid = await newVapidKeys();
    const ua = await newUserAgentKeys();
    const target: WebPushTarget = {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc:def",
      p256dh: ua.p256dh,
      auth: ua.auth,
    };
    const { url, init } = await buildWebPushRequest(target, { title: "hi" }, vapid, {
      urgency: "high",
      ttl: 3600,
      topic: "MESSAGE:conv_1",
    });

    expect(url).toBe(target.endpoint);
    expect(init.method).toBe("POST");
    const h = init.headers;
    expect(h.TTL).toBe("3600");
    expect(h.Urgency).toBe("high");
    expect(h.Topic).toBe("MESSAGEconv_1");
    expect(h["Content-Encoding"]).toBe("aes128gcm");
    expect(h["Content-Type"]).toBe("application/octet-stream");
    expect(Number(h["Content-Length"])).toBe((init.body as Uint8Array).length);

    // Authorization: vapid t=<jwt>, k=<uncompressed public key>
    const match = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(h.Authorization);
    expect(match).not.toBeNull();
    const [, headerB64, claimsB64, sigB64, k] = match as RegExpExecArray;
    expect(k).toBe(vapid.publicKey);
    expect(JSON.parse(Buffer.from(headerB64, "base64url").toString())).toEqual({ typ: "JWT", alg: "ES256" });
    const claims = JSON.parse(Buffer.from(claimsB64, "base64url").toString());
    expect(claims.aud).toBe("https://fcm.googleapis.com");
    expect(claims.sub).toBe("mailto:test@example.com");
    const now = Math.floor(Date.now() / 1000);
    expect(claims.exp).toBeGreaterThan(now);
    expect(claims.exp).toBeLessThanOrEqual(now + 24 * 3600);

    // ES256 signature is raw r||s (64 bytes) and verifies with the advertised key.
    const sig = b64u.decode(sigB64);
    expect(sig.length).toBe(64);
    const verifyKey = await crypto.subtle.importKey(
      "raw",
      b64u.decode(k) as BufferSource,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      verifyKey,
      sig as BufferSource,
      new TextEncoder().encode(`${headerB64}.${claimsB64}`)
    );
    expect(ok).toBe(true);

    const out = await decryptAsBrowser(init.body as Uint8Array, ua.p256dh, ua.privateKey, ua.auth);
    expect(JSON.parse(out.text)).toEqual({ title: "hi" });
  });

  it("sends an empty tickle when there is no payload", async () => {
    const vapid = await newVapidKeys();
    const ua = await newUserAgentKeys();
    const { init } = await buildWebPushRequest(
      { endpoint: "https://updates.push.services.mozilla.com/wpush/v2/x", ...ua },
      null,
      vapid
    );
    expect(init.body).toBeNull();
    expect(init.headers["Content-Length"]).toBe("0");
    expect(init.headers["Content-Encoding"]).toBeUndefined();
    expect(init.headers.TTL).toBe("86400");
    expect(init.headers.Urgency).toBe("normal");
  });
});

describe("sendWebPush", () => {
  const saved = { ...process.env };
  let target: WebPushTarget;

  beforeEach(async () => {
    const vapid = await newVapidKeys();
    process.env.VAPID_PUBLIC_KEY = vapid.publicKey;
    process.env.VAPID_PRIVATE_KEY = `${vapid.privateKey}\n`;
    process.env.VAPID_SUBJECT = vapid.subject;
    const ua = await newUserAgentKeys();
    target = { endpoint: "https://web.push.apple.com/QGx", p256dh: ua.p256dh, auth: ua.auth };
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...saved };
    vi.restoreAllMocks();
  });

  it.each([
    [201, "sent"],
    [404, "expired"],
    [410, "expired"],
    [403, "failed"],
    [429, "failed"],
  ] as const)("maps HTTP %i to %s", async (status, expected) => {
    const fetchImpl = vi.fn(async () => new Response(status === 201 ? null : "nope", { status }));
    const out = await sendWebPush(target, { title: "t" }, {}, fetchImpl as unknown as typeof fetch);
    expect(out.result).toBe(expected);
    expect(out.status).toBe(status);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("reports not-configured without VAPID keys and never calls the network", async () => {
    Reflect.deleteProperty(process.env, "VAPID_PRIVATE_KEY");
    const fetchImpl = vi.fn();
    const out = await sendWebPush(target, { title: "t" }, {}, fetchImpl as unknown as typeof fetch);
    expect(out.result).toBe("not-configured");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns failed instead of throwing on a network error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const out = await sendWebPush(target, { title: "t" }, {}, fetchImpl as unknown as typeof fetch);
    expect(out).toEqual({ result: "failed", detail: "fetch failed" });
  });
});
