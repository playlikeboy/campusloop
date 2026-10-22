"use server";

import { redirect } from "next/navigation";
import { checkAuthorizeRequest, errorRedirect, successRedirect } from "@/lib/oauth/authorize";
import { createCode, upsertGrant } from "@/lib/oauth/store";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

/**
 * Consent decision. The original request is re-validated from its query
 * string (hidden fields are never trusted). Next.js checks the Origin header
 * on server actions, which blocks cross-site form posts.
 */
export async function decideAuthorization(formData: FormData) {
  const query = String(formData.get("request") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const check = await checkAuthorizeRequest(new URLSearchParams(query));
  if (check.kind === "fatal") redirect(`/oauth/authorize?${query}`);
  if (check.kind === "error") redirect(check.redirectTo);

  if (decision !== "allow") redirect(errorRedirect(check.redirectUri, "access_denied", "The user declined to share their CampusLoop account", check.state));

  const user = await getCachedAuthUser();
  const profile = user ? await getCachedUserProfile(user.id) : null;
  if (!profile) redirect(`/sign-in?returnTo=${encodeURIComponent(`/oauth/authorize?${query}`)}`);

  await upsertGrant(check.client.id, profile.id, check.scopes);
  const code = await createCode({
    client: check.client,
    profileId: profile.id,
    redirectUri: check.redirectUri,
    scopes: check.scopes,
    codeChallenge: check.codeChallenge,
    nonce: check.nonce,
  });
  redirect(successRedirect(check.redirectUri, code, check.state));
}
