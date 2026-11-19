"use client";

import { Bell, BellOff, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface TestResult {
  kind: "web" | "expo";
  service?: string;
  platform?: string;
  device?: string;
  result: "sent" | "expired" | "failed" | "not-configured";
  status?: number;
  detail?: string;
}

const RESULT_LABEL: Record<TestResult["result"], string> = {
  sent: "Sent",
  expired: "Expired, removed",
  failed: "Failed",
  "not-configured": "Push not set up on the server",
};

function describe(r: TestResult): string {
  if (r.kind === "expo") return `CampusLoop app (${r.platform ?? "phone"} ${r.device ?? ""})`.trim();
  const host = r.service ?? "";
  if (host.includes("googleapis") || host.includes("google")) return "Chrome or Edge on Android/desktop";
  if (host.includes("mozilla")) return "Firefox";
  if (host.includes("apple")) return "Safari";
  if (host.includes("windows")) return "Edge on Windows";
  return host || "Browser";
}

/**
 * Sends a real push through the server to every browser and app install of
 * this student, and lists what each push service answered.
 */
function SendTestButton() {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);

  async function send() {
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { results?: TestResult[]; sent?: number } | null;
      if (!res.ok || !data) {
        toast.error(res.status === 429 ? "Too many tests. Wait a minute." : "Couldn't send a test. Try again.");
        return;
      }
      const list = data.results ?? [];
      setResults(list);
      if (list.length === 0) toast.info("No devices are signed up yet. Turn on notifications first.");
      else if ((data.sent ?? 0) > 0) toast.success("Test sent. It should arrive in a few seconds.");
      else toast.error("The test didn't go through. See the details below.");
    } catch {
      toast.error("Couldn't send a test. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={send} loading={busy} className="w-full sm:w-auto">
        Send me a test notification
      </Button>
      {results && results.length > 0 && (
        <ul className="space-y-1 text-sm" aria-live="polite">
          {results.map((r, i) => (
            <li key={`${r.kind}-${i}`} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-fg-muted">{describe(r)}</span>
              <span className={r.result === "sent" ? "shrink-0 text-success" : "shrink-0 text-danger"}>
                {RESULT_LABEL[r.result]}
                {r.result === "failed" && r.status ? ` (${r.status})` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Phone / browser notification opt-in.
 * `banner` sits on top of /notifications; `row` sits in settings.
 */
export function PushNotificationToggle({ variant = "row" }: { variant?: "row" | "banner" }) {
  const { permission, isSubscribed, isBusy, isSupported, subscribe, unsubscribe } = usePushNotifications();
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
          <Button onClick={subscribe} loading={isBusy}>
            Turn on
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
        <Button
          variant={isSubscribed ? "outline" : "primary"}
          onClick={isSubscribed ? unsubscribe : subscribe}
          loading={isBusy}
          disabled={blocked}
        >
          {isSubscribed ? "Turn off" : "Turn on"}
        </Button>
      </div>
      <SendTestButton />
    </div>
  );
}
