"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { moderateOauthApp } from "./actions";

export function AppReviewActions({
  id,
  status,
  reviewStatus,
  isFirstParty,
  hasSensitive,
}: {
  id: string;
  status: string;
  reviewStatus: string;
  isFirstParty: boolean;
  hasSensitive: boolean;
}) {
  const [pending, start] = useTransition();
  const run = (action: Parameters<typeof moderateOauthApp>[1], ask?: string) => {
    const note = ask ? (window.prompt(ask) ?? undefined) : undefined;
    if (ask && note === undefined) return;
    start(async () => {
      try {
        await moderateOauthApp(id, action, note);
        toast.success("App updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't update the app. Try again.");
      }
    });
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {hasSensitive && reviewStatus !== "APPROVED" && (
        <Button size="sm" disabled={pending} onClick={() => run("approve")}>
          Approve access
        </Button>
      )}
      {hasSensitive && reviewStatus !== "REJECTED" && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => run("reject", "Reason shown to the developer")}
        >
          Decline
        </Button>
      )}
      {status === "ACTIVE" ? (
        <Button
          size="sm"
          variant="ghost"
          className="text-danger"
          disabled={pending}
          onClick={() => run("suspend", "Why is this app suspended? The developer will see this.")}
        >
          Suspend
        </Button>
      ) : (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run("activate")}>
          Reactivate
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => run(isFirstParty ? "third-party" : "first-party")}
      >
        {isFirstParty ? "Unmark as CampusLoop app" : "Mark as CampusLoop app"}
      </Button>
    </div>
  );
}
