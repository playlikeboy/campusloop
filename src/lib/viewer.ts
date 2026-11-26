import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { institutions } from "@/db/schema";

/**
 * Viewer-Only Mode
 * ----------------
 * Legacy. Users who signed in with a non-college email used to be onboarded
 * into a reserved "Viewer Hub" institution. New members now pick their real
 * college in onboarding (see src/lib/trust.ts); profiles still in the hub get
 * a "Pick your college" prompt and are never moved automatically.
 *
 * What a member may do is decided by `requireCapability` in
 * src/lib/trust-server.ts, not by this module. The hub is a normal
 * `institutions` row: a profile is in it iff its institutionId is the hub's id.
 */
export const VIEWER_INSTITUTION_SLUG = "viewer-hub";
export const VIEWER_INSTITUTION_AISHE = "SYSTEM-VIEWER-HUB";
export const VIEWER_INSTITUTION_NAME = "Campus Preview Hub";

const globalForViewer = globalThis as typeof globalThis & {
  campusloopViewerInstitutionId?: string;
};

/** Returns the Viewer Hub institution id, creating the row on first use. */
export async function getViewerInstitutionId(): Promise<string> {
  if (globalForViewer.campusloopViewerInstitutionId) {
    return globalForViewer.campusloopViewerInstitutionId;
  }

  const db = getDb();
  let hub = await db.query.institutions.findFirst({
    where: eq(institutions.slug, VIEWER_INSTITUTION_SLUG),
  });

  if (!hub) {
    const [created] = await db
      .insert(institutions)
      .values({
        aisheCode: VIEWER_INSTITUTION_AISHE,
        name: VIEWER_INSTITUTION_NAME,
        slug: VIEWER_INSTITUTION_SLUG,
        source: "system",
      })
      .onConflictDoNothing({ target: institutions.slug })
      .returning();
    hub =
      created ??
      (await db.query.institutions.findFirst({
        where: eq(institutions.slug, VIEWER_INSTITUTION_SLUG),
      }));
  }

  if (!hub) {
    throw new Error("Failed to resolve the viewer hub institution");
  }

  globalForViewer.campusloopViewerInstitutionId = hub.id;
  return hub.id;
}

/** True when the given profile is a read-only viewer account. */
export async function isViewerProfile(profile: {
  institutionId: string | null;
  role?: string | null;
}): Promise<boolean> {
  if (profile.role === "VIEWER") return true;
  if (!profile.institutionId) return false;
  if (profile.institutionId === VIEWER_INSTITUTION_SLUG) return true;

  try {
    const viewerId = await getViewerInstitutionId();
    return profile.institutionId === viewerId;
  } catch {
    return profile.institutionId === VIEWER_INSTITUTION_SLUG || profile.role === "VIEWER";
  }
}
