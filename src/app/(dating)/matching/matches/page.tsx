import type { Metadata } from "next";
import { MatchesClient } from "../../dating/matches/matches-client";

export const metadata: Metadata = {
  title: "Your Matches · CampusLoop",
  description: "Chat with verified students you matched with.",
};

export default function MatchingMatchesPage() {
  return <MatchesClient />;
}
