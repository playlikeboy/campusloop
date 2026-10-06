"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HexclaveTheme, SignIn, SignUp } from "@hexclave/next";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/social-icons";
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
      <div className="h-12 rounded-full bg-emerald-900/40 mt-4" />
    </div>
  );
}

export function AuthSplitLayout({
  mode,
  returnTo,
  collegeHint,
}: AuthSplitLayoutProps) {
  const [accountType, setAccountType] = useState<"student" | "club">("student");

  const oppositeMode = mode === "sign-in" ? "sign-up" : "sign-in";
  const oppositeHref = returnTo
    ? `/${oppositeMode}?returnTo=${encodeURIComponent(returnTo)}`
    : `/${oppositeMode}`;

  return (
    <div className="min-h-screen bg-[#0d2218] text-foreground flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Background Architectural Vector Lines (mimicking reference dark green backdrop) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 sm:opacity-40"
        aria-hidden="true"
      >
        {/* Top Left Isometric City Lines */}
        <svg
          className="absolute -top-16 -left-16 w-80 h-80 text-emerald-800/60"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M20 180 L20 60 L80 20 L140 60 L140 180" />
          <path d="M80 20 L80 180" />
          <path d="M40 70 L40 160" strokeDasharray="3 3" />
          <path d="M60 80 L60 170" strokeDasharray="3 3" />
          <path d="M100 80 L100 170" strokeDasharray="3 3" />
          <path d="M120 70 L120 160" strokeDasharray="3 3" />
          <circle cx="80" cy="15" r="4" fill="currentColor" opacity="0.6" />
        </svg>

        {/* Bottom Right Isometric Campus Buildings */}
        <svg
          className="absolute -bottom-16 -right-16 w-96 h-96 text-emerald-800/60"
          viewBox="0 0 240 240"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M40 220 L40 90 L110 40 L180 90 L180 220" />
          <path d="M110 40 L110 220" />
          <path d="M180 120 L220 150 L220 220" />
          <path d="M180 220 L220 220" />
          <path d="M65 105 L65 200" strokeDasharray="4 4" />
          <path d="M85 115 L85 205" strokeDasharray="4 4" />
          <path d="M135 115 L135 205" strokeDasharray="4 4" />
          <path d="M155 105 L155 200" strokeDasharray="4 4" />
          <circle cx="110" cy="35" r="5" fill="currentColor" opacity="0.6" />
        </svg>

        {/* Ambient subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Main Split Card Container */}
      <div className="relative z-10 w-full max-w-5xl xl:max-w-[1080px] bg-[#faf8f2] dark:bg-[#0c1813] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-black/60 border border-emerald-950/20 dark:border-emerald-800/30 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* ========================================================= */}
        {/* LEFT COLUMN: AUTH FORM & DIRECT HEXCLAVE COMPONENT        */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#faf8f2] dark:bg-[#0c1813] min-h-[580px] sm:min-h-[640px]">
          {/* Top Brand & Institutional Label */}
          <div className="flex items-center justify-between pb-4 sm:pb-6">
            <BrandLogo size="md" href="/" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/10 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-xs font-semibold border border-emerald-800/20">
              <ShieldCheck className="size-3.5" />
              <span>Verified Campus Gate</span>
            </div>
          </div>

          {/* Form Content Body */}
          <div className="my-auto py-4 space-y-5">
            {/* Heading & Subtitle */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                {mode === "sign-in" ? "Sign In" : "Sign Up"}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                {mode === "sign-in"
                  ? "Welcome back to your campus"
                  : "Create your verified student account in minutes"}
              </p>
            </div>

            {/* Account Type Selector (Matching Reference Mockup) */}
            <div className="flex items-center justify-center gap-6 pt-1 text-xs sm:text-sm">
              <label
                onClick={() => setAccountType("student")}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <span
                  className={cn(
                    "size-4 rounded-full border-2 flex items-center justify-center transition-all",
                    accountType === "student"
                      ? "border-emerald-700 bg-emerald-700/10"
                      : "border-zinc-400 group-hover:border-zinc-600"
                  )}
                >
                  {accountType === "student" && (
                    <span className="size-2 rounded-full bg-emerald-700" />
                  )}
                </span>
                <span
                  className={cn(
                    "font-semibold transition-colors",
                    accountType === "student"
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  As a Student
                </span>
              </label>

              <label
                onClick={() => setAccountType("club")}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <span
                  className={cn(
                    "size-4 rounded-full border-2 flex items-center justify-center transition-all",
                    accountType === "club"
                      ? "border-emerald-700 bg-emerald-700/10"
                      : "border-zinc-400 group-hover:border-zinc-600"
                  )}
                >
                  {accountType === "club" && (
                    <span className="size-2 rounded-full bg-emerald-700" />
                  )}
                </span>
                <span
                  className={cn(
                    "font-semibold transition-colors",
                    accountType === "club"
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  As a Campus Club
                </span>
              </label>
            </div>

            {/* Club helper banner if selected */}
            {accountType === "club" && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-center justify-center animate-in fade-in slide-in-from-top-1 duration-200">
                <Users className="size-3.5 shrink-0" />
                <span>Club / Society accounts unlock verified badges & campus event broadcast.</span>
              </div>
            )}

            {/* College Hint Banner if passed in URL */}
            {collegeHint && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-center justify-center">
                <Building2 className="size-3.5 shrink-0" />
                <span>Joining Hub: <strong>{collegeHint}</strong></span>
              </div>
            )}

            {/* Direct Hexclave Component Container */}
            <div className="hexclave-auth-scope w-full max-w-[380px] mx-auto pt-1">
              <HexclaveTheme
                theme={{
                  light: {
                    primary: "hsl(153, 50%, 20%)", // #1a4d36 deep forest emerald
                    primaryForeground: "hsl(0, 0%, 100%)",
                    background: "hsl(43, 33%, 98%)",
                    card: "hsl(0, 0%, 100%)",
                  },
                  dark: {
                    primary: "hsl(153, 60%, 28%)",
                    primaryForeground: "hsl(0, 0%, 100%)",
                    background: "hsl(153, 20%, 7%)",
                    card: "hsl(153, 22%, 10%)",
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

            {/* Switch Mode Footer Link (matching reference image) */}
            <div className="text-center pt-2">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                {mode === "sign-in" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <Link
                      href={oppositeHref}
                      className="font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 underline underline-offset-4 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link
                      href={oppositeHref}
                      className="font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 underline underline-offset-4 transition-colors"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Bottom Security & Directory Links */}
          <div className="pt-4 border-t border-zinc-200/70 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <Link
              href="/colleges"
              className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 font-medium"
            >
              <Building2 className="size-3" />
              <span>Browse 1,350+ Campus Hubs</span>
            </Link>

            <a
              href="https://www.instagram.com/campusloop.space/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 font-medium"
            >
              <InstagramIcon className="size-3 text-emerald-700" />
              <span>Need help? DM us</span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: TESTIMONIAL & ENGAGING 3D VOXEL ART         */}
        {/* ========================================================= */}
        <div className="relative bg-[#f5f2e9] dark:bg-[#12221b] border-t lg:border-t-0 lg:border-l border-zinc-200/80 dark:border-emerald-900/30 flex flex-col justify-between overflow-hidden p-6 sm:p-10 lg:p-12">
          {/* Top Testimonial Section */}
          <div className="space-y-4 relative z-10">
            {/* Stylized Quote Mark */}
            <div className="text-[#ea580c] text-4xl sm:text-5xl font-serif font-black leading-none select-none">
              &ldquo;
            </div>

            {/* Testimonial Quote */}
            <p className="text-zinc-800 dark:text-zinc-200 font-medium text-sm sm:text-base lg:text-[1.05rem] leading-relaxed">
              Seamless campus experience! Finding study partners, hackathon teammates,
              and staying up to date with real campus buzz has never been this easy. The
              academic study vault and 45K+ PYQs literally saved my semester. Definitely
              my go-to campus network.
            </p>

            <div className="text-[#ea580c] text-3xl font-serif font-black leading-none select-none text-right">
              &rdquo;
            </div>

            {/* Student Profile Badge (Matching Reference Mockup: Alex Mitchell) */}
            <div className="flex items-center gap-3 pt-1">
              <div className="relative size-10 sm:size-11 rounded-full ring-2 ring-emerald-700/30 overflow-hidden bg-emerald-900/10 flex items-center justify-center shrink-0">
                {/* Fallback stylized avatar / student initial badge */}
                <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center text-white font-bold text-sm">
                  AS
                </div>
                {/* Online pulse indicator */}
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-[#f5f2e9] dark:ring-[#12221b]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Aarav Sharma
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600/15 text-emerald-800 dark:text-emerald-300">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  B.Tech CSE &apos;26 · IIT Bombay
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Engaging 3D Voxel Art Illustration */}
          <div className="relative mt-6 pt-4 z-10 flex flex-col justify-end">
            {/* Interactive / Engaging Floating Badges */}
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/60 shadow-xs border border-black/5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 backdrop-blur-xs">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>4,200+ students active now</span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 text-[10px] font-bold border border-amber-500/20">
                <span>Campus Mascot: Pixel</span>
                <span className="text-xs">🐾</span>
              </div>
            </div>

            {/* Voxel Image Container (Anchored flush to bottom) */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-300/60 dark:border-emerald-800/40 shadow-lg group">
              <Image
                src="/campusloop/marketing/voxel/auth-campus-life.webp"
                alt="CampusLoop Voxel Student Life — students collaborating, studying, coding, and hanging out on college terrace"
                width={1200}
                height={896}
                priority
                className="w-full h-auto object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />

              {/* Subtle bottom shadow vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

              {/* Bottom interactive caption chip */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                <span className="flex items-center gap-1">
                  <GraduationCap className="size-3 text-emerald-400" />
                  <span>Verified .edu & .ac.in Network</span>
                </span>
                <span className="text-emerald-300 font-mono font-semibold">1,350+ Hubs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
