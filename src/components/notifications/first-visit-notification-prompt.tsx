"use client";

import { Bell, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { hasAuthCookie } from "@/lib/auth-cookie";
import { haptics } from "@/lib/haptics";
import {
  canAskForNotifications,
  MEANINGFUL_ACTION_EVENT,
  markAsked,
  notePageView,
} from "@/lib/notification-prompt";
import { sounds } from "@/lib/sounds";

const SHOW_DELAY_MS = 2500;

/**
 * Asks whether to turn on phone notifications, politely: only for signed-in people on
 * their second session or right after a post/comment/join, never on a session's first
 * page load, and at most once per 14 days (see src/lib/notification-prompt.ts).
 */
export function FirstVisitNotificationPrompt() {
  const { permission, isSupported, isSubscribed, isBusy, subscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!hasAuthCookie()) return;
    const pageViews = notePageView();
    if (!canAskForNotifications({ pageViews })) return;
    const timer = setTimeout(() => setShowPrompt(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAction = () => {
      if (!hasAuthCookie() || !canAskForNotifications({ pageViews: 0, afterAction: true })) return;
      clearTimeout(timer);
      timer = setTimeout(() => setShowPrompt(true), 1200);
    };
    window.addEventListener(MEANINGFUL_ACTION_EVENT, onAction);
    return () => {
      window.removeEventListener(MEANINGFUL_ACTION_EVENT, onAction);
      clearTimeout(timer);
    };
  }, []);

  const visible = showPrompt && isSupported && !isSubscribed && permission === "default";

  // Seen once starts the 14-day quiet period, even if it is ignored.
  useEffect(() => {
    if (visible) markAsked();
  }, [visible]);

  async function enable() {
    sounds.tap();
    haptics.light();
    await subscribe();
    setShowPrompt(false);
  }

  function dismiss() {
    setShowPrompt(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="notif-prompt-title"
      aria-describedby="notif-prompt-desc"
      className="sticker-pop fixed inset-x-3 bottom-[calc(var(--nav-mobile-h)+env(safe-area-inset-bottom)+0.75rem)] z-50 mx-auto max-w-sm rounded-lg border border-border bg-surface-raised p-3 shadow-lg lg:right-6 lg:bottom-6 lg:left-auto lg:mx-0 lg:w-96 lg:max-w-none lg:p-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-text">
          <Bell aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="notif-prompt-title" className="text-sm font-semibold text-fg sm:text-base">
            Turn on notifications?
          </h2>
          <p id="notif-prompt-desc" className="text-xs text-fg-muted sm:text-sm">
            Get a ping for new messages and replies.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="-mr-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui outline-none hover:bg-surface-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={dismiss}>
          Not now
        </Button>
        <Button onClick={enable} loading={isBusy}>
          Turn on
        </Button>
      </div>
    </div>
  );
}
