import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { EventsClient } from "./events-client";
import { InitialEvents } from "./initial-events";

export const metadata = buildMetadata({
  title: "College events: hackathons, fests, workshops",
  description:
    "Find hackathons, fests, workshops and club meetups at colleges across India. See dates, venues, team size and prizes, then register on CampusLoop.",
  path: "/events",
});

export default async function EventsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Events", path: "/events" }])} />
      <InitialEvents>
        <EventsClient />
      </InitialEvents>
    </>
  );
}
