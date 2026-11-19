import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => {
          const e = new Error('relation "device_push_tokens" does not exist') as Error & { code: string };
          e.code = "42P01";
          throw e;
        },
      }),
    }),
  }),
}));

import { EXPO_PUSH_URL, type ExpoMessage, isExpoPushToken, pushExpoToUsers, sendExpoMessages } from "./expo-push";

const msg = (i: number): ExpoMessage => ({
  to: `ExponentPushToken[t${i}]`,
  title: "t",
  body: "b",
  data: { url: "/notifications", type: "LIKE", referenceId: null },
  sound: "default",
  priority: "default",
  channelId: "default",
});

describe("expo push", () => {
  it("validates Expo token format", () => {
    expect(isExpoPushToken("ExponentPushToken[abc123]")).toBe(true);
    expect(isExpoPushToken("ExpoPushToken[abc123]")).toBe(true);
    expect(isExpoPushToken("fcm-raw-token")).toBe(false);
    expect(isExpoPushToken(42)).toBe(false);
  });

  it("sends batches of at most 100 and collects DeviceNotRegistered tokens", async () => {
    const sizes: number[] = [];
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe(EXPO_PUSH_URL);
      const batch = JSON.parse(String(init.body)) as ExpoMessage[];
      sizes.push(batch.length);
      return new Response(
        JSON.stringify({
          data: batch.map((m) =>
            m.to === "ExponentPushToken[t5]" || m.to === "ExponentPushToken[t150]"
              ? { status: "error", message: "gone", details: { error: "DeviceNotRegistered" } }
              : m.to === "ExponentPushToken[t7]"
                ? { status: "error", details: { error: "MessageRateExceeded" } }
                : { status: "ok", id: "x" }
          ),
        }),
        { status: 200 }
      );
    });
    const dead = await sendExpoMessages(Array.from({ length: 250 }, (_, i) => msg(i)), fetchImpl as unknown as typeof fetch);
    expect(sizes).toEqual([100, 100, 50]);
    expect(dead).toEqual(["ExponentPushToken[t5]", "ExponentPushToken[t150]"]);
  });

  it("tolerates the table not existing yet", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(pushExpoToUsers(["p1"], { type: "LIKE", actorId: "a1" })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
