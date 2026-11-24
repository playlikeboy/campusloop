import type { Metadata } from "next";
import { PlayHub } from "@/components/play/play-hub";
import { getPlayHub, type PlayHubData } from "@/lib/play/server/hub";
import { requirePagePlayer } from "@/lib/play/server/page-player";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Play");
export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const profile = await requirePagePlayer();
  let data: PlayHubData | null = null;
  try {
    data = await getPlayHub(profile);
  } catch (e) {
    // Tables not migrated yet or a database hiccup: show the calm fallback.
    console.error("[play] hub failed:", e);
  }
  return <PlayHub data={data} />;
}
