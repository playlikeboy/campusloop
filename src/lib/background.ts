import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Keep side work alive after the response has been sent.
 *
 * On Cloudflare Workers an un-awaited promise is cancelled the moment the
 * handler returns its Response — a bare `promise.catch(() => {})` silently
 * drops whatever DB writes or fetches were still pending. Registering the task
 * with `ctx.waitUntil` extends the invocation until it settles, so callers keep
 * fast responses without losing the work.
 *
 * Outside the Workers runtime (dev server, tests) there is no execution context
 * and the promise simply keeps running on the Node event loop.
 *
 * Never throws; failures are logged under `label`.
 */
export function runInBackground(task: Promise<unknown>, label = "background task"): void {
  const guarded = task.catch((error) => {
    console.warn(`[${label}] failed:`, error);
  });

  try {
    getCloudflareContext().ctx.waitUntil(guarded);
  } catch {
    // No Workers context available — nothing else to do.
  }
}
