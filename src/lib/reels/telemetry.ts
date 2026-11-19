/**
 * Reel watch telemetry: pure helpers shared by the reel player hook and tests.
 * One summary is sent per view (when the reel leaves the screen).
 */

/** Watched less than this without finishing = swiped away. */
export const REEL_QUICK_SKIP_MS = 2000;
/** Reaching this share of the clip counts as completed. */
export const REEL_COMPLETION_FRACTION = 0.9;
const MAX_WATCH_MS = 10 * 60 * 1000;

export interface ReelViewSummary {
  watchDurationMs: number;
  videoDurationMs?: number;
  loopCount: number;
  completed: boolean;
  skippedQuickly: boolean;
  action: "loop" | "dwell" | "skip";
}

export function summarizeReelView(input: {
  watchMs: number;
  durationMs?: number | null;
  loops: number;
  maxPositionMs: number;
}): ReelViewSummary {
  const watch = Math.max(0, Math.min(MAX_WATCH_MS, Math.round(input.watchMs)));
  const duration = input.durationMs && Number.isFinite(input.durationMs) && input.durationMs > 0 ? Math.round(input.durationMs) : undefined;
  const loops = Math.max(0, Math.min(20, Math.floor(input.loops)));
  const completed = loops > 0 || (duration !== undefined && input.maxPositionMs >= duration * REEL_COMPLETION_FRACTION);
  const skippedQuickly = !completed && watch < REEL_QUICK_SKIP_MS;
  return {
    watchDurationMs: watch,
    videoDurationMs: duration,
    loopCount: loops,
    completed,
    skippedQuickly,
    action: skippedQuickly ? "skip" : loops > 0 ? "loop" : "dwell",
  };
}

/**
 * A loop is the playhead jumping back to the start after nearly finishing
 * (the <video loop> attribute never fires `ended`).
 */
export function isLoopWrap(previousSec: number, currentSec: number, durationSec: number): boolean {
  if (!(durationSec > 0)) return false;
  return previousSec >= durationSec * 0.8 && currentSec < durationSec * 0.2 && currentSec < previousSec;
}
