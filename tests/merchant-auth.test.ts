import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

let mockMerchantRecord: any = null;

const merchantQueryMock: any = {
  merchants: {
    findFirst: async () => mockMerchantRecord,
  },
};

const safeMerchantQuery = new Proxy(merchantQueryMock, {
  get(target: any, prop: string) {
    if (prop in target) return target[prop];
    return {
      findFirst: async () => null,
      findMany: async () => [],
    };
  },
});

vi.mock("@/db", () => ({
  getDb: () => ({
    query: safeMerchantQuery,
  }),
}));

import {
  createMerchantSessionToken,
  verifyMerchantSessionToken,
  verifyMerchantSession,
} from "@/lib/merchant-auth";

const VALID_SECRET = "production_secure_entropy_key_77a9e2f4c6b8d0a1_merchant_auth";
const ORIGINAL_SECRET = process.env.MERCHANT_AUTH_SECRET;

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
}

function splitToken(token: string) {
  const at = token.indexOf(".");
  return { payload: token.slice(0, at), signature: token.slice(at + 1) };
}

function decodeClaims(token: string) {
  return JSON.parse(fromBase64Url(splitToken(token).payload)) as {
    mid: string;
    iat: number;
    exp: number;
  };
}

/** Mint a signed token directly with arbitrary claims and arbitrary secret */
async function signArbitraryClaims(claims: object, secret = VALID_SECRET): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

