import type { Metadata } from "next";
import { CampusAiClient } from "@/components/ai/campus-ai-client";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Ask Campus AI",
  description:
    "Ask questions about your campus and get answers from notes, events, listings and student posts.",
  path: "/ai",
  noindex: true,
});

export default function CampusAiPage() {
  return <CampusAiClient />;
}
