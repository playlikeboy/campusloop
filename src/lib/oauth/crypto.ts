/** Small WebCrypto helpers shared by the OAuth server (Workers- and Node-compatible). */

const enc = new TextEncoder();

export function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Random opaque token with a readable prefix, e.g. "cl_rt_<43 chars>". */
export function randomToken(prefix: string, bytes = 32): string {
  return `${prefix}${base64url(crypto.getRandomValues(new Uint8Array(bytes)))}`;
}

export async function sha256(input: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(input))));
}

export async function hmacSha256(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data))));
}

/** Constant-time string comparison for secrets and hashes. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** RFC 7636: BASE64URL(SHA256(code_verifier)) must equal the stored S256 challenge. */
export async function verifyPkce(verifier: string, challenge: string): Promise<boolean> {
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false;
  return safeEqual(await sha256(verifier), challenge);
}
