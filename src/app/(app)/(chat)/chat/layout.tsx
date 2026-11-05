import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shells/app-shell";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Messages",
  description: "Chat privately with verified students across your campus loop.",
  openGraph: {
    title: "Messages",
    description: "Chat privately with verified students across your campus loop.",
    url: "https://campusloop.space/chat",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://campusloop.space/og-chat.png",
        width: 1536,
        height: 1024,
        alt: "CampusLoop Messenger",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Messages",
    description: "Chat privately with verified students across your campus loop.",
    images: ["https://campusloop.space/og-chat.png"],
  },
  robots: { index: false, follow: false },
};

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  // The messenger owns its header and scroll regions, so the shell goes full-bleed.
  return (
    <AppShell
      profile={profile}
      collegeName={profile.institution?.name ?? "Your College"}
      isAdmin={profile.role === "ADMIN"}
      fullBleed
    >
      {children}
    </AppShell>
  );
}
