"use client";

import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const PROMPT_STORAGE_KEY = "campusloop_notif_prompted_v1";

function markPrompted() {
  try {
    localStorage.setItem(PROMPT_STORAGE_KEY, "true");
  } catch {
    // storage blocked: we may ask again next visit, which is fine
  }
}

/** Asks once, a moment after the first visit, whether to turn on phone notifications. */
export function FirstVisitNotificationPrompt() {
  const { permission, isSupported, isSubscribed, isBusy, subscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    let prompted = false;
    try {
      prompted = Boolean(localStorage.getItem(PROMPT_STORAGE_KEY));
    } catch {
      prompted = true;
    }
    if (prompted || Notification.permission !== "default") return;
    const timer = setTimeout(() => setShowPrompt(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  async function enable() {
    sounds.tap();
    haptics.light();
    markPrompted();
    await subscribe();
    setShowPrompt(false);
  }

  function dismiss() {
    markPrompted();
    setShowPrompt(false);
  }

  if (!showPrompt || !isSupported || isSubscribed || permission !== "default") return null;

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
