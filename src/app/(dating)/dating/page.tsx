import type { Metadata } from "next";
import { DatingAppClient } from "./dating-app-client";

export const metadata: Metadata = {
  title: "Campus Match · Student Dating & Vibes | CampusLoop",
  description:
    "Multipurpose campus matchmaking for verified college students. Connect with batchmates, study partners, soft dating, and campus talk buddies.",
  alternates: { canonical: "https://campusloop.space/dating" },
  openGraph: {
    title: "Campus Match · Verified Student Matchmaking",
    description: "Connect with verified college students for friends, study partners, and vibe matching.",
    url: "https://campusloop.space/dating",
    siteName: "CampusLoop",
    images: [
      {
        url: "https://campusloop.space/og-dating.png",
        width: 1536,
        height: 1024,
        alt: "CampusLoop Match",
      },
    ],
  },
};

export default function DatingPage() {
  return <DatingAppClient />;
}
