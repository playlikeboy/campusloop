import type { Metadata } from "next";
import { DatingAppClient } from "../dating-app-client";

export const metadata: Metadata = {
  title: "Discover · Campus Match | CampusLoop",
  description: "Discover verified students across your college and nationwide.",
};

export default function DatingDiscoverPage() {
  return <DatingAppClient />;
}
