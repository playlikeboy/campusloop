"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  GraduationCap,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/social-icons";
import { cn } from "@/lib/utils";

const SAMPLE_DOMAINS = [
  "@iitb.ac.in",
  "@bits-pilani.ac.in",
  "@dtu.ac.in",
  "@vitstudent.ac.in",
  "@thapar.edu",
];

interface AuthFormCardProps {
  mode: "sign-in" | "sign-up";
  handlerHref: string;
  oppositeHref: string;
  collegeHint?: string;
}

export function AuthFormCard({
  mode,
  handlerHref,
  oppositeHref,
  collegeHint,
}: AuthFormCardProps) {
  const [emailPrefix, setEmailPrefix] = useState("");
  const [selectedDomain, setSelectedDomain] = useState(SAMPLE_DOMAINS[0]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Top Mobile Brand & Switcher */}
      <div className="flex items-center justify-between pb-6 sm:pb-8 border-b border-border/30">
        <div className="lg:hidden">
          <BrandLogo size="md" href="/" />
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
          <GraduationCap className="size-3.5 text-primary" />
          <span className="font-semibold">Institutional Access Gate</span>
        </div>

        {/* Mode Switcher Segmented Control */}
        <div className="flex items-center p-0.5 rounded-full bg-muted/70 border border-border/40 text-xs font-semibold">
          <Link
            href={mode === "sign-in" ? "#" : oppositeHref}
            className={cn(
              "px-3.5 py-1.5 rounded-full transition-all duration-200",
              mode === "sign-in"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign In
          </Link>
          <Link
            href={mode === "sign-up" ? "#" : oppositeHref}
            className={cn(
              "px-3.5 py-1.5 rounded-full transition-all duration-200",
              mode === "sign-up"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Join
          </Link>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="my-auto py-8 sm:py-10 space-y-7">
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary">
            {mode === "sign-in" ? (
              <>
                <ShieldCheck className="size-3.5" />
                <span>Returning Student Login</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                <span>Verified Campus Access</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {mode === "sign-in" ? "Welcome back to your campus" : "Create your verified student account"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {mode === "sign-in"
              ? "Sign in using your official institutional email to access your college hub and batchmates."
              : "Enter your official college-provided email address. Personal webmail is strictly blocked to maintain campus integrity."}
          </p>
        </div>

        {/* Selected College pre-fill alert if passed */}
        {collegeHint && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-center gap-2">
            <Building2 className="size-4 text-primary shrink-0" />
            <span className="text-foreground font-semibold">Joining campus: {collegeHint}</span>
          </div>
        )}

        {/* Interactive College Email Gateway Preview */}
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <label htmlFor="college-email-preview" className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Official College Email</span>
              <span className="text-[11px] font-medium text-muted-foreground">Institutional Domain</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-border/60 bg-muted/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="pl-3.5 text-muted-foreground">
                <Mail className="size-4" />
              </div>
              <input
                id="college-email-preview"
                type="text"
                placeholder="rollnumber or your.name"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value.replace(/@.*$/, ""))}
                className="w-full py-3 px-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <span className="pr-3 text-xs font-semibold text-primary/80 select-none">
                {selectedDomain}
              </span>
            </div>
          </div>

          {/* Quick Domain Example Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium text-muted-foreground">Examples:</span>
            {SAMPLE_DOMAINS.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setSelectedDomain(domain)}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-mono font-medium transition-colors cursor-pointer",
                  selectedDomain === domain
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground hover:text-foreground border border-border/40"
                )}
              >
                {domain}
              </button>
            ))}
          </div>

          {/* Primary Action Button */}
          <Link
            href={handlerHref}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Continue with College Email</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Institutional Email Requirement Card */}
        <div className="p-3.5 rounded-xl border border-border/50 bg-card/60 dark:bg-card/40 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <span>Why personal email (Gmail/Yahoo) is blocked</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            CampusLoop enforces strict university email gating so you only interact with real college students.
            Anonymous confessions and secret crushes use one-way cryptographic hashing—your identity remains permanently sealed.
          </p>
        </div>

        {/* Directory & Instagram Help Section */}
        <div className="pt-2 border-t border-border/30 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary" />
              <span>College not indexed yet?</span>
            </span>
            <Link
              href="/colleges"
              className="font-bold text-primary hover:underline underline-offset-2"
            >
              Browse 1,350+ Hubs →
            </Link>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span>Need assistance or verification help?</span>
            <a
              href="https://www.instagram.com/campusloop.space/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors underline underline-offset-2"
            >
              <InstagramIcon className="size-3 text-primary" />
              <span>DM on Instagram</span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Navigation & Social Links */}
      <div className="pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <a
            href="https://www.instagram.com/campusloop.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            title="CampusLoop on Instagram"
          >
            <InstagramIcon className="size-3.5 text-primary" />
            <span className="font-semibold">Instagram</span>
          </a>
          <span>·</span>
          <a
            href="https://www.linkedin.com/company/mycampusloop/?viewAsMember=true"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            title="CampusLoop on LinkedIn"
          >
            <LinkedinIcon className="size-3.5" />
            <span>LinkedIn</span>
          </a>
          <span>·</span>
          <a
            href="https://x.com/company/mycampusloop/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            title="CampusLoop on X"
          >
            <XIcon className="size-3" />
            <span>Twitter</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <span>·</span>
          <span>© {new Date().getFullYear()} CampusLoop</span>
        </div>
      </div>
    </div>
  );
}
