import { eq, or } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import { events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";
import { EditEventClient } from "./edit-event-client";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = privateMetadata("Edit event");

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect(`/sign-in?returnTo=/events/manage/${id}/edit`);
  }

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  if (!profile) {
    redirect("/onboarding");
  }

  const event = await db.query.events.findFirst({
    where: or(eq(events.id, id), eq(events.slug, id)),
  });

  if (!event) {
    notFound();
  }

  if (event.organizerProfileId !== profile.id && profile.role !== "ADMIN") {
    redirect(`/events/${event.slug || event.id}`);
  }

  return <EditEventClient eventId={event.id} initialSlug={event.slug || event.id} />;
}
