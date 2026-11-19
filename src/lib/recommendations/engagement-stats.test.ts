import { afterEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();
vi.mock("@/db", () => ({ getDb: () => ({ execute }) }));
vi.mock("@/lib/redis", () => ({ getRedis: () => null }));
vi.mock("@/lib/background", () => ({ runInBackground: vi.fn() }));

const {
  getTypePriors,
  incrementPostStat,
  isEngagementStatsUnavailable,
  isMissingStatsTableError,
  resetEngagementStatsState,
} = await import("./engagement-stats");
const { summarizeArms } = await import("./experiment-readout");

function missingTable() {
  const pg = Object.assign(new Error('relation "post_engagement_stats" does not exist'), { code: "42P01" });
  return Object.assign(new Error("Failed query: insert into post_engagement_stats ..."), { cause: pg });
}

describe("engagement stats tolerate a missing table", () => {
  afterEach(() => {
    execute.mockReset();
    resetEngagementStatsState();
  });

  it("recognises the wrapped driver error, and only for this table", () => {
    expect(isMissingStatsTableError(missingTable())).toBe(true);
    const other = Object.assign(new Error('relation "device_push_tokens" does not exist'), { code: "42P01" });
    expect(isMissingStatsTableError(other)).toBe(false);
  });

  it("swallows the error, then skips writes until the recheck window passes", async () => {
    execute.mockRejectedValueOnce(missingTable());
    await expect(incrementPostStat("post_1", "votes")).resolves.toBeUndefined();
    expect(isEngagementStatsUnavailable()).toBe(true);
    await incrementPostStat("post_1", "votes");
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("falls back to default priors when the table is missing", async () => {
    execute.mockRejectedValueOnce(missingTable());
    const priors = await getTypePriors();
    expect(priors.DEFAULT.skip).toBeGreaterThan(0);
  });
});

describe("experiment readout", () => {
  it("reports D1 return and session length per arm with z against control", () => {
    const t = (o: Partial<Record<string, number>>) => ({
      users: 100, imp: 1000, dwell: 4_000_000, skips: 400, long: 150, votes: 0, comments: 0,
      sessions: 200, sessionMs: 200 * 300_000, d1Eligible: 100, d1Returned: 30, ...o,
    });
    const { arms, comparisons } = summarizeArms(
      new Map([
        ["control", t({})],
        ["ranking-v3", t({ d1Returned: 50, sessionMs: 200 * 450_000 })],
      ] as never)
    );
    const v3 = arms.find((a) => a.variant === "ranking-v3");
    expect(v3?.d1Rate).toBeCloseTo(0.5);
    expect(v3?.avgSessionMs).toBe(450_000);
    expect(arms.find((a) => a.variant === "personalized")?.users).toBe(0);
    expect(comparisons.find((c) => c.variant === "ranking-v3")?.d1ReturnZ).toBeGreaterThan(1.96);
  });
});
