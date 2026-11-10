import type { Metadata } from "next";
import { AtlasClient } from "@/components/atlas/atlas-client";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Campus Atlas",
  description: "Ask about clubs, events, timings and who can join, with answers taken from campus records.",
  path: "/atlas",
});

export default function AtlasPage() {
  return <AtlasClient />;
}
