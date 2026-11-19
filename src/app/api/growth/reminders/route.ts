import { type NextRequest, NextResponse } from "next/server";
import { getGrowthPrefs, setRemindersEnabled } from "@/lib/growth/engagement-prefs";
import { requireProfile } from "@/lib/require-profile";

export const dynamic = "force-dynamic";

/** Streak and campus reminder pushes: read the switch. */
export async function GET() {
  const auth = await requireProfile();
  if (!auth.ok) return auth.response;
  const prefs = await getGrowthPrefs(auth.profile.id);
  return NextResponse.json({ remindersEnabled: prefs.remindersEnabled });
}

/** Turn reminder pushes on or off. Off is respected by every run of the engagement cron. */
export async function PATCH(req: NextRequest) {
  const auth = await requireProfile();
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => null)) as { enabled?: unknown } | null;
  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json({ error: "Send enabled: true or false." }, { status: 400 });
  }
  const saved = await setRemindersEnabled(auth.profile.id, body.enabled);
  if (!saved) {
    return NextResponse.json({ error: "Reminder settings aren't available yet. Try again later." }, { status: 503 });
  }
  return NextResponse.json({ remindersEnabled: body.enabled });
}
