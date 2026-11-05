import { ShieldX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConsentCard } from "@/components/oauth/consent-card";
import { checkAuthorizeRequest, errorRedirect, successRedirect } from "@/lib/oauth/authorize";
import { grantCovers } from "@/lib/oauth/policy";
import { createCode, getActiveGrant, upsertGrant } from "@/lib/oauth/store";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isCollegeVerifiedUser } from "@/lib/user-verification";
import { decideAuthorization } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in with CampusLoop",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function Problem({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl bg-card/80 p-6 text-center shadow-sm">
        <ShieldX className="mx-auto size-10 text-destructive" aria-hidden />
        <h1 className="mt-3 text-xl font-black text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <Link href="/feeds" className="mt-5 inline-flex h-11 items-center rounded-2xl bg-muted/70 px-5 text-sm font-semibold hover:bg-muted">Go to CampusLoop</Link>
      </div>
    </main>
  );
}

/** OAuth 2.0 / OIDC authorization endpoint with the consent screen. */
type AuthorizeResult =
  | { kind: "problem"; title: string; message: string }
  | { kind: "consent"; props: React.ComponentProps<typeof ConsentCard> };

async function resolveAuthorize(searchParams: Props["searchParams"]): Promise<AuthorizeResult> {
  try {
    const raw = await searchParams;
    const params = new URLSearchParams(Object.entries(raw).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
    const query = params.toString();
    const self = `/oauth/authorize?${query}`;

    const check = await checkAuthorizeRequest(params);
    if (check.kind === "fatal") return { kind: "problem", title: "Can't sign you in", message: check.message };
    if (check.kind === "error") redirect(check.redirectTo);

    const user = await getCachedAuthUser().catch(() => null);
    if (!user) {
      if (check.prompt === "none") redirect(errorRedirect(check.redirectUri, "login_required", "The user is not signed in to CampusLoop", check.state));
      redirect(`/sign-in?returnTo=${encodeURIComponent(self)}`);
    }
    const profile = await getCachedUserProfile(user.id).catch(() => null);
    if (!profile || !profile.onboardingCompleted) {
      return { kind: "problem", title: "Finish setting up CampusLoop", message: "Complete your CampusLoop profile first, then come back to this app and sign in again." };
    }

    // Skip the screen when the app is first-party or the student already agreed to these scopes.
    const grant = await getActiveGrant(check.client.id, profile.id);
    const preApproved = Boolean(
      (check.client.isFirstParty && check.prompt !== "consent") ||
      (grant && grantCovers(grant.scopes, check.scopes))
    );
    if (preApproved && check.prompt !== "consent") {
      await upsertGrant(check.client.id, profile.id, check.scopes);
      const code = await createCode({ client: check.client, profileId: profile.id, redirectUri: check.redirectUri, scopes: check.scopes, codeChallenge: check.codeChallenge, nonce: check.nonce });
      redirect(successRedirect(check.redirectUri, code, check.state));
    }
    if (check.prompt === "none") redirect(errorRedirect(check.redirectUri, "consent_required", "The user has not approved this app yet", check.state));

    let redirectHost = check.redirectUri;
    try {
      redirectHost = new URL(check.redirectUri).host || check.redirectUri;
    } catch {}

    return {
      kind: "consent",
      props: {
        client: check.client,
        scopes: check.scopes,
        redirectHost: redirectHost,
        request: query,
        account: {
          displayName: profile.displayName || profile.username || "Student",
          username: profile.username || "student",
          avatarUrl: profile.avatarUrl || null,
          verified: isCollegeVerifiedUser(profile),
        },
        switchHref: `/logout?returnTo=${encodeURIComponent(self)}`,
        action: decideAuthorization,
      },
    };
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[OAuth Authorize Error]:", error);
    return { kind: "problem", title: "Can't complete sign in", message: "We encountered an unexpected issue while preparing your authentication session. Please try again or return to CampusLoop." };
  }
}

export default async function AuthorizePage({ searchParams }: Props) {
  const result = await resolveAuthorize(searchParams);
  if (result.kind === "problem") return <Problem title={result.title} message={result.message} />;
  return <ConsentCard {...result.props} />;
}
