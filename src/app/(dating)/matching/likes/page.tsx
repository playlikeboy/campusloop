import { privateMetadata } from "@/lib/seo";
import { LikesClient } from "../../dating/likes/likes-client";

export const metadata = privateMetadata("Likes");

export default function MatchingLikesPage() {
  return <LikesClient />;
}
