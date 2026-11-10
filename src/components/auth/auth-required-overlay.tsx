"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type AuthRequiredAction =
  | "like"
  | "join"
  | "comment"
  | "reply"
  | "follow"
  | "save"
  | "repost"
  | "vote"
  | "message"
  | "create"
  | "rsvp"
  | "continue";

type AuthRequiredDetail = { action?: AuthRequiredAction };

const DESCRIPTION = "You need an account for this. Joining is free with your college email.";

const TITLES: Record<AuthRequiredAction, string> = {
  like: "Sign in to like this",
  join: "Sign in to join",
  comment: "Sign in to comment",
  reply: "Sign in to reply",
  follow: "Sign in to follow",
  save: "Sign in to save this",
  repost: "Sign in to repost",
  vote: "Sign in to vote",
  message: "Sign in to send a message",
  create: "Sign in to post",
  rsvp: "Sign in to RSVP",
  continue: "Sign in to continue",
};

function getActionTitle(action: AuthRequiredAction) {
  return TITLES[action] ?? TITLES.continue;
}

export function notifyAuthRequired(action: AuthRequiredAction = "continue") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthRequiredDetail>("campusloop:auth-required", { detail: { action } })
  );
}

export function classifyAuthAction(url: string): AuthRequiredAction {
  const value = url.toLowerCase();
  if (value.includes("/vote") || value.includes("poll-vote")) return "vote";
  if (value.includes("/save")) return "save";
  if (value.includes("/comment") || value.includes("/reply")) return "comment";
  if (value.includes("/follow")) return "follow";
  if (value.includes("/repost")) return "repost";
  if (value.includes("/chat") || value.includes("/message")) return "message";
  if (value.includes("/join") || value.includes("/communities/")) return "join";
  if (value.includes("/event") || value.includes("/rsvp")) return "rsvp";
  if (value.includes("/posts")) return "like";
  return "continue";
}

export function AuthRequiredOverlay() {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<AuthRequiredAction>("continue");

  useEffect(() => {
    const handleAuthRequired = (event: Event) => {
      const detail = (event as CustomEvent<AuthRequiredDetail>).detail;
      setAction(detail?.action || "continue");
      setOpen(true);
    };

    window.addEventListener("campusloop:auth-required", handleAuthRequired);
    return () => window.removeEventListener("campusloop:auth-required", handleAuthRequired);
  }, []);

  function handleLogin() {
    window.location.href = `/sign-in?returnTo=${encodeURIComponent(window.location.href)}`;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getActionTitle(action)}</DialogTitle>
          <DialogDescription>{DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={handleLogin}>
            Sign in with college email
          </Button>
          <Button asChild variant="ghost">
            <Link href="/college-request" onClick={() => setOpen(false)}>
              My college isn't listed
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AuthRequiredFetchBridge() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const input = args[0];
      const init = args[1];
      const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const response = await originalFetch(...args);

      if (response.status === 401 && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        notifyAuthRequired(classifyAuthAction(url));
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
