import { eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { capsuleEntries, timeCapsules, userProfiles } from "@/db/schema";
import { hexclaveServerApp } from "@/hexclave/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await hexclaveServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: capsuleId } = await params;
    const db = getDb();
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const capsule = await db.query.timeCapsules.findFirst({
      where: eq(timeCapsules.id, capsuleId),
    });

    if (!capsule) {
      return NextResponse.json({ error: "Time capsule not found" }, { status: 404 });
    }

    // Capsules are campus-scoped: never allow a student to contribute to another institution's vault.
    if (!profile.institutionId || capsule.institutionId !== profile.institutionId) {
      return NextResponse.json({ error: "Time capsule not found" }, { status: 404 });
    }

    if (capsule.isUnlocked || new Date(capsule.targetUnlockDate) <= new Date()) {
      return NextResponse.json(
        { error: "This capsule has already unlocked and is sealed from new entries" },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      title?: unknown;
      content?: unknown;
      entryType?: unknown;
      mediaUrl?: unknown;
      isAnonymous?: unknown;
      pseudonym?: unknown;
    } | null;

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const entryType = typeof body?.entryType === "string" ? body.entryType : "LETTER";
    const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : "";
    const isAnonymous = body?.isAnonymous === true;
    const pseudonym = typeof body?.pseudonym === "string" ? body.pseudonym.trim() : "";

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required to bury a memory" }, { status: 400 });
    }
    if (title.length > 120) {
      return NextResponse.json({ error: "Memory titles must be 120 characters or fewer" }, { status: 400 });
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: "Memory content must be 5,000 characters or fewer" }, { status: 400 });
    }
    if (!new Set(["LETTER", "PREDICTION", "PHOTO", "AUDIO"]).has(entryType)) {
      return NextResponse.json({ error: "Choose a valid memory type" }, { status: 400 });
    }
    if (pseudonym.length > 40) {
      return NextResponse.json({ error: "Pseudonyms must be 40 characters or fewer" }, { status: 400 });
    }
    if (mediaUrl) {
      try {
        const parsedMediaUrl = new URL(mediaUrl);
        if (parsedMediaUrl.protocol !== "https:") throw new Error("HTTPS required");
      } catch {
        return NextResponse.json({ error: "Media must use a valid HTTPS URL" }, { status: 400 });
      }
    }

    const [entry] = await db
      .insert(capsuleEntries)
      .values({
        capsuleId: capsule.id,
        authorId: profile.id,
        title,
        content,
        entryType,
        mediaUrl: mediaUrl || null,
        isAnonymous,
        pseudonym: isAnonymous ? (pseudonym || "anonymous_student") : null,
      })
      .returning();

    // Increment entries count
    await db
      .update(timeCapsules)
      .set({ entriesCount: sql`${timeCapsules.entriesCount} + 1` })
      .where(eq(timeCapsules.id, capsule.id));

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("POST /api/capsules/[id]/bury error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
