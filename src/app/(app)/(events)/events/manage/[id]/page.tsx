import { eq, or } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import { events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";
import { ManageEventClient } from "./manage-event-client";

interface ManageEventPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = privateMetadata("Manage event");

export default async function ManageEventPage({ params }: ManageEventPageProps) {
  const { id } = await params;
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect(`/sign-in?returnTo=/events/manage/${id}`);
  }

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
    with: {
      institution: true,
    },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  const event = await db.query.events.findFirst({
    where: or(eq(events.id, id), eq(events.slug, id)),
    with: {
      institution: true,
      organizer: true,
    },
  });

  if (!event) {
    notFound();
  }

  // Authorization check: Only organizer or ADMIN can manage
  if (event.organizerProfileId !== profile.id && profile.role !== "ADMIN") {
    redirect(`/events/${event.slug || event.id}`);
  }

  return (
    <ManageEventClient eventId={event.id} initialSlug={event.slug || event.id} currentProfile={profile} />
  );
}
