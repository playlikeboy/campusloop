import { redirect } from "next/navigation";
import { RandomLoopClient } from "@/components/random/random-loop-client";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isViewerProfile } from "@/lib/viewer";

export const metadata = privateMetadata("Random chat");

export default async function RandomLoopPage() {
  const user = await getCachedAuthUser();
  if (!user) redirect("/sign-in");

  const profile = await getCachedUserProfile(user.id);
  if (!profile?.onboardingCompleted) redirect("/onboarding");

  const viewerMode = await isViewerProfile(profile);
  if (viewerMode) {
    redirect("/more");
  }

  return (
    <RandomLoopClient
      currentProfile={{
        id: profile.id,
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        institutionId: profile.institutionId,
        year: profile.year ? `${profile.year}` : null,
        branch: profile.branch,
      }}
    />
  );
}
