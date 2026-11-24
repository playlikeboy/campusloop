import type { Metadata } from "next";
import { ThisOrThatClient } from "@/components/play/this-or-that-client";
import { requirePagePlayer } from "@/lib/play/server/page-player";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("This or That");

export default async function ThisOrThatPage() {
  await requirePagePlayer();
  return <ThisOrThatClient />;
}
