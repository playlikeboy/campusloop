import type { Metadata } from "next";
import { LikesClient } from "../../dating/likes/likes-client";

export const metadata: Metadata = {
  title: "Likes You · Matching | CampusLoop",
  description: "See verified students who liked your profile.",
};

export default function MatchingLikesPage() {
  return <LikesClient />;
}
