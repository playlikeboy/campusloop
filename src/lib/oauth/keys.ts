import { exportJWK, generateKeyPair, importJWK, type JWK, jwtVerify, type JWTPayload, SignJWT } from "jose";
import { ISSUER } from "./config";

/**
 * ES256 signing keys. The private JWK (with "kid") is the Worker secret
 * OIDC_SIGNING_KEY; OIDC_SIGNING_KEY_PREVIOUS (optional) keeps the old public
 * key in the JWKS during rotation. Generate with scripts/oauth/generate-keys.ts.
 * Outside production a throwaway key is generated so tests and local dev work.
 */

interface KeySet {
  kid: string;
  privateKey: CryptoKey;
  publicJwks: JWK[];
}

let cached: Promise<KeySet> | null = null;

const publicPart = ({ d: _d, ...pub }: JWK): JWK => ({ ...pub, use: "sig", alg: "ES256" });

async function load(): Promise<KeySet> {
  const raw = process.env.OIDC_SIGNING_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") throw new Error("OIDC_SIGNING_KEY is not configured");
    const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
    const pub = { ...(await exportJWK(publicKey)), kid: "dev" };
    return { kid: "dev", privateKey: privateKey as CryptoKey, publicJwks: [publicPart(pub)] };
  }
  const jwk = JSON.parse(raw) as JWK;
  if (!jwk.kid || !jwk.d) throw new Error("OIDC_SIGNING_KEY must be a private EC JWK with a kid");
  const previous = process.env.OIDC_SIGNING_KEY_PREVIOUS ? [publicPart(JSON.parse(process.env.OIDC_SIGNING_KEY_PREVIOUS) as JWK)] : [];
  return {
    kid: jwk.kid,
    privateKey: (await importJWK(jwk, "ES256")) as CryptoKey,
    publicJwks: [publicPart(jwk), ...previous],
  };
}

const keys = () => (cached ??= load());

export async function jwks(): Promise<{ keys: JWK[] }> {
  return { keys: (await keys()).publicJwks };
}

export async function signJwt(payload: JWTPayload, opts: { audience: string; expiresInSec: number; type?: string }): Promise<string> {
  const k = await keys();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "ES256", kid: k.kid, typ: opts.type ?? "JWT" })
    .setIssuer(ISSUER)
    .setAudience(opts.audience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + opts.expiresInSec)
    .sign(k.privateKey);
}

/** Verifies a token we issued (signature, issuer, expiry, and optionally type). */
export async function verifyJwt(token: string, opts: { type?: string } = {}): Promise<JWTPayload> {
  const k = await keys();
  const { payload, protectedHeader } = await jwtVerify(
    token,
    async (header) => {
      const jwk = k.publicJwks.find((j) => j.kid === header.kid);
      if (!jwk) throw new Error("unknown kid");
      return importJWK(jwk, "ES256");
    },
    { issuer: ISSUER, algorithms: ["ES256"] }
  );
  if (opts.type && protectedHeader.typ !== opts.type) throw new Error("wrong token type");
  return payload;
}
