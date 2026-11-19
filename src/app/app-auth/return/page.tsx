import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { appReturnUrl, isAppReturnStep } from "@/lib/native-app/oauth-handoff";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Back to the app");

/**
 * Fallback when Chrome does not reopen the CampusLoop Web app on its own after Google sign-in
 * (see src/lib/native-app/oauth-handoff.ts). A tap is a user gesture, so the link always works.
 */
export default async function AppAuthReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const step = typeof params.step === "string" ? params.step : "oauth-callback";
  const forward = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "step" || typeof value !== "string") continue;
    forward.set(key, value);
  }
  const href = isAppReturnStep(step) ? appReturnUrl(step, forward) : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl leading-tight text-fg">Finish signing in</h1>
      {href ? (
        <>
          <p className="mt-3 text-fg-muted">
            You signed in with Google. Go back to the CampusLoop Web app to continue.
          </p>
          <Button asChild size="lg" className="mt-6 w-full">
            <a href={href}>Open CampusLoop Web</a>
          </Button>
        </>
      ) : (
        <p className="mt-3 text-fg-muted">This sign-in link is not valid any more. Start again from the app.</p>
      )}
      <p className="mt-6 text-sm text-fg-muted">
        Not using the app?{" "}
        <Link href="/sign-in" className="font-semibold text-brand-text underline underline-offset-4">
          Sign in on the website
        </Link>
      </p>
    </main>
  );
}
