import type { Metadata } from "next";
import { StreakDetailClient } from "./streak-detail-client";

export const metadata: Metadata = {
  title: "Campus Streak & Daily Rhythm | CampusLoop",
  description:
    "Track your daily authentic campus loop, 7-day rhythm, milestone progression, and earned Loop Points on CampusLoop.",
  openGraph: {
    title: "Campus Streak & Daily Rhythm | CampusLoop",
    description:
      "Track your daily authentic campus loop, 7-day rhythm, milestone progression, and earned Loop Points on CampusLoop.",
  },
};

export default async function StreakPage({ searchParams }: { searchParams: Promise<{ profileId?: string }> }) {
  const { profileId } = await searchParams;
  return <StreakDetailClient profileId={profileId} />;
}
