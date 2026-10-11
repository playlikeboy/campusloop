import { afterEach, describe, expect, it, vi } from "vitest";

const waitUntil = vi.fn();
const getCloudflareContext = vi.fn(() => ({ ctx: { waitUntil } }));

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext }));

const { runInBackground } = await import("./background");

describe("runInBackground", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("registers the task with waitUntil so the Worker keeps it alive", async () => {
    runInBackground(Promise.resolve("done"));
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(waitUntil.mock.calls[0][0]).resolves.toBe("done");
  });

  it("swallows and logs failures instead of rejecting", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    runInBackground(Promise.reject(new Error("boom")), "test task");
    await expect(waitUntil.mock.calls[0][0]).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith("[test task] failed:", expect.any(Error));
    warn.mockRestore();
  });

  it("does not throw outside the Workers runtime", () => {
    getCloudflareContext.mockImplementationOnce(() => {
      throw new Error("no context");
    });
    expect(() => runInBackground(Promise.resolve())).not.toThrow();
  });
});
