"use client";

import { Bell, BellOff, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

/**
 * Phone / browser notification opt-in.
 * `banner` sits on top of /notifications; `row` sits in settings.
 */
export function PushNotificationToggle({ variant = "row" }: { variant?: "row" | "banner" }) {
  const { permission, isSubscribed, isBusy, isSupported, subscribe, sendTestNotification, unsubscribe } =
    usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (!isSupported || dismissed) return null;
  const blocked = permission === "denied";

  if (variant === "banner") {
    // Already on: nothing to ask for, keep the inbox clean.
    if (isSubscribed) return null;

    return (
      <div className="mx-4 my-3 flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg">
          {blocked ? (
            <BellOff aria-hidden="true" className="size-5" />
          ) : (
            <Bell aria-hidden="true" className="size-5" />
          )}
        </span>
        <p className="min-w-0 flex-1 text-sm text-fg">
          {blocked
            ? "Notifications are blocked. Allow them in your browser's site settings."
            : "Get a ping for new messages and replies."}
        </p>
        {blocked ? (
          <Button variant="ghost" size="icon" onClick={() => setDismissed(true)} aria-label="Dismiss">
            <X aria-hidden="true" />
          </Button>
        ) : (
          <Button size="sm" onClick={subscribe} loading={isBusy}>
            Turn on
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fg">Phone notifications</p>
        <p className="text-sm text-fg-muted">
          {blocked
            ? "Blocked in your browser. Allow them in site settings to turn this on."
            : isSubscribed
              ? "On for this device."
              : "Off. You won't get pings outside the app."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isSubscribed && (
          <Button variant="ghost" size="sm" onClick={sendTestNotification}>
            Send a test
          </Button>
        )}
        <Button
          size="sm"
          variant={isSubscribed ? "outline" : "primary"}
          onClick={isSubscribed ? unsubscribe : subscribe}
          loading={isBusy}
          disabled={blocked}
        >
          {isSubscribed ? "Turn off" : "Turn on"}
        </Button>
      </div>
    </div>
  );
}
