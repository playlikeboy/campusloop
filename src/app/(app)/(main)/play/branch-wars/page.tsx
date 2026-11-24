import type { Metadata } from "next";
import { BranchWarsClient } from "@/components/play/branch-wars-client";
import { requirePagePlayer } from "@/lib/play/server/page-player";
import { privateMetadata } from "@/lib/seo";

export const metadata: Metadata = privateMetadata("Branch Wars");

export default async function BranchWarsPage() {
  await requirePagePlayer();
  return <BranchWarsClient />;
}
