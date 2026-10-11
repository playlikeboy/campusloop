import type { Metadata } from "next";
import { DatingAppClient } from "../dating/dating-app-client";

export const metadata: Metadata = {
  title: "Matching · CampusLoop",
  description: "Meet verified students who share your campus, interests, and vibe.",
  alternates: { canonical: "https://campusloop.space/matching" },
  openGraph: {
    title: "CampusLoop Matching",
    description: "Meet verified students who share your campus, interests, and vibe.",
    url: "https://campusloop.space/matching",
    siteName: "CampusLoop",
  },
};

export default function MatchingPage() {
  return <DatingAppClient />;
}
