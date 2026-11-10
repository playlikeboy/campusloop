import { privateMetadata } from "@/lib/seo";

// Reels are retired: both /reels routes redirect to the feed, so keep them out of search.
export const metadata = privateMetadata("Reels");

export default function ReelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
