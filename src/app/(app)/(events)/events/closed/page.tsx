import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { ClosedEventsClient } from "./closed-events-client";

export const metadata = buildMetadata({
  title: "Past events",
  description: "Hackathons, fests and workshops that have already happened at colleges on CampusLoop.",
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
      <ClosedEventsClient />
    </>
  );
}
