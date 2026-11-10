import { eq, or } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import { events, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";
import { CheckInClient } from "./check-in-client";

interface CheckInPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = privateMetadata("Check-in");

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { id } = await params;
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect(`/sign-in?returnTo=/events/manage/${id}/check-in`);
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

  return <CheckInClient eventId={event.id} initialSlug={event.slug || event.id} eventTitle={event.title} />;
}
