import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campus Reels · Student Videos & Vibes",
  description:
    "Watch verified student campus reels, hackathon moments, hostel chronicles, and university vibes across Indian colleges.",
  openGraph: {
    title: "Campus Reels · Student Videos & Vibes",
    description:
      "Watch verified student campus reels, hackathon moments, hostel chronicles, and university vibes across Indian colleges.",
    url: "https://campusloop.space/reels",
    siteName: "CampusLoop Reels",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Reels · Student Videos & Vibes",
    description:
      "Watch verified student campus reels, hackathon moments, hostel chronicles, and university vibes across Indian colleges.",
  },
};

export default function ReelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-black text-white">
      {children}
    </div>
  );
}
