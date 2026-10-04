import { eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LostFoundDetailClient } from "./lost-found-detail-client";
import { getDb } from "@/db";
import { lostAndFoundItems } from "@/db/schema";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();

  const item = await db.query.lostAndFoundItems.findFirst({
    where: or(eq(lostAndFoundItems.slug, slug), eq(lostAndFoundItems.id, slug)),
    with: {
      institution: { columns: { name: true } },
    },
  });

  if (!item) {
    return {
      title: "Item Not Found | Lost & Found | CampusLoop",
    };
  }

  const prefix = item.type === "LOST" ? "Lost" : "Found";
  const title = `[${prefix}] ${item.title} — Campus Recovery | CampusLoop`;
  const description =
    item.description ||
    `${prefix} item reported at ${item.location} (${item.institution?.name || "College Campus"}).`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://campusloop.space/lost-and-found/${item.slug || slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://campusloop.space/lost-and-found/${item.slug || slug}`,
      siteName: "CampusLoop Lost & Found",
      images: item.imageUrl ? [{ url: item.imageUrl }] : undefined,
    },
    twitter: {
      card: item.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: item.imageUrl ? [item.imageUrl] : undefined,
    },
  };
}

export default async function LostAndFoundDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;

  return (
    <LostFoundDetailClient
      slug={slug}
      currentProfileId={profile?.id || null}
      userCampusId={profile?.institutionId || null}
    />
  );
}
