import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { ManageEventClient } from "./manage-event-client";

interface ManageEventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ManageEventPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const db = getDb();
    const event = await db.query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
    });

    if (!event) {
      return { title: "Manage Event | CampusLoop" };
    }

    return {
      title: `Manage: ${event.title} | CampusLoop Organizer`,
      description: `Organizer control center for ${event.title}. Manage attendees, broadcast updates, and check-in guests.`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Manage Event | CampusLoop" };
  }
}

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

  return <ManageEventClient eventId={event.id} initialSlug={event.slug || event.id} currentProfile={profile} />;
}
