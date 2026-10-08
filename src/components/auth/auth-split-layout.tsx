"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { HexclaveTheme, SignIn, SignUp } from "@hexclave/next";
import {
  Building2,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { InstagramIcon } from "@/components/ui/social-icons";
import { cn } from "@/lib/utils";

interface AuthSplitLayoutProps {
  mode: "sign-in" | "sign-up";
  returnTo?: string;
  collegeHint?: string;
}

function AuthLoadingSkeleton() {
  return (
    <div className="w-full max-w-[380px] mx-auto space-y-4 animate-pulse py-2">
      <div className="h-11 rounded-full bg-muted/60" />
      <div className="h-11 rounded-full bg-muted/60" />
      <div className="flex items-center gap-3 my-2">
        <div className="h-px bg-border/40 flex-1" />
        <div className="h-3 w-8 bg-muted/40 rounded" />
        <div className="h-px bg-border/40 flex-1" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-16 bg-muted/50 rounded" />
        <div className="h-11 rounded-full bg-muted/60" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-20 bg-muted/50 rounded" />
        <div className="h-11 rounded-full bg-muted/60" />
      </div>
      <div className="h-12 rounded-full bg-primary/40 mt-4" />
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
    ? `/${oppositeMode}?returnTo=${encodeURIComponent(returnTo)}`
    : `/${oppositeMode}`;

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-background text-foreground flex items-center justify-center p-3 sm:p-6 lg:p-8 relative select-none">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Main Split Card Container */}
      <div className="relative z-10 w-full max-w-5xl xl:max-w-[1040px] bg-card rounded-3xl sm:rounded-[2rem] shadow-xl border border-border/60 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* ========================================================= */}
        {/* LEFT COLUMN: AUTH FORM & DIRECT HEXCLAVE COMPONENT        */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[560px] sm:min-h-[620px]">
          {/* Top Brand & Institutional Label */}
          <div className="flex items-center justify-between pb-4 sm:pb-6">
            <BrandLogo size="md" href="/" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              <ShieldCheck className="size-3.5" />
              <span>Verified Student Gate</span>
            </div>
          </div>

          {/* Form Content Body */}
          <div className="my-auto py-4 space-y-5">
            {/* Heading & Subtitle */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {mode === "sign-in" ? "Sign In" : "Join CampusLoop"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {mode === "sign-in"
                  ? "Welcome back to your verified campus community"
                  : "Connect with verified peers across 1,350+ Indian colleges"}
              </p>
            </div>

            {/* College Hint Banner if passed in URL */}
            {collegeHint && (
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2 text-center justify-center">
                <Building2 className="size-3.5 shrink-0" />
                <span>Joining Hub: <strong>{collegeHint}</strong></span>
              </div>
            )}

            {/* Direct Hexclave Component Container */}
            <div className="hexclave-auth-scope w-full max-w-[380px] mx-auto pt-1">
              <HexclaveTheme
                theme={{
                  radius: "0.75rem",
                  light: {
                    primary: "hsl(246, 100%, 65%)", // #5B4BFF brand primary
                    primaryForeground: "hsl(0, 0%, 100%)",
                    background: "hsl(0, 0%, 100%)",
                    foreground: "hsl(240, 10%, 4%)",
                    muted: "hsl(240, 5%, 96%)",
                    mutedForeground: "hsl(240, 4%, 46%)",
                    border: "hsl(240, 6%, 90%)",
                    input: "hsl(240, 6%, 90%)",
                    ring: "hsl(246, 100%, 65%)",
                  },
                  dark: {
                    primary: "hsl(246, 100%, 65%)",
                    primaryForeground: "hsl(0, 0%, 100%)",
                    background: "hsl(240, 10%, 4%)",
                    foreground: "hsl(0, 0%, 98%)",
                    muted: "hsl(240, 4%, 16%)",
                    mutedForeground: "hsl(240, 5%, 65%)",
                    border: "hsl(240, 4%, 20%)",
                    input: "hsl(240, 4%, 20%)",
                    ring: "hsl(246, 100%, 65%)",
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

            {/* Switch between Sign In and Sign Up */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                {mode === "sign-in" ? "New to CampusLoop? " : "Already verified? "}
                <Link
                  href={oppositeHref}
                  className="font-bold text-primary hover:underline transition-all"
                >
                  {mode === "sign-in" ? "Create an account" : "Sign in here"}
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom Trust & Support Link */}
          <div className="pt-4 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="size-3 text-primary" />
              <span>Verified college email or roll number</span>
            </span>

            <a
              href="https://www.instagram.com/campusloop.space/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1 font-semibold"
            >
              <InstagramIcon className="size-3 text-primary" />
              <span>Need help? DM us</span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: TESTIMONIAL & ENGAGING 3D VOXEL ART         */}
        {/* ========================================================= */}
        <div className="relative bg-muted/30 border-t lg:border-t-0 lg:border-l border-border/50 flex flex-col justify-between overflow-hidden p-6 sm:p-10 lg:p-12">
          {/* Top Testimonial Section */}
          <div className="space-y-4 relative z-10">
            <p className="text-foreground font-medium text-sm sm:text-base leading-relaxed">
              &ldquo;Seamless campus experience! Finding study partners, notes, hackathon teammates,
              and staying up to date with real campus buzz has never been this easy. The
              academic vault and 45K+ PYQs literally saved my semester.&rdquo;
            </p>

            {/* Student Profile Badge */}
            <div className="flex items-center gap-3 pt-1">
              <div className="relative size-10 rounded-full ring-2 ring-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-black text-xs">AS</span>
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                    Aarav Sharma
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  B.Tech CSE &apos;26 · IIT Bombay
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Engaging 3D Voxel Art Illustration */}
          <div className="relative mt-6 pt-4 z-10 flex flex-col justify-end">
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card shadow-2xs border border-border/50 text-[10px] font-semibold text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>4,200+ students active now</span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                <span>Campus Network</span>
              </div>
            </div>

            {/* Voxel Image Container */}
            <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-md group">
              <Image
                src="/campusloop/marketing/voxel/auth-campus-life.webp"
                alt="CampusLoop Voxel Student Life"
                width={1200}
                height={896}
                priority
                className="w-full h-auto object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                <span className="flex items-center gap-1">
                  <GraduationCap className="size-3 text-primary" />
                  <span>Verified .edu &amp; .ac.in Network</span>
                </span>
                <span className="text-white/80 font-mono font-semibold">1,350+ Hubs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
