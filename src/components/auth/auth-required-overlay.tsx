"use client";

import { ArrowRight, Building2, GraduationCap, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

const COPY: Record<AuthRequiredAction, { title: string; description: string }> = {
  like: { title: "Log in to like", description: "Sign in to like posts and interact with your campus." },
  join: { title: "Log in to join", description: "Sign in to join this campus community." },
  comment: { title: "Log in to comment", description: "Sign in to join the discussion." },
  reply: { title: "Log in to reply", description: "Sign in to reply and take part in the conversation." },
  follow: { title: "Log in to follow", description: "Sign in to follow students and communities." },
  save: { title: "Log in to save", description: "Sign in to save posts to your CampusLoop vault." },
  repost: { title: "Log in to repost", description: "Sign in to share this post with your campus network." },
  vote: { title: "Log in to vote", description: "Sign in to participate in polls and campus votes." },
  message: { title: "Log in to message", description: "Sign in to start a conversation with other students." },
  create: { title: "Log in to create", description: "Sign in to create posts, communities, and campus content." },
  rsvp: { title: "Log in to register", description: "Sign in to register for this campus event." },
  continue: { title: "Login required", description: "You need to be logged in to continue." },
};

function getActionLabel(action: AuthRequiredAction) {
  return COPY[action] ?? COPY.continue;
}

export function notifyAuthRequired(action: AuthRequiredAction = "continue") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AuthRequiredDetail>("campusloop:auth-required", { detail: { action } }));
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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const copy = getActionLabel(action);

  function handleLogin() {
    window.location.href = `/sign-in?returnTo=${encodeURIComponent(window.location.href)}`;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 p-3 backdrop-blur-md sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="campusloop-login-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="relative p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close login dialog"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>

          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="size-6" />
          </div>

          <div className="pr-8">
            <h2 id="campusloop-login-title" className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              {copy.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.description}</p>
          </div>

          <div className="mt-5 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">College email required</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  CampusLoop accounts must use a verified email provided by your college.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={handleLogin}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-sm transition-transform hover:opacity-95 active:scale-[0.98]"
            >
              Continue with College Email
              <ArrowRight className="size-4" />
            </button>

            <Link
              href="/college-request"
              onClick={() => setOpen(false)}
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted"
            >
              My college isn't listed
            </Link>
          </div>

          <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
            If your college email is not indexed yet, request CampusLoop to add your college and its official email pattern.
          </p>
        </div>
      </section>
    </div>
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
