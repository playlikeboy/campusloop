import type { Metadata } from "next";
import Link from "next/link";
import { StatusScreen } from "@/components/shells/status-screen";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
import { isMissingEmailTable } from "@/lib/email-campaigns/queue";
import { getProfileForUnsubscribe, maskEmail } from "@/lib/email-campaigns/unsubscribe";
import { verifyUnsubscribeToken } from "@/lib/email-campaigns/unsubscribe-token";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Email settings");

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ t?: string; done?: string }>;
}

const homeLink = (
  <Link
    href="/"
    className="rounded-sm font-semibold text-brand-text underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    Go to CampusLoop
  </Link>
);

/** Login-free unsubscribe from CampusLoop marketing emails. The page only changes anything on a POST. */
export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { t, done } = await searchParams;
  const profileId = verifyUnsubscribeToken(t);

  let profile: Awaited<ReturnType<typeof getProfileForUnsubscribe>> = null;
  if (profileId) {
    try {
      profile = await getProfileForUnsubscribe(getDb(), profileId);
    } catch (error) {
      if (!isMissingEmailTable(error)) console.error("[unsubscribe] lookup failed:", error);
    }
  }

  if (!profileId || !profile || !t) {
    return (
      <main className="flex min-h-svh flex-col bg-bg text-fg">
        <StatusScreen
          sticker="?"
          title="This link does not work"
          description="The unsubscribe link is broken or incomplete. Open it again from the email, or change email settings from your account."
          action={
            <Button asChild>
              <Link href="/settings">Open settings</Link>
            </Button>
          }
          secondary={homeLink}
        />
      </main>
    );
  }

  const action = `/api/email/unsubscribe?t=${encodeURIComponent(t)}`;
  const email = maskEmail(profile.email);

  if (profile.unsubscribed) {
    return (
      <main className="flex min-h-svh flex-col bg-bg text-fg">
        <StatusScreen
          sticker="Done"
          title={done === "unsubscribed" ? "You are unsubscribed" : "You are not getting these emails"}
          description={`We will not send news or reminder emails to ${email}. Account and security emails will still reach you.`}
          action={
            <form method="post" action={action}>
              <input type="hidden" name="action" value="resubscribe" />
              <Button type="submit" variant="outline">
                Send me these emails again
              </Button>
            </form>
          }
          secondary={homeLink}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col bg-bg text-fg">
      <StatusScreen
        sticker="Bye?"
        title={done === "resubscribed" ? "You are back on the list" : "Unsubscribe from CampusLoop emails"}
        description={
          done === "resubscribed"
            ? `We will send news and reminders to ${email} again. You can unsubscribe any time.`
            : `Stop news, feature and reminder emails to ${email}. Account and security emails will still reach you.`
        }
        action={
          done === "resubscribed" ? (
            <Button asChild>
              <Link href="/feeds">Open CampusLoop</Link>
            </Button>
          ) : (
            <form method="post" action={action}>
              <input type="hidden" name="action" value="unsubscribe" />
              <Button type="submit">Unsubscribe</Button>
            </form>
          )
        }
        secondary={homeLink}
      />
    </main>
  );
}
