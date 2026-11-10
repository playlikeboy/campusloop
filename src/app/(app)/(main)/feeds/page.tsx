import { privateMetadata } from "@/lib/seo";
import { FeedClient } from "./feed-client";

export const metadata = privateMetadata("Home");

export default function FeedsPage() {
  return <FeedClient />;
}
