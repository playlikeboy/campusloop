import { privateMetadata } from "@/lib/seo";
import { MatchesClient } from "../../dating/matches/matches-client";

export const metadata = privateMetadata("Matches");

export default function MatchingMatchesPage() {
  return <MatchesClient />;
}
