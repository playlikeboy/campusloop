import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { InitialEvents } from "../initial-events";
import { ClosedEventsClient } from "./closed-events-client";

export const metadata = buildMetadata({
  title: "Past events",
  description:
    "Hackathons, fests, workshops and talks that have already happened at colleges on CampusLoop. See who hosted them, when, and what the prizes were.",
  path: "/events/closed",
});

export default function ClosedEventsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Events", path: "/events" },
          { name: "Past events", path: "/events/closed" },
        ])}
      />
      <InitialEvents query="status=CLOSED">
        <ClosedEventsClient />
      </InitialEvents>
    </>
  );
}
