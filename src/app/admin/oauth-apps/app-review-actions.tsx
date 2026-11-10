"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { moderateOauthApp } from "./actions";

const btn = "h-8 rounded-lg px-3 text-xs font-semibold disabled:opacity-50 cursor-pointer";

export function AppReviewActions({ id, status, reviewStatus, isFirstParty, hasSensitive }: { id: string; status: string; reviewStatus: string; isFirstParty: boolean; hasSensitive: boolean }) {
  const [pending, start] = useTransition();
  const run = (action: Parameters<typeof moderateOauthApp>[1], ask?: string) => {
    const note = ask ? window.prompt(ask) ?? undefined : undefined;
    if (ask && note === undefined) return;
    start(async () => {
      try {
        await moderateOauthApp(id, action, note);
        toast.success("Updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {hasSensitive && reviewStatus !== "APPROVED" && <button type="button" disabled={pending} onClick={() => run("approve")} className={`${btn} bg-primary text-primary-foreground`}>Approve access</button>}
      {hasSensitive && reviewStatus !== "REJECTED" && <button type="button" disabled={pending} onClick={() => run("reject", "Reason shown to the developer")} className={`${btn} bg-muted`}>Decline</button>}
      {status === "ACTIVE" ? (
        <button type="button" disabled={pending} onClick={() => run("suspend", "Why is this app suspended? (shown to the developer)")} className={`${btn} text-destructive hover:bg-destructive/10`}>Suspend</button>
      ) : (
        <button type="button" disabled={pending} onClick={() => run("activate")} className={`${btn} bg-muted`}>Reactivate</button>
      )}
      <button type="button" disabled={pending} onClick={() => run(isFirstParty ? "third-party" : "first-party")} className={`${btn} bg-muted`}>{isFirstParty ? "Unmark ecosystem" : "Mark ecosystem app"}</button>
    </div>
  );
}
