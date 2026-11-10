import type { BadgeVariant } from "@/components/ui/badge";

export type EventStatus = "PUBLISHED" | "DRAFT" | "COMPLETED" | "CANCELLED";

/** Plain labels for an event's lifecycle status, shared by host screens. */
export const EVENT_STATUS: Record<EventStatus, { label: string; variant: BadgeVariant }> = {
  PUBLISHED: { label: "Live", variant: "outline" },
  DRAFT: { label: "Draft", variant: "neutral" },
  COMPLETED: { label: "Finished", variant: "neutral" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};