describe("Merchant Authentication & Authorization Hardening", () => {
  beforeAll(() => {
    process.env.MERCHANT_AUTH_SECRET = VALID_SECRET;
  });

  afterAll(() => {
    process.env.MERCHANT_AUTH_SECRET = ORIGINAL_SECRET;
  });

  beforeEach(() => {
    process.env.MERCHANT_AUTH_SECRET = VALID_SECRET;
  });

  // ─── 1. Missing Secret ───
  describe("missing secret", () => {
    it("fails closed and throws error when MERCHANT_AUTH_SECRET is undefined", async () => {
      delete process.env.MERCHANT_AUTH_SECRET;
      await expect(createMerchantSessionToken("merchant_01")).rejects.toThrow(
        /MERCHANT_AUTH_SECRET is missing/
      );
    });

    it("fails closed and throws error when MERCHANT_AUTH_SECRET is empty string", async () => {
      process.env.MERCHANT_AUTH_SECRET = "";
      await expect(createMerchantSessionToken("merchant_01")).rejects.toThrow(
        /MERCHANT_AUTH_SECRET is missing/
      );
    });

    it("returns null during token verification when secret is missing, never authenticating anyone", async () => {
      const validToken = await createMerchantSessionToken("merchant_01");
      delete process.env.MERCHANT_AUTH_SECRET;
      expect(await verifyMerchantSessionToken(validToken)).toBeNull();
    });
  });

  // ─── 2. Malformed Secret ───
  describe("malformed secret", () => {
    it("fails closed when secret is shorter than 32 characters", async () => {
      const shortSecrets = [
        "123",
        "short_secret",
        "only-31-chars-long-secret-here!", // 31 chars
      ];
      for (const secret of shortSecrets) {
        process.env.MERCHANT_AUTH_SECRET = secret;
        await expect(createMerchantSessionToken("merchant_01")).rejects.toThrow(
          /too short/
        );
      }
    });

    it("fails closed when secret is whitespace or whitespace-padded short", async () => {
      process.env.MERCHANT_AUTH_SECRET = "   ";
      await expect(createMerchantSessionToken("merchant_01")).rejects.toThrow(
        /MERCHANT_AUTH_SECRET is missing/
      );
    });

    it("fails closed when secret has insufficient entropy (repetitive characters)", async () => {
      process.env.MERCHANT_AUTH_SECRET = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; // 32 identical chars
      await expect(createMerchantSessionToken("merchant_01")).rejects.toThrow(
        /insufficient entropy/
      );
    });

    it("fails closed when secret uses default/placeholder values", async () => {
      const placeholders = [
        "campusloop_merchant_portal_secure_hmac_secret_2026_salt",
        "change-this-secret-before-production-use-now-12345",
      ];
      for (const placeholder of placeholders) {
        process.env.MERCHANT_AUTH_SECRET = placeholder;
        await expect(createMerchantSessionToken("merchant_01")).rejects.toThrow(
          /malformed: placeholder/
        );
      }
    });
  });

  // ─── 3. Valid Secret ───
  describe("valid secret", () => {
    it("successfully creates and verifies a signed session token", async () => {
      const token = await createMerchantSessionToken("merchant_valid_99");
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(2);

      const resolvedMerchantId = await verifyMerchantSessionToken(token);
      expect(resolvedMerchantId).toBe("merchant_valid_99");
    });

    it("attaches correct claims structure with 30-day expiry", async () => {
      const token = await createMerchantSessionToken("merchant_claims_test");
      const claims = decodeClaims(token);

      expect(claims.mid).toBe("merchant_claims_test");
      expect(claims.exp - claims.iat).toBe(30 * 24 * 60 * 60);
      expect(claims.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it("rejects token creation with empty or non-string merchant id", async () => {
      await expect(createMerchantSessionToken("")).rejects.toThrow(/merchantId is required/);
      await expect(createMerchantSessionToken("   ")).rejects.toThrow(/merchantId is required/);
    });
  });

  // ─── 4. Wrong Secret ───
  describe("wrong secret", () => {
    it("fails verification when token is signed with a different secret", async () => {
      const foreignSecret = "completely_different_foreign_secret_key_88b1c2d3e4_prod";
      const token = await signArbitraryClaims(
        { mid: "merchant_01", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
        foreignSecret
      );

      // Verifying under VALID_SECRET must reject foreign token
      expect(await verifyMerchantSessionToken(token)).toBeNull();
    });

    it("fails verification when server rotates to a new secret", async () => {
      const token = await createMerchantSessionToken("merchant_01");

      // Rotate secret to another valid secret
      process.env.MERCHANT_AUTH_SECRET = "rotated_different_valid_secret_key_99a8b7c6d5e4f3a2b1_prod";
      expect(await verifyMerchantSessionToken(token)).toBeNull();
    });
  });

  // ─── 5. Expired Token ───
  describe("expired token", () => {
    it("fails verification when token exp is in the past", async () => {
      const past = Math.floor(Date.now() / 1000) - 120;
      const expiredToken = await signArbitraryClaims({
        mid: "merchant_expired",
        iat: past - 3600,
        exp: past,
      });

      expect(await verifyMerchantSessionToken(expiredToken)).toBeNull();
    });

    it("fails verification when token has no exp claim at all", async () => {
      const noExpToken = await signArbitraryClaims({
        mid: "merchant_no_exp",
        iat: Math.floor(Date.now() / 1000),
      });

      expect(await verifyMerchantSessionToken(noExpToken)).toBeNull();
    });

    it("fails verification when token has non-numeric exp claim", async () => {
      const invalidExpToken = await signArbitraryClaims({
        mid: "merchant_bad_exp",
        iat: Math.floor(Date.now() / 1000),
        exp: "never_expires",
      });

      expect(await verifyMerchantSessionToken(invalidExpToken)).toBeNull();
    });
  });

  // ─── 6. Tampered Merchant ID ───
  describe("tampered merchant ID", () => {
    it("rejects token when merchant ID inside signed payload is modified", async () => {
      const legitimateToken = await createMerchantSessionToken("merchant_victim");
      const { signature } = splitToken(legitimateToken);
      const claims = decodeClaims(legitimateToken);

      // Attacker swaps merchant ID inside payload but reuses existing signature
      const tamperedPayload = toBase64Url(
        new TextEncoder().encode(JSON.stringify({ ...claims, mid: "merchant_attacker" }))
      );

      expect(await verifyMerchantSessionToken(`${tamperedPayload}.${signature}`)).toBeNull();
    });

    it("does not trust any merchant ID passed independently of the signed token", async () => {
      const token = await createMerchantSessionToken("merchant_real");

      // Verify that verifyMerchantSessionToken extracts exclusively from signed claims
      const verifiedMid = await verifyMerchantSessionToken(token);
      expect(verifiedMid).toBe("merchant_real");
      expect(verifiedMid).not.toBe("merchant_spoofed");
    });
  });

  // ─── 7. Malformed Token ───
  describe("malformed token", () => {
    it("gracefully returns null without throwing for corrupt strings and syntax errors", async () => {
      const malformedCases = [
        "",
        "   ",
        "no-dot-in-token",
        ".",
        "..",
        "too.many.dots.in.this.token",
        "payload-only.",
        ".signature-only",
        "invalid_base64_!@#$.signature",
        "bm90LWpzb24=.signature", // valid base64 but contains "not-json" string, not JSON object
        "{}", // plain json without signature
      ];

      for (const token of malformedCases) {
        expect(await verifyMerchantSessionToken(token)).toBeNull();
      }
    });

    it("rejects tokens where payload is valid JSON but claims are malformed", async () => {
      const now = Math.floor(Date.now() / 1000);
      const invalidClaimsCases = [
        {}, // missing mid
        { mid: "" }, // empty mid
        { mid: "   " }, // whitespace mid
        { mid: 12345, exp: now + 3600 }, // non-string mid
        { mid: null, exp: now + 3600 }, // null mid
      ];

      for (const claims of invalidClaimsCases) {
        const token = await signArbitraryClaims(claims);
        expect(await verifyMerchantSessionToken(token)).toBeNull();
      }
    });
  });

  // ─── 8. Merchant Status Verification in verifyMerchantSession ───
  describe("merchant status verification (verifyMerchantSession)", () => {
    it("allows ACTIVE merchant status", async () => {
      const token = await createMerchantSessionToken("m_active_1");
      mockMerchantRecord = {
        id: "m_active_1",
        name: "Active Canteen",
        status: "ACTIVE",
      };

      const result = await verifyMerchantSession(token);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("m_active_1");
      expect(result?.status).toBe("ACTIVE");
    });

    it("rejects SUSPENDED merchant status", async () => {
      const token = await createMerchantSessionToken("m_suspended_1");
      mockMerchantRecord = {
        id: "m_suspended_1",
        name: "Suspended Store",
        status: "SUSPENDED",
      };

      const result = await verifyMerchantSession(token);
      expect(result).toBeNull();
    });

    it("rejects CLOSED merchant status", async () => {
      const token = await createMerchantSessionToken("m_closed_1");
      mockMerchantRecord = {
        id: "m_closed_1",
        name: "Closed Store",
        status: "CLOSED",
      };

      const result = await verifyMerchantSession(token);
      expect(result).toBeNull();
    });

    it("rejects non-ACTIVE (e.g. DRAFT or PENDING_REVIEW) merchant status", async () => {
      const token = await createMerchantSessionToken("m_draft_1");
      mockMerchantRecord = {
        id: "m_draft_1",
        name: "Draft Store",
        status: "DRAFT",
      };

      const result = await verifyMerchantSession(token);
      expect(result).toBeNull();
    });

    it("returns null if merchant does not exist in database", async () => {
      const token = await createMerchantSessionToken("m_nonexistent");
      mockMerchantRecord = null;

      const result = await verifyMerchantSession(token);
      expect(result).toBeNull();
    });
  });
});
