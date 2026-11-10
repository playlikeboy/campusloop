import { eq } from "drizzle-orm";
import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { getDb } from "@/db";
import { institutionDomains, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { findWhitelistedDomain } from "@/lib/institutions";
import { privateMetadata } from "@/lib/seo";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = privateMetadata("Set up your profile");

export default async function OnboardingPage() {
  const user = await hexclaveServerApp.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  if (profile?.onboardingCompleted) {
    redirect("/feeds");
  }

  const email = user.primaryEmail || "";
  const rawEmailUser = email.split("@")[0] || "";
  const emailDomain = email.split("@")[1]?.toLowerCase() || "";
  const whitelistedDomain = emailDomain
    ? (await findWhitelistedDomain(emailDomain)) ||
      (await db.query.institutionDomains.findFirst({
        where: eq(institutionDomains.domain, emailDomain),
      }))
    : null;
  // Mirrors the server action: an unverified college address is treated as
  // Campus Preview, so the form asks aspirant questions rather than pretending
  // the student is already verified.
  const viewerMode = !whitelistedDomain || !user.primaryEmailVerified;

  // Name from the email: e.g. "shaswat.raj" -> "Shaswat Raj", "aarav_sharma" -> "Aarav Sharma"
  function parseNameFromEmail(raw: string): string {
    const parts = raw
      .replace(/[0-9]+/g, " ")
      .split(/[._\-+ ]+/)
      .filter((p) => p.length > 0)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());

    if (parts.length > 0) {
      return parts.join(" ");
    }
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  const extractedName = parseNameFromEmail(rawEmailUser);
  const initialDisplayName = (user as { name?: string }).name || profile?.displayName || extractedName || "";
  const initialUsername =
    profile?.username ||
    rawEmailUser
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "") ||
    "student";
  const initialAvatarUrl = profile?.avatarUrl || (user as { picture?: string }).picture || "";

  return (
    <main className="min-h-svh bg-bg text-fg">
      <div className="mx-auto w-full max-w-xl px-[var(--gutter)]">
        <header className="flex items-center justify-between gap-3 border-b border-border py-4">
          <BrandLogo size="sm" href="" />
          {/* Signing in with the wrong address is the usual reason to leave, so show it and offer a way out. */}
          <div className="flex min-w-0 items-center gap-2">
            {email && (
              <span className="hidden max-w-56 truncate text-sm text-fg-muted sm:inline" title={email}>
                {email}
              </span>
            )}
            <SignOutButton className="shrink-0" />
          </div>
        </header>

        <div className="pt-8">
          <h1 className="text-3xl text-fg">
            {viewerMode ? "Set up your preview profile" : "Set up your profile"}
          </h1>
          <p className="mt-2 text-base text-fg-muted">
            {viewerMode
              ? "You signed up with a personal email, so you can look around but not post yet."
              : "Three quick steps so classmates can find you."}
          </p>
        </div>

        {viewerMode && (
          <p className="mt-5 flex gap-3 rounded-lg bg-surface-muted p-4 text-sm text-fg-muted">
            <Lock className="mt-0.5 size-4 shrink-0 text-fg" aria-hidden="true" />
            <span>
              To post, vote, chat or use Campus Match, you need a verified college email. Used the wrong
              email? Sign out above and join again with your college email.
            </span>
          </p>
        )}

        <OnboardingForm
          variant={viewerMode ? "viewer" : "student"}
          initialDisplayName={initialDisplayName}
          initialUsername={initialUsername}
          initialAvatarUrl={initialAvatarUrl}
        />
      </div>
    </main>
  );
}
