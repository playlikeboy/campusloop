import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { EventsClient } from "./events-client";

export const metadata = buildMetadata({
  title: "Events",
  description:
    "Find fests, hackathons, workshops and club meetups at colleges across India, and register in a tap.",
  path: "/events",
});

export default function EventsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Events", path: "/events" }])} />
      <EventsClient />
    </>
  );
}
