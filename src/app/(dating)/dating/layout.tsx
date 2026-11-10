import { redirect } from "next/navigation";
import { PresenceHeartbeat } from "@/components/pwa/presence-heartbeat";
import { AppShell } from "@/components/shells/app-shell";
import { MatchSubHeader } from "@/components/shells/match-sub-header";
import { AppPullToRefresh } from "@/components/ui/app-pull-to-refresh";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata = privateMetadata("Campus Match");

export default async function DatingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  if (!user) {
    redirect("/sign-in?returnTo=/matching");
  }

  const profile = await getCachedUserProfile(user.id);
  if (!profile?.onboardingCompleted) {
    redirect("/onboarding");
  }

  if (profile.role !== "ADMIN") {
    const email = user.primaryEmail;
    if (!email) {
      redirect("/invalid-email");
    }
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) {
      redirect("/invalid-email");
    }
  }

  const collegeName = profile.institution?.name;

  return (
    <AppShell profile={profile} collegeName={collegeName} isAdmin={profile.role === "ADMIN"}>
      <PresenceHeartbeat />
      <AppPullToRefresh>
        <MatchSubHeader collegeName={collegeName} />
        {/* The swipe deck sizes itself from this column, so it gets a bounded viewport height. */}
        <div className="flex min-h-[calc(100dvh-14rem)] flex-col">{children}</div>
      </AppPullToRefresh>
    </AppShell>
  );
}
