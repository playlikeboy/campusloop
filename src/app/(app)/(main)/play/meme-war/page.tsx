import type { Metadata } from "next";
import { MemeWarClient } from "@/components/play/memes/meme-war-client";
import { requirePagePlayer } from "@/lib/play/server/page-player";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Meme War");

export default async function MemeWarPage() {
  await requirePagePlayer();
  return <MemeWarClient />;
}
