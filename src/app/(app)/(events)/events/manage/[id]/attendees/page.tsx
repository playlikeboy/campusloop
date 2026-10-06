import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { AttendeesClient } from "./attendees-client";

interface AttendeesPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AttendeesPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const db = getDb();
    const event = await db.query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
    });

    if (!event) {
      return { title: "Attendee Roster | CampusLoop" };
    }

    return {
      title: `Attendees: ${event.title} | CampusLoop Organizer`,
      description: `View confirmed registrations and export CSV for ${event.title}.`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Attendee Roster | CampusLoop" };
  }
}

export default async function AttendeesPage({ params }: AttendeesPageProps) {
  const { id } = await params;
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect(`/sign-in?returnTo=/events/manage/${id}/attendees`);
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

  return <AttendeesClient eventId={event.id} initialSlug={event.slug || event.id} eventTitle={event.title} />;
}
