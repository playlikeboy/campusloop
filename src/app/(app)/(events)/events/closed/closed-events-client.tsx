"use client";

import { EventsClient } from "../events-client";

export function ClosedEventsClient() {
  return <EventsClient initialStatus="CLOSED" title="Past events" />;
}
