import { privateMetadata } from "@/lib/seo";
import { RequestsClient } from "../../dating/requests/requests-client";

export const metadata = privateMetadata("Secret Crush");

export default function MatchingRequestsPage() {
  return <RequestsClient />;
}
