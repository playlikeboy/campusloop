import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hmacSha256Hex, safeEqual, verifyPaymentSignature, verifyWebhookSignature } from "./razorpay";

const SECRET = "test_secret_123";

describe("razorpay signatures", () => {
  it("matches Node's HMAC-SHA256 hex digest", async () => {
    const expected = createHmac("sha256", SECRET).update("hello").digest("hex");
    expect(await hmacSha256Hex(SECRET, "hello")).toBe(expected);
  });

  it("verifies checkout signatures over order_id|payment_id", async () => {
    const sig = createHmac("sha256", SECRET).update("order_1|pay_1").digest("hex");
    expect(await verifyPaymentSignature("order_1", "pay_1", sig, SECRET)).toBe(true);
    expect(await verifyPaymentSignature("order_1", "pay_2", sig, SECRET)).toBe(false);
    expect(await verifyPaymentSignature("order_1", "pay_1", sig, undefined)).toBe(false);
  });

  it("verifies webhook signatures over the raw body", async () => {
    const body = '{"event":"payment.captured"}';
    const sig = createHmac("sha256", SECRET).update(body).digest("hex");
    expect(await verifyWebhookSignature(body, sig, SECRET)).toBe(true);
    expect(await verifyWebhookSignature(`${body} `, sig, SECRET)).toBe(false);
    expect(await verifyWebhookSignature(body, null, SECRET)).toBe(false);
  });

  it("safeEqual rejects different lengths and contents", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
