import { StreaksClient } from "@/components/streaks/streaks-client";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Streak");

export default async function StreaksPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const { profileId } = await searchParams;
  return <StreaksClient profileId={profileId} />;
}
