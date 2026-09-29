import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
    title: "Messages | CampusLoop",
    description: "Chat privately with verified students across your campus loop.",
    images: ["https://campusloop.space/og-chat.png"],
  },
  robots: { index: false, follow: false },
};

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedAuthUser();
  if (!user) redirect("/handler/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return (
    <div
      data-workspace="chat"
      className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-background text-foreground"
    >
      <main className="min-h-0 flex-1 w-full overflow-hidden">{children}</main>
    </div>
  );
}
