import { and, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { eventRegistrations, events, notifications } from "@/db/schema";
import { createNotificationsForMany } from "@/lib/notifications";

/**
 * "Your event starts soon" for everyone registered (not cancelled) for one
 * event. Safe to call repeatedly — from a cron sweep, say — because students
 * who already have an EVENT_REMINDER row for this event are skipped.
 *
 * Returns the number of students notified. Never throws.
 */
export async function notifyEventStartingSoon(eventId: string): Promise<number> {
  try {
    const db = getDb();
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      columns: { id: true, title: true, startDate: true, venue: true, organizerProfileId: true },
    });
    if (!event?.organizerProfileId) return 0;

    const registered = await db
      .select({ profileId: eventRegistrations.profileId })
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, event.id), ne(eventRegistrations.status, "CANCELLED")));
    if (registered.length === 0) return 0;

    const ids = registered.map((r) => r.profileId);
    const already = await db
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(
        and(
          eq(notifications.type, "EVENT_REMINDER"),
          eq(notifications.referenceId, event.id),
          inArray(notifications.userId, ids)
        )
      );
    const done = new Set(already.map((r) => r.userId));
    const recipients = ids.filter((id) => !done.has(id));
    if (recipients.length === 0) return 0;

    const time = event.startDate.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
    return await createNotificationsForMany({
      recipientIds: recipients,
      actorId: event.organizerProfileId,
      type: "EVENT_REMINDER",
      referenceId: event.id,
      previewText: `${event.title} starts at ${time}${event.venue ? ` at ${event.venue}` : ""}`,
      maxRecipients: 2000,
    });
  } catch (error) {
    console.error("notifyEventStartingSoon failed:", error);
    return 0;
  }
}
