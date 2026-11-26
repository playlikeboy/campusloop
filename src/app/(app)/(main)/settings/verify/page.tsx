import { redirect } from "next/navigation";
import { getGithubVerifyConfig, GITHUB_RESULT_MESSAGES } from "@/lib/github-verify";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";
import { isVerificationMethod, isVerifiedStudent } from "@/lib/trust";
import { getViewerInstitutionId } from "@/lib/viewer";
import { VerifyClient } from "./verify-client";

export const dynamic = "force-dynamic";
export const metadata = privateMetadata("Verify your student status");

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ github?: string }> }) {
  const user = await getCachedAuthUser().catch(() => null);
  if (!user) redirect("/sign-in?returnTo=/settings/verify");
  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");

  const { github } = await searchParams;
  const result = github ? (GITHUB_RESULT_MESSAGES[github] ?? null) : null;
  const inViewerHub = profile.institutionId === (await getViewerInstitutionId().catch(() => null));

  return (
    <VerifyClient
      verified={isVerifiedStudent(profile)}
      method={isVerificationMethod(profile.verificationMethod) ? profile.verificationMethod : null}
      githubLogin={profile.githubLogin ?? null}
      collegeName={inViewerHub ? null : (profile.institution?.name ?? null)}
      inViewerHub={inViewerHub}
      githubConfigured={Boolean(getGithubVerifyConfig())}
      result={result}
    />
  );
}
