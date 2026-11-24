import { NextResponse } from "next/server";
import { runSafetyCheck } from "@/lib/moderation/rules";
import { syncAchievementsSafe } from "@/lib/play/server/achievements";
import { badRequest, getBlockedIds, isAllowedImageUrl, requirePlayer, serverError } from "@/lib/play/server/context";
import { getMemeWar, postMeme } from "@/lib/play/server/memes";

export const dynamic = "force-dynamic";

const MAX_CAPTION = 140;

/** GET /api/play/memes?sort=top|new: this week's theme and your campus memes. */
export async function GET(req: Request) {
  try {
    const auth = await requirePlayer();
    if (!auth.ok) return auth.response;
    const sort = new URL(req.url).searchParams.get("sort") === "new" ? "new" : "top";
    const blocked = await getBlockedIds(auth.profile.id);
    return NextResponse.json(await getMemeWar(auth.profile, blocked, sort));
  } catch (e) {
    return serverError("GET memes", e);
  }
}

/** POST /api/play/memes { imageUrl, caption? }: one meme per student per week. */
export async function POST(req: Request) {
  try {
    const auth = await requirePlayer({ write: true });
    if (!auth.ok) return auth.response;
    const body = (await req.json().catch(() => ({}))) as { imageUrl?: unknown; caption?: unknown };
    if (!isAllowedImageUrl(body.imageUrl)) return badRequest("Upload an image for your meme.");
    const caption = typeof body.caption === "string" ? body.caption.trim().slice(0, MAX_CAPTION) : "";
    if (caption) {
      const check = runSafetyCheck({ body: caption });
      if (check.blocked || check.status !== "PUBLISHED") {
        return badRequest(check.messages[0] ?? "Change the caption and try again.");
      }
    }
    const result = await postMeme(auth.profile, body.imageUrl, caption || null);
    if (!result.ok) return badRequest(result.error, result.status);
    const newBadges = await syncAchievementsSafe(auth.profile);
    return NextResponse.json({ ok: true, id: result.id, newBadges });
  } catch (e) {
    return serverError("POST memes", e);
  }
}
