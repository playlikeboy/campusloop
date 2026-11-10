"use client";

import { HexclaveTheme, SignIn, SignUp } from "@hexclave/next";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedSticker } from "@/components/ui/stickers";
import { SOCIAL_LINKS } from "@/constants/social";
import { AUTH_THEME } from "./auth-theme";

interface AuthSplitLayoutProps {
  mode: "sign-in" | "sign-up";
  returnTo?: string;
  collegeHint?: string;
}

const COPY = {
  "sign-in": {
    title: "Welcome back",
    lead: "Sign in with the email you joined with.",
    switchText: "New here?",
    switchLabel: "Create an account",
  },
  "sign-up": {
    title: "Join your campus",
    lead: "Use your college email so we know you're a student there.",
    switchText: "Already have an account?",
    switchLabel: "Sign in",
  },
} as const;

const TEXT_LINK =
  "font-semibold text-brand-text underline underline-offset-4 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AuthLoadingSkeleton() {
  return (
    <div className="space-y-3 py-1" role="status" aria-label="Loading sign-in options">
      <Skeleton className="h-11 rounded-md" />
      <Skeleton className="mx-auto h-3 w-24" />
      <Skeleton className="h-11 rounded-md" />
      <Skeleton className="h-11 rounded-full" />
    </div>
  );
}

/** Sign-in and sign-up: a violet story panel on wide screens, a calm form everywhere. */
export function AuthSplitLayout({ mode, returnTo, collegeHint }: AuthSplitLayoutProps) {
  const copy = COPY[mode];
  const oppositeMode = mode === "sign-in" ? "sign-up" : "sign-in";
  const oppositeHref = returnTo
    ? `/${oppositeMode}?returnTo=${encodeURIComponent(returnTo)}`
    : `/${oppositeMode}`;

  return (
    <main className="grid min-h-svh w-full bg-bg text-fg lg:grid-cols-2">
      <aside
        className="story-field hidden flex-col justify-center gap-8 px-12 py-16 lg:flex"
        aria-hidden="true"
      >
        <p className="sticker-caption max-w-[10ch] text-7xl text-story-field-fg">
          Your campus. Only your campus.
        </p>
        <VerifiedSticker className="sticker-pop self-start -rotate-3" />
      </aside>

      <div className="flex w-full flex-col items-center justify-center px-[var(--gutter)] py-10">
        <div className="w-full max-w-[400px]">
          <BrandLogo size="md" href="/" />
          <h1 id="auth-title" className="mt-8 text-3xl text-fg">
            {copy.title}
          </h1>
          <p className="mt-2 text-base text-fg-muted">{copy.lead}</p>

          {collegeHint && (
            <p className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-brand-subtle px-3 py-1.5 text-sm font-medium text-brand-text">
              <Building2 className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Joining <strong className="font-semibold">{collegeHint}</strong>
              </span>
            </p>
          )}

          <div className="hexclave-auth-scope mt-6 w-full min-w-0">
            <HexclaveTheme theme={AUTH_THEME}>
              <Suspense fallback={<AuthLoadingSkeleton />}>
                {mode === "sign-in" ? <SignIn fullPage={false} /> : <SignUp fullPage={false} />}
              </Suspense>
            </HexclaveTheme>
          </div>

          <p className="mt-6 text-sm text-fg-muted">
            {copy.switchText}{" "}
            <Link href={oppositeHref} className={TEXT_LINK}>
              {copy.switchLabel}
            </Link>
          </p>

          <p className="mt-8 border-t border-border pt-4 text-sm text-fg-muted">
            Stuck?{" "}
            <a
              href={SOCIAL_LINKS.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className={TEXT_LINK}
            >
              Message us on Instagram
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
