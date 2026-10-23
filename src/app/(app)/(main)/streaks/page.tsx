import type { Metadata } from "next";
import { StreakHeatmap } from "@/components/streaks/streak-heatmap";

export const metadata: Metadata = {
  title: "Campus Streaks & Activity Heatmap | CampusLoop",
  description:
    "Track your daily campus streak, interactive contribution heatmap, milestone badges, and earned Loop Points on CampusLoop.",
  openGraph: {
    title: "Campus Streaks & Activity Heatmap | CampusLoop",
    description:
      "Track your daily campus streak, interactive contribution heatmap, milestone badges, and earned Loop Points on CampusLoop.",
    url: "https://campusloop.space/streaks",
  },
  alternates: {
    canonical: "https://campusloop.space/streaks",
  },
};

export default async function StreaksPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const { profileId } = await searchParams;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "CampusLoop Streaks & Activity Heatmap",
            url: "https://campusloop.space/streaks",
            description: "Interactive daily campus rhythm tracker and contribution heatmap.",
            applicationCategory: "SocialNetworkingApplication",
          }),
        }}
      />
      <StreakHeatmap profileId={profileId} />
    </>
  );
}
