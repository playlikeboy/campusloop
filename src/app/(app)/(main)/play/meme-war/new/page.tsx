import type { Metadata } from "next";
import { MemeComposer } from "@/components/play/memes/meme-composer";
import { requirePagePlayer } from "@/lib/play/server/page-player";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Post a meme");

export default async function NewMemePage() {
  await requirePagePlayer();
  return <MemeComposer />;
}
