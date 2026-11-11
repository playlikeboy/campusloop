import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSmartInterval, type VisibilitySource } from "./use-smart-interval";

function fakeVisibility() {
  const listeners = new Set<() => void>();
  const source: VisibilitySource & { setHidden(hidden: boolean): void; listenerCount(): number } = {
    hidden: false,
    addEventListener: (_type, listener) => void listeners.add(listener),
    removeEventListener: (_type, listener) => void listeners.delete(listener),
    setHidden(hidden: boolean) {
      (this as { hidden: boolean }).hidden = hidden;
      listeners.forEach((listener) => listener());
    },
    listenerCount: () => listeners.size,
  };
  return source;
}

describe("createSmartInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls at the base interval while results are new", async () => {
    const cb = vi.fn(() => true);
    const loop = createSmartInterval(cb, { baseMs: 1000, maxMs: 5000 }, fakeVisibility());
    loop.start();
    await vi.advanceTimersByTimeAsync(999);
    expect(cb).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(cb).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(cb).toHaveBeenCalledTimes(4);
    loop.stop();
  });

  it("backs off on 'nothing new' up to the cap, and resets on new data", async () => {
    let next = false;
    const cb = vi.fn(() => next);
    const loop = createSmartInterval(cb, { baseMs: 1000, maxMs: 3000, backoff: 2 }, fakeVisibility());
    loop.start();
    await vi.advanceTimersByTimeAsync(1000); // poll 1 -> delay 2000
    expect(loop.delay).toBe(2000);
    await vi.advanceTimersByTimeAsync(2000); // poll 2 -> delay 3000 (capped from 4000)
    expect(loop.delay).toBe(3000);
    await vi.advanceTimersByTimeAsync(3000); // poll 3 -> stays capped
    expect(loop.delay).toBe(3000);
    expect(cb).toHaveBeenCalledTimes(3);
    next = true;
    await vi.advanceTimersByTimeAsync(3000);
    expect(loop.delay).toBe(1000);
    loop.stop();
  });

  it("treats a thrown error as nothing new and keeps the delay on void", async () => {
    let mode: "throw" | "void" = "throw";
    const loop = createSmartInterval(
      () => {
        if (mode === "throw") throw new Error("boom");
      },
      { baseMs: 1000, maxMs: 10000 },
      fakeVisibility()
    );
    loop.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(loop.delay).toBe(1500);
    mode = "void";
    await vi.advanceTimersByTimeAsync(1500);
    expect(loop.delay).toBe(1500);
    loop.stop();
  });

  it("reset() returns to the base delay and restarts the countdown", async () => {
    const cb = vi.fn(() => false);
    const loop = createSmartInterval(cb, { baseMs: 1000, maxMs: 8000, backoff: 2 }, fakeVisibility());
    loop.start();
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    expect(loop.delay).toBe(4000);
    loop.reset();
    expect(loop.delay).toBe(1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(cb).toHaveBeenCalledTimes(3);
    loop.stop();
  });

  it("never overlaps a slow poll", async () => {
    let active = 0;
    let maxActive = 0;
    const cb = vi.fn(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      active--;
      return true;
    });
    const loop = createSmartInterval(cb, { baseMs: 1000, maxMs: 1000 }, fakeVisibility());
    loop.start();
    await vi.advanceTimersByTimeAsync(1000);
    loop.reset(); // must not start a second poll while one is in flight
    await vi.advanceTimersByTimeAsync(20000);
    expect(maxActive).toBe(1);
    // 1s wait + 5s poll per cycle
    expect(cb.mock.calls.length).toBeLessThanOrEqual(4);
    loop.stop();
  });

  it("pauses while hidden and polls immediately when visible again", async () => {
    const vis = fakeVisibility();
    const cb = vi.fn(() => false);
    const loop = createSmartInterval(cb, { baseMs: 1000, maxMs: 4000 }, vis);
    loop.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(cb).toHaveBeenCalledTimes(1);
    vis.setHidden(true);
    await vi.advanceTimersByTimeAsync(60000);
    expect(cb).toHaveBeenCalledTimes(1);
    vis.setHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(cb).toHaveBeenCalledTimes(2);
    loop.stop();
  });

  it("stop() cancels pending polls and removes the listener", async () => {
    const vis = fakeVisibility();
    const cb = vi.fn(() => true);
    const loop = createSmartInterval(cb, { baseMs: 1000, maxMs: 1000 }, vis);
    loop.start();
    expect(vis.listenerCount()).toBe(1);
    loop.stop();
    expect(vis.listenerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10000);
    expect(cb).not.toHaveBeenCalled();
  });
});
