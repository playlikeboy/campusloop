"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Result of one poll:
 * - `true`  → something new arrived; poll again at the base interval.
 * - `false` → nothing new; stretch the delay by `backoff` (capped at `maxMs`).
 * - `void`  → no opinion; keep the current delay.
 * A thrown error counts as `false`, so a failing endpoint is not hammered.
 */
export type SmartIntervalCallback = () => Promise<boolean | void> | boolean | void;

export interface SmartIntervalOptions {
  /** Delay between polls while things are changing. */
  baseMs: number;
  /** Upper bound the delay backs off to when nothing changes. */
  maxMs: number;
  /** Polling only runs while true. Defaults to true. */
  enabled?: boolean;
  /** Multiplier applied to the delay after a poll that found nothing new. */
  backoff?: number;
}

/** Minimal slice of `document` the controller needs; injectable for tests. */
export interface VisibilitySource {
  readonly hidden: boolean;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
}

export interface SmartIntervalController {
  start(): void;
  stop(): void;
  /** Drop back to the base delay and restart the countdown (call on user activity). */
  reset(): void;
  /** Current delay in ms (exposed for tests and debugging). */
  readonly delay: number;
}

/**
 * Framework-free polling loop behind `useSmartInterval`.
 *
 * Uses chained `setTimeout`s so a slow poll never overlaps the next one, pauses
 * while the tab is hidden and fires one poll straight away when it becomes
 * visible again.
 */
export function createSmartInterval(
  callback: SmartIntervalCallback,
  { baseMs, maxMs, backoff = 1.5 }: Omit<SmartIntervalOptions, "enabled">,
  visibility: VisibilitySource | null = typeof document === "undefined" ? null : document
): SmartIntervalController {
  const cap = Math.max(baseMs, maxMs);
  let delay = baseMs;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let running = false;

  const isHidden = () => Boolean(visibility?.hidden);

  const clear = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = (ms: number) => {
    clear();
    if (!running || isHidden()) return;
    timer = setTimeout(tick, ms);
  };

  async function tick() {
    timer = null;
    if (!running || inFlight || isHidden()) return;
    inFlight = true;
    let result: boolean | void;
    try {
      result = await callback();
    } catch {
      result = false;
    } finally {
      inFlight = false;
    }
    if (!running) return;
    if (result === true) delay = baseMs;
    else if (result === false) delay = Math.min(cap, Math.round(delay * backoff));
    schedule(delay);
  }

  const onVisibilityChange = () => {
    if (!running) return;
    if (isHidden()) {
      clear();
      return;
    }
    // Back in view: catch up right away, then continue from the base delay.
    delay = baseMs;
    clear();
    if (!inFlight) void tick();
  };

  return {
    start() {
      if (running) return;
      running = true;
      delay = baseMs;
      visibility?.addEventListener("visibilitychange", onVisibilityChange);
      schedule(delay);
    },
    stop() {
      running = false;
      clear();
      visibility?.removeEventListener("visibilitychange", onVisibilityChange);
    },
    reset() {
      delay = baseMs;
      // An in-flight poll reschedules itself with the base delay when it settles.
      if (!inFlight) schedule(delay);
    },
    get delay() {
      return delay;
    },
  };
}

/**
 * Poll `callback` with adaptive backoff: pauses on hidden tabs, slows down
 * while nothing changes, and snaps back on new data or `reset()`.
 *
 * The first poll runs `baseMs` after mount (callers load initial data
 * themselves). The latest `callback` is always used without restarting the loop.
 */
export function useSmartInterval(
  callback: SmartIntervalCallback,
  { baseMs, maxMs, enabled = true, backoff = 1.5 }: SmartIntervalOptions
): { reset: () => void } {
  const callbackRef = useRef(callback);
  const controllerRef = useRef<SmartIntervalController | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;
    const controller = createSmartInterval(() => callbackRef.current(), { baseMs, maxMs, backoff });
    controllerRef.current = controller;
    controller.start();
    return () => {
      controller.stop();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [enabled, baseMs, maxMs, backoff]);

  const reset = useCallback(() => controllerRef.current?.reset(), []);
  return { reset };
}
