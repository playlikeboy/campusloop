import { redirect } from "next/navigation";
import { getCachedAuthUser, getCachedBareProfile } from "@/lib/server-cache";

/** For Play pages: the signed-in student's profile, or a redirect to sign in / onboarding. */
export async function requirePagePlayer() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");
  const profile = await getCachedBareProfile(user.id);
  if (!profile) redirect("/onboarding");
  return profile;
}
