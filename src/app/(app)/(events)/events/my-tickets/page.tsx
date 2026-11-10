import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { hexclaveServerApp } from "@/hexclave/server";
import { privateMetadata } from "@/lib/seo";
import { MyTicketsClient } from "./my-tickets-client";

export const metadata = privateMetadata("My tickets");

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
