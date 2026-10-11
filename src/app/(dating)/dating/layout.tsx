import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { DatingFooter } from "@/components/dating/dating-footer";
import { DatingNavbar } from "@/components/dating/dating-navbar";
import { PresenceHeartbeat } from "@/components/pwa/presence-heartbeat";
import { AppPullToRefresh } from "@/components/ui/app-pull-to-refresh";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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
    <div className="dating-isolated-shell min-h-dvh flex flex-col bg-background text-foreground selection:bg-pink-500/20 selection:text-pink-600">
      <PresenceHeartbeat />
      <AppPullToRefresh>
        <div className="relative flex flex-col min-h-dvh w-full">
          {/* Isolated Dating Navbar */}
          <DatingNavbar profile={profile} collegeName={collegeName} />

          {/* Isolated Dating Main Body */}
          <main className="flex-1 w-full flex flex-col min-h-0 pt-14 pb-20 sm:pb-24">
            {children}
          </main>

          {/* Isolated Dating Bottom Navigation */}
          <DatingFooter />
        </div>
      </AppPullToRefresh>
    </div>
  );
}
