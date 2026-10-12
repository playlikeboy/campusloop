"use client";

import { Suspense } from "react";
import Link from "next/link";
import { HexclaveTheme, SignIn, SignUp } from "@hexclave/next";
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { InstagramIcon } from "@/components/ui/social-icons";

interface AuthSplitLayoutProps {
  mode: "sign-in" | "sign-up";
  returnTo?: string;
  collegeHint?: string;
}

function AuthLoadingSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[360px] animate-pulse space-y-3 py-1"
      aria-label="Loading sign-in options"
    >
      <div className="h-10 rounded-xl bg-muted/70" />
      <div className="flex items-center gap-3 py-0.5">
        <div className="h-px flex-1 bg-border" />
        <div className="h-2.5 w-20 rounded bg-muted/70" />
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-16 rounded bg-muted/70" />
        <div className="h-10 rounded-xl bg-muted/70" />
      </div>
      <div className="h-10 rounded-full bg-primary/30" />
    </div>
  );
}

export function AuthSplitLayout({
  mode,
  returnTo,
  collegeHint,
}: AuthSplitLayoutProps) {
  const oppositeMode = mode === "sign-in" ? "sign-up" : "sign-in";
  const oppositeHref = returnTo
    ? "/" + oppositeMode + "?returnTo=" + encodeURIComponent(returnTo)
    : "/" + oppositeMode;

  return (
    <main className="relative isolate flex min-h-svh h-svh w-full items-center justify-center overflow-y-auto sm:overflow-hidden bg-background px-4 py-4 text-foreground selection:bg-primary/20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col rounded-2xl border border-border/80 bg-card/95 p-6 shadow-xl backdrop-blur-sm sm:p-7">
        <header className="flex flex-col items-center text-center">
          <BrandLogo size="md" href="/" />

          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Verified student access
          </span>

          <div className="mt-2.5 space-y-0.5">
            <h1
              id="auth-title"
              className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            >
              {mode === "sign-in" ? "Welcome back" : "Join your campus"}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {mode === "sign-in"
                ? "Sign in with your verified college email"
                : "Create an account with your college email"}
            </p>
          </div>
        </header>

        {collegeHint && (
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-center text-xs font-medium text-primary">
            <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Joining <strong className="font-semibold">{collegeHint}</strong>
            </span>
          </div>
        )}

        <div className="hexclave-auth-scope w-full min-w-0 pt-2.5">
          <HexclaveTheme
            theme={{
              radius: "0.75rem",
              light: {
                primary: "hsl(13, 64%, 45%)",
                primaryForeground: "hsl(0, 0%, 100%)",
                background: "hsl(37, 100%, 96%)",
                foreground: "hsl(40, 9%, 34%)",
                muted: "hsl(35, 52%, 91%)",
                mutedForeground: "hsl(38, 8%, 42%)",
                border: "hsl(33, 38%, 86%)",
                input: "hsl(33, 38%, 86%)",
                ring: "hsl(13, 64%, 45%)",
              },
              dark: {
                primary: "hsl(17, 100%, 65%)",
                primaryForeground: "hsl(14, 11%, 9%)",
                background: "hsl(14, 11%, 9%)",
                foreground: "hsl(37, 100%, 96%)",
                muted: "hsl(15, 9%, 16%)",
                mutedForeground: "hsl(36, 17%, 72%)",
                border: "hsl(14, 12%, 21%)",
                input: "hsl(14, 12%, 21%)",
                ring: "hsl(17, 100%, 65%)",
              },
            }}
          >
            <Suspense fallback={<AuthLoadingSkeleton />}>
              {mode === "sign-in" ? (
                <SignIn fullPage={false} />
              ) : (
                <SignUp fullPage={false} />
              )}
            </Suspense>
          </HexclaveTheme>
        </div>

        <p className="pt-3 text-center text-xs text-muted-foreground sm:text-sm">
          {mode === "sign-in"
            ? "New to CampusLoop? "
            : "Already have an account? "}
          <Link
            href={oppositeHref}
            className="font-bold text-primary underline-offset-4 transition-colors hover:underline"
          >
            {mode === "sign-in" ? "Create an account" : "Sign in"}
          </Link>
        </p>

        <footer className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3 text-primary" aria-hidden="true" />
            <span>1,350+ college hubs</span>
          </span>
          <a
            href="https://www.instagram.com/campusloop.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium transition-colors hover:text-primary"
          >
            <InstagramIcon className="size-3 text-primary" />
            <span>Need help?</span>
            <ExternalLink className="size-2.5" aria-hidden="true" />
          </a>
        </footer>
      </div>
    </main>
  );
}

export { AuthSplitLayout as AuthCardLayout };
