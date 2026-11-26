import { and } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import type { SendEmailOptions } from "@/lib/email";
import { getPreset } from "./presets";
import {
  type ClaimedRecipient,
  enqueueRecipients,
  processCampaignQueue,
  type QueueCampaign,
  type QueueStore,
  type RecipientContext,
  type RecipientResult,
} from "./queue";
import { renderBodyHtml, renderCampaignEmail, renderSubject, safeUrl, substituteVariables } from "./render";
import { DEFAULT_SEGMENT, normalizeSegment } from "./segment-spec";
import { buildSegmentConditions, filterSegmentRows, isDeliverableEmail, type SegmentRow } from "./segments";
import { listUnsubscribeHeaders, signUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe-token";

const dialect = new PgDialect();
const compile = (spec = DEFAULT_SEGMENT, now = new Date("2026-11-26T00:00:00Z")) =>
  dialect.sqlToQuery(and(...buildSegmentConditions(spec, now))!);

describe("segment query building", () => {
  it("always excludes unsubscribed, suspended/banned, seeded and email-less accounts", () => {
    const { sql, params } = compile();
    expect(sql).toContain('"user_profiles"."status" = $');
    expect(params).toContain("ACTIVE");
    expect(sql).toContain('"user_profiles"."is_seeded" = $');
    expect(params).toContain(false);
    expect(sql).toContain('"user_profiles"."email" is not null');
    expect(sql).toMatch(/not exists \(select 1 from "email_unsubscribes"/);
    expect(params).toContain("demo@campusloop.space");
  });

  it("ANDs every chosen filter", () => {
    const spec = normalizeSegment({
      institutionIds: ["inst-1", "inst-2"],
      years: [2, 1, 2],
      branches: ["CSE"],
      onboarding: "not_finished",
      inactiveDays: 14,
      joinedWithinDays: 30,
      androidApp: "with",
      play: "players",
    });
    expect(spec.years).toEqual([1, 2]);
    const { sql, params } = compile(spec);
    expect(sql).toContain('"user_profiles"."institution_id" in ($');
    expect(params).toEqual(expect.arrayContaining(["inst-1", "inst-2", 1, 2, "cse"]));
    expect(sql).toContain('"user_profiles"."onboarding_completed" = $');
    expect(sql).toContain('"user_profiles"."last_seen_at" < $');
    expect(sql).toContain('"user_profiles"."last_seen_at" is null');
    expect(sql).toContain('"user_profiles"."created_at" >= $');
    expect(sql).toContain('from "device_push_tokens"');
    expect(sql).toContain('from "play_trivia_runs"');
    expect(sql).not.toContain("not exists (select 1 from \"device_push_tokens\"");
    // Inactive cutoff is exactly 14 days before "now".
    expect(params).toContain(new Date("2026-11-12T00:00:00Z").toISOString());
  });

  it("negates the Android and Play filters", () => {
    const { sql } = compile(normalizeSegment({ androidApp: "without", play: "non_players" }));
    expect(sql).toMatch(/not exists \(select 1 from "device_push_tokens"/);
    expect(sql).toMatch(/not \(\s*exists \(select 1 from "play_trivia_runs"/);
  });

  it("rejects junk input", () => {
    const spec = normalizeSegment({
      verification: "admins",
      years: [0, 9, "x", 3],
      inactiveDays: -5,
      joinedWithinDays: "abc",
      institutionIds: [1, "", "ok"],
      play: "DROP TABLE",
    });
    expect(spec).toEqual({ ...DEFAULT_SEGMENT, years: [3], institutionIds: ["ok"] });
  });

  it("filters verification with isCollegeVerifiedUser and drops undeliverable emails", () => {
    const base: SegmentRow = {
      id: "1",
      email: "a@gmail.com",
      role: "STUDENT",
      isCollegeVerified: true,
      institutionId: "i",
      displayName: "A",
      officialName: null,
      username: "a",
      collegeName: "BIT",
    };
    const rows: SegmentRow[] = [
      base,
      { ...base, id: "2", email: "b@gmail.com", isCollegeVerified: false },
      { ...base, id: "3", email: "c@gmail.com", isCollegeVerified: false, role: "ADMIN" },
      { ...base, id: "4", email: "demo@campusloop.space" },
      { ...base, id: "5", email: "not-an-email" },
    ];
    expect(filterSegmentRows(rows, { ...DEFAULT_SEGMENT, verification: "verified" }).map((r) => r.id)).toEqual(["1", "3"]);
    expect(filterSegmentRows(rows, { ...DEFAULT_SEGMENT, verification: "unverified" }).map((r) => r.id)).toEqual(["2"]);
    expect(filterSegmentRows(rows, DEFAULT_SEGMENT).map((r) => r.id)).toEqual(["1", "2", "3"]);
    expect(isDeliverableEmail("noreply@college.ac.in")).toBe(false);
    expect(isDeliverableEmail("x@foo.test")).toBe(false);
  });
});

describe("variable rendering and escaping", () => {
  it("substitutes variables with fallbacks", () => {
    expect(substituteVariables("Hi {{first_name}} from {{ college }}", { first_name: "Riya", college: "IIT Bombay" })).toBe(
      "Hi Riya from IIT Bombay"
    );
    expect(substituteVariables("Hi {{first_name}}", {})).toBe("Hi there");
    expect(substituteVariables("Hi {{first_name|buddy}}", { first_name: "  " })).toBe("Hi buddy");
    expect(substituteVariables("{{unknown}} stays", {})).toBe("{{unknown}} stays");
  });

  it("escapes HTML in variable values and never turns them into markdown or links", () => {
    const html = renderBodyHtml("Hello **{{first_name}}**, see [docs](https://campusloop.space/a_b_c)", {
      first_name: '<img src=x onerror=alert(1)> **bold** [x](javascript:alert(1))',
    });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("**bold**");
    expect(html).not.toContain('href="javascript');
    expect(html).toContain('href="https://campusloop.space/a_b_c"');
    expect(html).toContain("<strong>");
  });

  it("escapes HTML typed into the template itself and drops unsafe links", () => {
    const html = renderBodyHtml("<script>x</script>\n\n[click](javascript:alert(1))\n\n- one\n- two", {});
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("javascript:");
    expect(html).toMatch(/<ul[^>]*><li[^>]*>one<\/li><li[^>]*>two<\/li><\/ul>/);
  });

  it("keeps subjects on one line (no header injection)", () => {
    expect(renderSubject("Hi {{first_name}}", { first_name: "A\r\nBcc: evil@x.com" })).toBe("Hi A Bcc: evil@x.com");
  });

  it("validates button URLs", () => {
    expect(safeUrl("/play")).toBe("https://campusloop.space/play");
    expect(safeUrl("//evil.com")).toBeNull();
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("https://user:pw@x.com")).toBeNull();
  });

  it("renders a full branded email with an unsubscribe link and escaped heading", () => {
    const preset = getPreset("feature-play");
    expect(preset).toBeDefined();
    const email = renderCampaignEmail(
      { ...preset!, heading: "Hi {{first_name}}" },
      { first_name: "<b>Neha</b>", college: "NIT Trichy" },
      { unsubscribeUrl: "https://campusloop.space/unsubscribe?t=abc" }
    );
    expect(email.html).toContain("Hi &lt;b&gt;Neha&lt;/b&gt;");
    expect(email.html).toContain("NIT Trichy");
    expect(email.html).toContain('href="https://campusloop.space/play"');
    expect(email.html).toContain("https://campusloop.space/unsubscribe?t=abc");
    expect(email.html).not.toContain("<style");
    expect(email.text).toContain("Unsubscribe from these emails");
    expect(email.text).toContain("Hi <b>Neha</b>");
  });
});

describe("unsubscribe tokens", () => {
  const key = "test-secret-at-least-16-chars";

  it("round-trips a profile id", () => {
    const token = signUnsubscribeToken("3f1c2a7e-0000-4000-8000-000000000001", key);
    expect(verifyUnsubscribeToken(token, key)).toBe("3f1c2a7e-0000-4000-8000-000000000001");
  });

  it("rejects tampered, foreign and malformed tokens", () => {
    const token = signUnsubscribeToken("profile-a", key);
    const [, sig] = token.split(".");
    const forged = `${Buffer.from("profile-b").toString("base64url")}.${sig}`;
    expect(verifyUnsubscribeToken(forged, key)).toBeNull();
    expect(verifyUnsubscribeToken(token, "another-secret-of-16-chars")).toBeNull();
    expect(verifyUnsubscribeToken(`${token}x`, key)).toBeNull();
    expect(verifyUnsubscribeToken("garbage", key)).toBeNull();
    expect(verifyUnsubscribeToken("a.b.c", key)).toBeNull();
    expect(verifyUnsubscribeToken(null, key)).toBeNull();
    expect(verifyUnsubscribeToken(token, null)).toBeNull();
  });

  it("refuses to sign without a secret", () => {
    expect(() => signUnsubscribeToken("p", null)).toThrow();
  });

  it("builds RFC 8058 headers on https", () => {
    const h = listUnsubscribeHeaders("tok");
    expect(h["List-Unsubscribe"]).toBe("<https://campusloop.space/api/email/unsubscribe?t=tok>");
    expect(h["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
});

/** In-memory QueueStore with the same claim semantics as the SQL version. */
function memoryStore(opts: { unsubscribed?: string[]; campaignStatus?: QueueCampaign["status"] } = {}) {
  const campaign: QueueCampaign = {
    id: "c1",
    status: opts.campaignStatus ?? "QUEUED",
    subject: "Hi {{first_name}}",
    preheader: "",
    heading: "Hello",
    body: "Body",
    buttonLabel: "Open",
    buttonUrl: "/feeds",
  };
  const rows: (ClaimedRecipient & { status: string; updatedAt: Date })[] = [];
  let seq = 0;
  const store: QueueStore = {
    async insertRecipients(campaignId, list) {
      let n = 0;
      for (const r of list) {
        if (rows.some((x) => x.campaignId === campaignId && x.profileId === r.profileId)) continue;
        rows.push({ id: `r${++seq}`, campaignId, profileId: r.profileId, email: r.email, status: "QUEUED", updatedAt: new Date() });
        n++;
      }
      return n;
    },
    async activeCampaigns() {
      return campaign.status === "QUEUED" || campaign.status === "SENDING" ? [campaign] : [];
    },
    async markStarted() {
      campaign.status = "SENDING";
    },
    async failStale(_id, olderThan) {
      let n = 0;
      for (const r of rows) if (r.status === "SENDING" && r.updatedAt < olderThan) { r.status = "FAILED"; n++; }
      return n;
    },
    async claim(campaignId, limit) {
      if (campaign.status === "CANCELLED") return [];
      const picked = rows.filter((r) => r.campaignId === campaignId && r.status === "QUEUED").slice(0, limit);
      for (const r of picked) { r.status = "SENDING"; r.updatedAt = new Date(); }
      return picked.map(({ id, campaignId: c, profileId, email }) => ({ id, campaignId: c, profileId, email }));
    },
    async context(ids) {
      const m = new Map<string, RecipientContext>();
      for (const id of ids) {
        const r = rows.find((x) => x.profileId === id)!;
        m.set(id, {
          email: r.email,
          status: "ACTIVE",
          isSeeded: false,
          unsubscribed: (opts.unsubscribed ?? []).includes(id),
          vars: { first_name: id, college: "IIT", username: id },
        });
      }
      return m;
    },
    async finish(id, result: RecipientResult) {
      const r = rows.find((x) => x.id === id)!;
      if (r.status === "SENDING") r.status = result.status;
    },
    async refresh() {
      const remaining = rows.filter((r) => r.status === "QUEUED" || r.status === "SENDING").length;
      if (remaining === 0 && campaign.status !== "CANCELLED") campaign.status = "DONE";
      return { remaining };
    },
  };
  return { store, rows, campaign };
}

describe("batch sending idempotency", () => {
  const people = Array.from({ length: 120 }, (_, i) => ({ profileId: `p${i}`, email: `student${i}@college.ac.in` }));
  const signToken = (id: string) => `tok-${id}`;

  it("enqueueing twice never creates duplicate recipients", async () => {
    const { store, rows } = memoryStore();
    expect(await enqueueRecipients(store, "c1", [...people, people[0]])).toBe(120);
    expect(await enqueueRecipients(store, "c1", people)).toBe(0);
    expect(rows).toHaveLength(120);
  });

  it("sends each recipient exactly once across batches and repeated runs", async () => {
    const { store, campaign } = memoryStore();
    await enqueueRecipients(store, "c1", people);
    const send = vi.fn(async (_o: SendEmailOptions) => ({ success: true, messageId: "m" }));
    const sleep = vi.fn(async () => {});

    const first = await processCampaignQueue({ store, send, sleep, batchSize: 50, maxBatches: 2, signToken });
    expect(first.sent).toBe(100);
    expect(sleep).toHaveBeenCalledTimes(1);
    const second = await processCampaignQueue({ store, send, sleep, batchSize: 50, maxBatches: 4, signToken });
    expect(second.sent).toBe(20);
    const third = await processCampaignQueue({ store, send, sleep, batchSize: 50, maxBatches: 4, signToken });
    expect(third.sent).toBe(0);

    expect(send).toHaveBeenCalledTimes(120);
    const recipients = send.mock.calls.map(([o]) => o.to);
    expect(new Set(recipients).size).toBe(120);
    expect(campaign.status).toBe("DONE");

    const message = send.mock.calls[0][0];
    expect(message.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(message.subject).toBe("Hi p0");
  });

  it("two overlapping runs never send to the same person", async () => {
    const { store } = memoryStore();
    await enqueueRecipients(store, "c1", people);
    const send = vi.fn(async (_o: SendEmailOptions) => {
      await new Promise((r) => setTimeout(r, 1));
      return { success: true, messageId: "m" };
    });
    const opts = { store, send, sleep: async () => {}, batchSize: 50, maxBatches: 3, signToken };
    const [a, b] = await Promise.all([processCampaignQueue(opts), processCampaignQueue(opts)]);
    expect(a.sent + b.sent).toBe(120);
    expect(new Set(send.mock.calls.map(([o]) => o.to)).size).toBe(send.mock.calls.length);
  });

  it("skips people who unsubscribed after queueing and records failures without retrying", async () => {
    const { store, rows } = memoryStore({ unsubscribed: ["p1"] });
    await enqueueRecipients(store, "c1", people.slice(0, 3));
    const send = vi.fn(async (o: SendEmailOptions) =>
      o.to === "student2@college.ac.in" ? { success: false, error: "bounced" } : { success: true, messageId: "m" }
    );
    const r1 = await processCampaignQueue({ store, send, sleep: async () => {}, signToken });
    expect(r1).toMatchObject({ sent: 1, failed: 1, skipped: 1 });
    expect(rows.map((r) => r.status)).toEqual(["SENT", "SKIPPED", "FAILED"]);
    await processCampaignQueue({ store, send, sleep: async () => {}, signToken });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("treats a simulated send as a failure when asked (production)", async () => {
    const { store } = memoryStore();
    await enqueueRecipients(store, "c1", people.slice(0, 1));
    const send = vi.fn(async () => ({ success: true, simulated: true, messageId: "sim" }));
    const r = await processCampaignQueue({ store, send, sleep: async () => {}, signToken, treatSimulatedAsFailure: true });
    expect(r.failed).toBe(1);
  });

  it("a cancelled campaign sends nothing", async () => {
    const { store } = memoryStore({ campaignStatus: "CANCELLED" });
    await enqueueRecipients(store, "c1", people);
    const send = vi.fn(async () => ({ success: true }));
    const r = await processCampaignQueue({ store, send, sleep: async () => {}, signToken });
    expect(r.sent).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });
});
