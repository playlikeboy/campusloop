import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { hexclaveServerApp } from "@/hexclave/server";
import { MyTicketsClient } from "./my-tickets-client";

export const metadata: Metadata = {
  title: "My Event Tickets & Passes | CampusLoop",
  description: "View and manage your registered passes for college hackathons, fests, and workshops on CampusLoop.",
};

export default async function MyTicketsPage() {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    redirect("/sign-in?returnTo=/events/my-tickets");
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

  return <MyTicketsClient profile={profile} />;
}
