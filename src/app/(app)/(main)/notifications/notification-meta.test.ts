import { describe, expect, it } from "vitest";
import type { NotificationItem } from "@/hooks/use-notifications";
import { buildPushPayload, buildUrl } from "@/lib/notification-copy";
import { getNotificationMeta, groupByDay, shortTimeAgo } from "./notification-meta";

const now = new Date(2026, 10, 19, 15, 0, 0);
const item = (id: string, createdAt: Date, type: NotificationItem["type"] = "LIKE"): NotificationItem => ({
  id,
  userId: "u",
  type,
  actorId: "a",
  referenceId: "ref",
  previewText: null,
  isRead: false,
  createdAt,
});

describe("groupByDay", () => {
  it("splits into Today, This week and Earlier in order", () => {
    const list = [
      item("t", new Date(2026, 10, 19, 9)),
      item("w1", new Date(2026, 10, 18, 23)),
      item("w2", new Date(2026, 10, 13, 1)),
      item("e", new Date(2026, 10, 12, 23)),
    ];
    const groups = groupByDay(list, now);
    expect(groups.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([
      ["Today", ["t"]],
      ["This week", ["w1", "w2"]],
      ["Earlier", ["e"]],
    ]);
  });

  it("drops empty groups", () => {
    expect(groupByDay([item("e", new Date(2025, 0, 1))], now).map((g) => g.id)).toEqual(["earlier"]);
  });
});

describe("shortTimeAgo", () => {
  it("is compact for a 375px row", () => {
    expect(shortTimeAgo(new Date(now.getTime() - 20_000), now)).toBe("now");
    expect(shortTimeAgo(new Date(now.getTime() - 5 * 60_000), now)).toBe("5m");
    expect(shortTimeAgo(new Date(now.getTime() - 3 * 3600_000), now)).toBe("3h");
    expect(shortTimeAgo(new Date(now.getTime() - 2 * 86400_000), now)).toBe("2d");
    expect(shortTimeAgo(new Date(now.getTime() - 14 * 86400_000), now)).toBe("2w");
    expect(shortTimeAgo("not a date", now)).toBe("");
  });
});

describe("deep links", () => {
  it("push and in-app list agree on where each type opens", () => {
    const types: NotificationItem["type"][] = [
      "LIKE",
      "COMMENT",
      "MESSAGE",
      "MATCH",
      "EVENT_REGISTRATION",
      "EVENT_REMINDER",
      "EVENT_UPDATE",
      "COMMUNITY_JOIN_REQUEST",
      "COMMUNITY_JOIN_APPROVED",
      "FOLLOW",
      "CRUSH_ALERT",
    ];
    for (const type of types) {
      const n = { ...item("x", now, type), referenceId: type === "CRUSH_ALERT" ? null : "ref" };
      expect(getNotificationMeta(n).href, type).toBe(buildUrl(type, n.referenceId));
    }
  });

  it("never names the sender of a crush alert in a push", () => {
    const p = buildPushPayload({ type: "CRUSH_ALERT", actorName: "Rahul", actorAvatarUrl: "https://x/y.png" });
    expect(JSON.stringify(p)).not.toContain("Rahul");
    expect(p.icon).toBeNull();
    expect(p.url).toBe("/crush");
  });
});
