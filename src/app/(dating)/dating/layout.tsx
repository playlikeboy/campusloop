import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PresenceHeartbeat } from "@/components/pwa/presence-heartbeat";
import { AppShell } from "@/components/shells/app-shell";
import { MatchSubHeader } from "@/components/shells/match-sub-header";
import { AppPullToRefresh } from "@/components/ui/app-pull-to-refresh";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "CampusLoop Matching · Campus Vibes",
  description:
    "Discover verified students from your campus for friendships, study partners, and shared interests.",
  openGraph: {
    title: "CampusLoop Matching · Friends & Shared Interests",
    description:
      "Connect with verified fellow students within your campus radius. Zero creeps, 100% college-verified.",
    url: "https://campusloop.space/matching",
    siteName: "CampusLoop Match",
    images: [
      {
        url: "https://campusloop.space/og-dating.png",
        width: 1536,
        height: 1024,
        alt: "CampusLoop Match",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop Matching | Verified Students",
    description: "Meet verified fellow students on your campus.",
    images: ["https://campusloop.space/og-dating.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

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
