import { privateMetadata } from "@/lib/seo";
import { NewEventClient } from "./new-event-client";

export const metadata = privateMetadata("Host an event");

export default function NewEventPage() {
  return <NewEventClient />;
}
