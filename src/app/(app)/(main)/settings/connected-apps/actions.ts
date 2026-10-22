"use server";

import { revalidatePath } from "next/cache";
import { revokeGrant } from "@/lib/oauth/store";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

/** Removes an app's access: consent and refresh tokens are revoked; its access tokens fail at userinfo. */
export async function revokeConnectedApp(clientId: string) {
  const user = await getCachedAuthUser().catch(() => null);
  const profile = user ? await getCachedUserProfile(user.id) : null;
  if (!profile) throw new Error("Sign in first");
  await revokeGrant(clientId, profile.id);
  revalidatePath("/settings/connected-apps");
}
