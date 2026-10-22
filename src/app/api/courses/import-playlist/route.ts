import { NextResponse } from "next/server";
import { importPlaylist } from "@/lib/courses/playlist-importer";
import { requireProfile } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/courses/import-playlist
 * Accepts { url: string }
 * Fetches playlist metadata and lectures from YouTube, Dailymotion, Archive.org, or Google Drive,
 * and formats them into a ready-to-edit CourseInput structure.
 */
export async function POST(req: Request) {
  const auth = await requireProfile();
  if (auth.error) return auth.error;

  try {
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "Please provide a playlist or folder URL." }, { status: 400 });
    }

    const imported = await importPlaylist(url);
    return NextResponse.json({
      success: true,
      course: imported,
    });
  } catch (err) {
    console.error("[POST /api/courses/import-playlist error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to import playlist" },
      { status: 400 }
    );
  }
}
