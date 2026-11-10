import { eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import { cache } from "react";
import { getDb } from "@/db";
import { lostAndFoundItems } from "@/db/schema";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { LostFoundDetailClient } from "./lost-found-detail-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** One DB read shared by generateMetadata and the page. */
const getItem = cache(async (slug: string) => {
  try {
    const db = getDb();
    return await db.query.lostAndFoundItems.findFirst({
      where: or(eq(lostAndFoundItems.slug, slug), eq(lostAndFoundItems.id, slug)),
      with: { institution: { columns: { name: true } } },
    });
  } catch {
    return undefined;
  }
});

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItem(slug);

  if (!item) {
    return buildMetadata({
      title: "Report not found",
      description: "This lost and found report was returned or deleted.",
      path: `/lost-and-found/${slug}`,
      noindex: true,
    });
  }

  const prefix = item.type === "LOST" ? "Lost" : "Found";
  const place = [item.location, item.institution?.name].filter(Boolean).join(", ");
  const description = clip(
    item.description || `${prefix} at ${place}. Seen it or is it yours? Reply on CampusLoop.`,
    160
  );

  return buildMetadata({
    title: clip(`${prefix}: ${item.title}`, 60),
    description,
    path: `/lost-and-found/${item.slug || slug}`,
    image: item.imageUrl || undefined,
    // Returned items are no longer useful in search results.
    noindex: Boolean(item.isResolved),
  });
}

export default async function LostAndFoundDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [item, user] = await Promise.all([getItem(slug), getCachedAuthUser()]);
  const profile = user ? await getCachedUserProfile(user.id) : null;

  return (
    <>
      {item && (
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Lost and found", path: "/lost-and-found" },
            { name: item.title, path: `/lost-and-found/${item.slug || slug}` },
          ])}
        />
      )}
      <LostFoundDetailClient
        slug={slug}
        currentProfileId={profile?.id || null}
        userCampusId={profile?.institutionId || null}
      />
    </>
  );
}
