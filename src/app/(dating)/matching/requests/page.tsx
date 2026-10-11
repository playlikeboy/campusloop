import type { Metadata } from "next";
import { RequestsClient } from "../../dating/requests/requests-client";

export const metadata: Metadata = {
  title: "Secret Crush · Matching | CampusLoop",
  description: "Review your private campus crush requests.",
};

export default function MatchingRequestsPage() {
  return <RequestsClient />;
}
