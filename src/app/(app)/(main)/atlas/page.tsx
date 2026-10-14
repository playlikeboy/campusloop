import type { Metadata } from "next";
import { AtlasClient } from "@/components/atlas/atlas-client";

export const metadata: Metadata = {
  title: "Campus Atlas | Campus Intelligence | CampusLoop",
  description:
    "Find campus clubs, upcoming events, schedules, and eligibility with answers grounded in campus records.",
  alternates: { canonical: "https://campusloop.space/atlas" },
  openGraph: {
    title: "Campus Atlas | Campus Intelligence | CampusLoop",
    description:
      "Find campus clubs, upcoming events, schedules, and eligibility with answers grounded in campus records.",
    url: "https://campusloop.space/atlas",
    siteName: "CampusLoop",
  },
};

export default function AtlasPage() {
  return <AtlasClient />;
}
