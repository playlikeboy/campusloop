import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { AuthStateCleaner } from "@/components/auth/auth-state-cleaner";
import { hexclaveServerApp } from "@/hexclave/server";
import { sanitizeReturnTo } from "@/lib/auth-redirect";
import { getInstitutionAllowedDomains } from "@/lib/institutions";

export const metadata: Metadata = {
  title: "Join CampusLoop | Verified Student Network",
  description: "Join your verified college campus community on CampusLoop using your official college email.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{
    returnTo?: string;
    redirect?: string;
    after_auth_return_to?: string;
    college?: string;
    domain?: string;
  }>;
}) {
  const params = await searchParams;
  const rawTarget = params?.returnTo || params?.redirect || params?.after_auth_return_to;
  const cleanReturnTo = sanitizeReturnTo(rawTarget);

  // If user is already authenticated, send them straight to destination or feeds
  const user = await hexclaveServerApp.getUser();
  if (user) {
    redirect(cleanReturnTo || "/feeds");
  }

  const collegeParam = params?.college;
  let collegeHint: string | undefined = undefined;

  if (collegeParam) {
    const { institution } = await getInstitutionAllowedDomains(collegeParam);
    collegeHint = institution ? institution.name : collegeParam;
  }

  return (
    <>
      <AuthStateCleaner />
      <AuthSplitLayout
        mode="sign-up"
        returnTo={cleanReturnTo || undefined}
        collegeHint={collegeHint}
      />
    </>
  );
}
