import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LostFoundClient } from "./lost-found-client";
import { getDb } from "@/db";
import { lostAndFoundItems } from "@/db/schema";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const metadata: Metadata = {
  title: "Lost & Found | Campus Recovery System | CampusLoop",
  description:
    "Report lost student IDs, keys, earphones, and reclaim found items safely on your college campus.",
  alternates: { canonical: "https://campusloop.space/lost-and-found" },
  openGraph: {
    title: "Lost & Found | Campus Recovery System | CampusLoop",
    description: "Report lost student IDs, keys, and reclaim found items safely on your college campus.",
    url: "https://campusloop.space/lost-and-found",
    siteName: "CampusLoop Lost & Found",
  },
};

export default async function LostAndFoundPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; q?: string; type?: string }>;
}) {
  const params = await searchParams;

  // Seamless redirect from old ?id=... URLs to clean slug route
  if (params.id) {
    const db = getDb();
    const item = await db.query.lostAndFoundItems.findFirst({
      where: eq(lostAndFoundItems.id, params.id),
      columns: { id: true, slug: true },
    });
    if (item?.slug) {
      redirect(`/lost-and-found/${item.slug}`);
    } else if (item?.id) {
      redirect(`/lost-and-found/${item.id}`);
    }
  }

  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  return <LostFoundClient profileId={profile.id} campusId={profile.institutionId} />;
}
