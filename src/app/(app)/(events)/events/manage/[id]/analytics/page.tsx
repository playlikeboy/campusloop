import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { AnalyticsClient } from "./analytics-client";

interface AnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AnalyticsPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const db = getDb();
    const event = await db.query.events.findFirst({
      where: or(eq(events.id, id), eq(events.slug, id)),
    });

    if (!event) {
      return { title: "Event Analytics | CampusLoop" };
    }

    return {
      title: `Analytics: ${event.title} | CampusLoop Organizer`,
      description: `Attendee demographics, conversion rates, and campus breakdown for ${event.title}.`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Event Analytics | CampusLoop" };
  }
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = await params;
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect(`/sign-in?returnTo=/events/manage/${id}/analytics`);
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

  return <AnalyticsClient eventId={event.id} initialSlug={event.slug || event.id} eventTitle={event.title} />;
}
