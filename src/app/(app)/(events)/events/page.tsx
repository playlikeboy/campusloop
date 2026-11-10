import type { Metadata } from "next";
import { EventsClient } from "./events-client";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: "Events",
  description: "Find campus events, hackathons, workshops and college fests.",
  alternates: { canonical: "https://campusloop.space/events" },
  openGraph: {
    title: "Events",
    description: "Find campus events, hackathons, workshops and college fests.",
    url: "https://campusloop.space/events",
    siteName: "CampusLoop",
  },
};

export default function EventsPage() {
  return <EventsClient />;
}
