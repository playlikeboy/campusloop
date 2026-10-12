import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { hexclaveServerApp } from "@/hexclave/server";
import { EventsDashboardClient } from "./events-dashboard-client";

export const metadata: Metadata = {
  title: "Event Organizer Dashboard | CampusLoop",
  description: "Manage your hosted hackathons, college fests, workshops, and track live student attendance.",
};

export default async function EventsDashboardPage() {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/sign-in?returnTo=/events/dashboard");
  }

  const db = getDb();
  const profile = await db.query.userProfiles.findFirst({
    where: (table, { eq }) => eq(table.userId, user.id),
    with: {
      institution: true,
    },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  return <EventsDashboardClient profile={profile} />;
}
