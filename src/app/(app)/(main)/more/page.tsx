import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo";
import { MoreClient } from "./more-client";

// An in-app menu, not a page for search results. /ecosystem redirects here.
export const metadata: Metadata = privateMetadata("More");

export default function MorePage() {
  return <MoreClient />;
}
