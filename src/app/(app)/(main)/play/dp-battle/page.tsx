import type { Metadata } from "next";
import { DpBattleClient } from "@/components/play/dp/dp-battle-client";
import { requirePagePlayer } from "@/lib/play/server/page-player";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("DP Battle");

export default async function DpBattlePage() {
  await requirePagePlayer();
  return <DpBattleClient />;
}
