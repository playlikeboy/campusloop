import type { Metadata } from "next";
import { TriviaClient } from "@/components/play/trivia/trivia-client";
import { requirePagePlayer } from "@/lib/play/server/page-player";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Campus Trivia");

export default async function TriviaPage() {
  await requirePagePlayer();
  return <TriviaClient />;
}
