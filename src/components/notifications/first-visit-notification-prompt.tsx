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
      className="sticker-pop fixed right-4 bottom-20 left-4 z-50 rounded-lg border border-border bg-surface-raised p-4 shadow-lg sm:right-6 sm:bottom-6 sm:left-auto sm:w-96"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 flex size-10 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-ui hover:bg-surface-muted hover:text-fg"
        aria-label="Close"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg">
          <Bell aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 id="notif-prompt-title" className="text-base text-fg">
            Turn on notifications?
          </h2>
          <p className="text-sm text-fg-muted">Get a ping when someone messages or replies to you.</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={dismiss}>
          Not now
        </Button>
        <Button size="sm" onClick={enable} loading={isBusy}>
          Turn on
        </Button>
      </div>
    </div>
  );
}
