/**
 * Generates Login with CampusLoop secrets: an ES256 signing key (private JWK)
 * and the pairwise-subject salt. Prints dotenv lines to stdout; nothing is
 * written anywhere. Store them as Worker secrets and in local .env:
 *
 *   bun scripts/oauth/generate-keys.ts > /tmp/oidc.env          (keep this file private)
 *   wrangler secret put OIDC_SIGNING_KEY   < value from the file
 *   wrangler secret put OIDC_PAIRWISE_SALT < value from the file
 *
 * Rotation: move the current OIDC_SIGNING_KEY's public part to
 * OIDC_SIGNING_KEY_PREVIOUS, then set a newly generated OIDC_SIGNING_KEY.
 * Never rotate OIDC_PAIRWISE_SALT: it would change every user's `sub` in every app.
 */
import { exportJWK, generateKeyPair } from "jose";

const { privateKey } = await generateKeyPair("ES256", { extractable: true });
const jwk = { ...(await exportJWK(privateKey)), kid: `cl-${new Date().toISOString().slice(0, 10)}`, alg: "ES256", use: "sig" };
const salt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
console.log(`OIDC_SIGNING_KEY='${JSON.stringify(jwk)}'`);
console.log(`OIDC_PAIRWISE_SALT='${salt}'`);
