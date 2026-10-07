import type { Metadata } from "next";
import { MatchesClient } from "./matches-client";

export const metadata: Metadata = {
  title: "Campus Matches · Dating & Friends | CampusLoop",
  description: "Chat with verified classmates you matched with on CampusLoop.",
};

export default function DatingMatchesPage() {
  return <MatchesClient />;
}
