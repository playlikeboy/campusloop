import type { Metadata } from "next";
import { RequestsClient } from "./requests-client";

export const metadata: Metadata = {
  title: "Secret Crush Vault · Campus Match | CampusLoop",
  description: "Anonymous zero-knowledge crush vault for verified college students.",
};

export default function DatingRequestsPage() {
  return <RequestsClient />;
}
