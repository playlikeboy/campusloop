import type { Metadata } from "next";
import { AchievementsClient } from "@/components/play/achievements-client";
import { requirePagePlayer } from "@/lib/play/server/page-player";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Badges");

export default async function AchievementsPage() {
  await requirePagePlayer();
  return <AchievementsClient />;
}
