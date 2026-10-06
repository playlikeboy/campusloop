import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { EditEventClient } from "./edit-event-client";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditEventPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const db = getDb();
    const event = await db.query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
    });

    if (!event) {
      return { title: "Edit Event | CampusLoop" };
    }

    return {
      title: `Edit: ${event.title} | CampusLoop Organizer`,
      description: `Edit schedule, venue, prizes, and registration rules for ${event.title}.`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Edit Event | CampusLoop" };
  }
}

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
