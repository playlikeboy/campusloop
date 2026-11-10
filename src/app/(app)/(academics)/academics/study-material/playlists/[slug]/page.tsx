import type { Metadata } from "next";
import { getDb } from "@/db";
import { buildMetadata } from "@/lib/seo";
import { PlaylistDetailClient } from "./playlist-detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();

  const playlist = await db.query.academicPlaylists.findFirst({
    where: (pl, { or, eq }) => or(eq(pl.slug, slug), eq(pl.id, slug)),
    with: {
      creator: true,
      institution: true,
    },
  });

  if (!playlist) return { title: "Study playlist", robots: { index: false, follow: false } };

  const branch = playlist.branch && playlist.branch !== "All" ? playlist.branch : "all branches";
  const college = playlist.institution?.name ? ` at ${playlist.institution.name}` : "";
  return buildMetadata({
    title: playlist.title,
    description:
      playlist.description?.slice(0, 160) ||
      `${playlist.itemsCount} notes and PYQs for ${branch}${college}, grouped into one study playlist.`,
    path: `/academics/study-material/playlists/${playlist.slug}`,
    // Only public playlists belong in search results.
    noindex: playlist.visibility !== "PUBLIC",
  });
}

export default async function PlaylistDetailPage({ params }: Props) {
  const { slug } = await params;
  return <PlaylistDetailClient slugOrId={slug} />;
}
