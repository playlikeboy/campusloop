import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusScreen } from "@/components/shells/status-screen";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Use your college email");

export default async function InvalidEmailPage() {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/");
  }
  return (
    <main className="flex min-h-svh flex-col bg-bg text-fg">
      <StatusScreen
        sticker="@"
        title="Use your college email"
        description="You signed up with a personal email. Sign out, then sign up again with your college email to post, vote and chat."
        action={
          <SignOutButton buttonVariant="primary">
            <span>Sign out and use college email</span>
          </SignOutButton>
        }
        secondary={
          <Link
            href="/onboarding"
            className="rounded-sm font-semibold text-brand-text underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Just look around (read-only)
          </Link>
        }
      />
    </main>
  );
}
