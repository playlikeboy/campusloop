"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { oauthClients } from "@/db/schema";
import { nextReviewStatus, validateAppInput } from "@/lib/oauth/app-input";
import { newClientId, newClientSecret } from "@/lib/oauth/store";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

/** Developer portal actions for Login with CampusLoop apps. Owners only (admins manage apps in /admin/oauth-apps). */

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const BASE_SCOPES = ["openid", "profile", "student", "offline_access"];
const MAX_APPS = 10;

async function owner() {
  const user = await getCachedAuthUser().catch(() => null);
  const profile = user ? await getCachedUserProfile(user.id) : null;
  if (!profile) throw new Error("Sign in to manage apps");
  return profile;
}

async function ownedApp(id: string, profileId: string) {
  const app = await getDb().query.oauthClients.findFirst({ where: and(eq(oauthClients.id, id), eq(oauthClients.ownerProfileId, profileId)) });
  if (!app) throw new Error("App not found");
  return app;
}

export async function createOauthApp(raw: unknown): Promise<Result<{ clientId: string; secret: string | null }>> {
  try {
    const profile = await owner();
    const v = validateAppInput(raw);
    if (!v.ok) return v;
    const db = getDb();
    const [{ n }] = await db.select({ n: count() }).from(oauthClients).where(eq(oauthClients.ownerProfileId, profile.id));
    if (Number(n) >= MAX_APPS) return { ok: false, error: `You can register up to ${MAX_APPS} apps.` };
    const id = newClientId();
    const secret = v.value.type === "CONFIDENTIAL" ? await newClientSecret() : null;
    await db.insert(oauthClients).values({
      id,
      ownerProfileId: profile.id,
      name: v.value.name,
      description: v.value.description || null,
      homepageUrl: v.value.homepageUrl || null,
      logoUrl: v.value.logoUrl || null,
      privacyUrl: v.value.privacyUrl || null,
      termsUrl: v.value.termsUrl || null,
      redirectUris: v.value.redirectUris,
      type: v.value.type,
      clientSecretHash: secret?.hash ?? null,
      secretLast4: secret?.last4 ?? null,
      requestedScopes: [...BASE_SCOPES, ...v.value.sensitiveScopes],
      reviewStatus: nextReviewStatus(v.value.sensitiveScopes, [], "NONE"),
    });
    revalidatePath("/developer");
    return { ok: true, clientId: id, secret: secret?.secret ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not create the app" };
  }
}

export async function updateOauthApp(id: string, raw: unknown): Promise<Result> {
  try {
    const profile = await owner();
    const app = await ownedApp(id, profile.id);
    const v = validateAppInput(raw);
    if (!v.ok) return v;
    // Switching type is not allowed: it would change how the app authenticates.
    await getDb()
      .update(oauthClients)
      .set({
        name: v.value.name,
        description: v.value.description || null,
        homepageUrl: v.value.homepageUrl || null,
        logoUrl: v.value.logoUrl || null,
        privacyUrl: v.value.privacyUrl || null,
        termsUrl: v.value.termsUrl || null,
        redirectUris: v.value.redirectUris,
        requestedScopes: [...BASE_SCOPES, ...v.value.sensitiveScopes],
        reviewStatus: nextReviewStatus(v.value.sensitiveScopes, app.approvedScopes, app.reviewStatus),
        updatedAt: new Date(),
      })
      .where(eq(oauthClients.id, app.id));
    revalidatePath(`/developer/apps/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save" };
  }
}

/** New secret, shown once. The old one stops working immediately. */
export async function rotateOauthSecret(id: string): Promise<Result<{ secret: string }>> {
  try {
    const profile = await owner();
    const app = await ownedApp(id, profile.id);
    if (app.type !== "CONFIDENTIAL") return { ok: false, error: "Browser and mobile apps don't use a secret." };
    const s = await newClientSecret();
    await getDb().update(oauthClients).set({ clientSecretHash: s.hash, secretLast4: s.last4, updatedAt: new Date() }).where(eq(oauthClients.id, app.id));
    return { ok: true, secret: s.secret };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not rotate the secret" };
  }
}

/** Deletes the app, its grants and tokens (cascade). Students are signed out of it. */
export async function deleteOauthApp(id: string): Promise<Result> {
  try {
    const profile = await owner();
    const app = await ownedApp(id, profile.id);
    if (app.isFirstParty) return { ok: false, error: "Ecosystem apps can only be removed by CampusLoop admins." };
    await getDb().delete(oauthClients).where(eq(oauthClients.id, app.id));
    revalidatePath("/developer");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete" };
  }
}
