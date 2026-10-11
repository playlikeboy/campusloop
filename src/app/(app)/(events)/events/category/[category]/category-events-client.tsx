"use client";

import { EventsClient } from "../../events-client";

interface CategoryEventsClientProps {
  category: string;
  config: {
    title: string;
    headline: string;
    description?: string;
  };
}

export function CategoryEventsClient({ category, config }: CategoryEventsClientProps) {
  return <EventsClient initialCategory={category} title={config.headline} />;
}
