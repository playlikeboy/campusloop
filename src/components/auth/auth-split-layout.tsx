"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { HexclaveTheme, SignIn, SignUp } from "@hexclave/next";
import {
  BookOpen,
  Building2,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
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
      className="mx-auto w-full max-w-[420px] animate-pulse space-y-4 py-2"
      aria-label="Loading sign-in options"
    >
      <div className="h-11 rounded-2xl bg-muted/70" />
      <div className="h-11 rounded-2xl bg-muted/70" />
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-border" />
        <div className="h-3 w-24 rounded bg-muted/70" />
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-muted/70" />
        <div className="h-11 rounded-2xl bg-muted/70" />
      </div>
      <div className="h-12 rounded-full bg-primary/30" />
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
    <main className="relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden bg-background px-3 py-5 text-foreground sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10 grid w-full max-w-[520px] grid-cols-1 overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-xl lg:max-w-[1120px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.96fr)]">
        <section
          aria-labelledby="auth-title"
          className="flex min-w-0 flex-col p-5 sm:p-8 lg:min-h-[700px] lg:p-9 xl:p-11"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 pb-5 sm:pb-7">
            <BrandLogo size="md" href="/" />
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Verified student access
            </span>
          </header>

          <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-5 py-3 sm:gap-6 sm:py-5">
            <div className="space-y-2 text-center">
              <h1
                id="auth-title"
                className="text-3xl font-black tracking-tight text-foreground sm:text-[2.125rem]"
              >
                {mode === "sign-in" ? "Welcome back" : "Find your campus"}
              </h1>
              <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
                {mode === "sign-in"
                  ? "Sign in to pick up where your campus life left off."
                  : "Create your account and meet your verified campus community."}
              </p>
            </div>

            {collegeHint && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-center text-sm text-primary">
                <Building2 className="size-4 shrink-0" aria-hidden="true" />
                <span>
                  Joining <strong>{collegeHint}</strong>
                </span>
              </div>
            )}

            <div className="hexclave-auth-scope w-full min-w-0 pt-1">
              <HexclaveTheme
                theme={{
                  radius: "0.875rem",
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

            <p className="pt-1 text-center text-sm text-muted-foreground">
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
          </div>

          <footer className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:mt-6">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>Use your official college email</span>
            </span>
            <a
              href="https://www.instagram.com/campusloop.space/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-primary"
            >
              <InstagramIcon className="size-3.5 text-primary" />
              <span>Need help?</span>
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </footer>
        </section>

        <aside
          aria-label="CampusLoop benefits"
          className="relative hidden min-w-0 flex-col justify-between gap-7 overflow-hidden border-l border-border/50 bg-muted/35 p-7 lg:flex xl:p-9"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Made for campus life
            </div>

            <h2 className="max-w-md text-3xl font-black leading-tight tracking-tight text-foreground xl:text-4xl">
              Your campus,
              <span className="block text-primary">all in one loop.</span>
            </h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground xl:text-base">
              Find study partners, share resources, discover communities, and
              keep up with what matters on campus—all in one student-first space.
            </p>

            <div className="grid gap-3 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">A space for students</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Campus-first access and connections.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Find your people</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Clubs, communities, and study partners.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Learn and build together</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Resources, events, and opportunities in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-2">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-500" />
                Campus network
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold text-primary">
                <GraduationCap className="size-3.5" aria-hidden="true" />
                1,350+ college hubs
              </span>
            </div>

            <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-md">
              <Image
                src="/campusloop/marketing/voxel/auth-campus-life.webp"
                alt="Voxel illustration of students studying and spending time together in a campus courtyard"
                fill
                priority
                sizes="(min-width: 1280px) 500px, (min-width: 1024px) 45vw, 100vw"
                className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/55 px-3 py-2 text-[10px] font-medium text-white backdrop-blur-md">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <GraduationCap className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>Verified college community</span>
                </span>
                <span className="shrink-0 font-mono font-semibold text-white/85">
                  CampusLoop
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
