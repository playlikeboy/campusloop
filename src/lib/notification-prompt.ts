/**
 * When to ask "Turn on notifications?". The ask waits until the person has a reason to
 * want pings: a second session, or a meaningful action (post, comment, join...). It is
 * never shown on the first page load of a session, and at most once per 14 days.
 * All storage access is wrapped: blocked storage just means we do not ask.
 */

const STATE_KEY = "campusloop_notif_prompt_v2";
/** v1 stored "true" once the old prompt was answered; treat that as asked just now. */
const LEGACY_KEY = "campusloop_notif_prompted_v1";
const SESSION_KEY = "campusloop_notif_session_v2";
export const MEANINGFUL_ACTION_EVENT = "campusloop_meaningful_action";
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

interface PromptState {
  sessions: number;
  engaged: boolean;
  /** Last time the prompt was shown, answered or dismissed (ms). */
  lastAskedAt?: number;
}

function readState(): PromptState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    let parsed: Partial<PromptState> = raw ? JSON.parse(raw) : {};
    if (!raw && localStorage.getItem(LEGACY_KEY)) {
      parsed = { lastAskedAt: Date.now() };
      localStorage.removeItem(LEGACY_KEY);
      localStorage.setItem(STATE_KEY, JSON.stringify(parsed));
    }
    return {
      sessions: Number(parsed.sessions) || 0,
      engaged: Boolean(parsed.engaged),
      lastAskedAt: typeof parsed.lastAskedAt === "number" ? parsed.lastAskedAt : undefined,
    };
  } catch {
    return null;
  }
}

function writeState(state: PromptState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // storage blocked: we simply will not ask
  }
}

/**
 * Call on every page view. Counts browser sessions (one per tab session) and returns
 * how many page views this session has had, including this one.
 */
export function notePageView(): number {
  try {
    const views = Number(sessionStorage.getItem(SESSION_KEY)) || 0;
    if (views === 0) {
      const state = readState();
      if (state) writeState({ ...state, sessions: state.sessions + 1 });
    }
    sessionStorage.setItem(SESSION_KEY, String(views + 1));
    return views + 1;
  } catch {
    return 0;
  }
}

/** Records that the person did something worth being notified about (post, comment, join...). */
export function markMeaningfulAction() {
  if (typeof window === "undefined") return;
  const state = readState();
  if (state && !state.engaged) writeState({ ...state, engaged: true });
  window.dispatchEvent(new CustomEvent(MEANINGFUL_ACTION_EVENT));
}

/**
 * True when the browser can ask and our pacing rules allow it now. `afterAction` is set
 * right after a meaningful action; otherwise the first page view of a session never asks.
 */
export function canAskForNotifications(
  { pageViews, afterAction = false }: { pageViews: number; afterAction?: boolean },
  now = Date.now()
): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "default") return false;
  const state = readState();
  if (!state) return false;
  if (state.lastAskedAt && now - state.lastAskedAt < COOLDOWN_MS) return false;
  if (!state.engaged && state.sessions < 2) return false;
  return afterAction || pageViews >= 2;
}

/** Starts the 14-day quiet period (on show, "Not now", close or "Turn on"). */
export function markAsked(now = Date.now()) {
  const state = readState();
  if (state) writeState({ ...state, lastAskedAt: now });
}
