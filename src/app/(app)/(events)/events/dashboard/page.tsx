import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";
import { EventsDashboardClient } from "./events-dashboard-client";

export const metadata = privateMetadata("Your events");

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
