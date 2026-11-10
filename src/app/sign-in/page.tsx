import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { AuthStateCleaner } from "@/components/auth/auth-state-cleaner";
import { hexclaveServerApp } from "@/hexclave/server";
import { sanitizeReturnTo } from "@/lib/auth-redirect";
import { getInstitutionAllowedDomains } from "@/lib/institutions";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to CampusLoop with the college email you joined with.",
  path: "/sign-in",
  noindex: true,
});

export default async function SignInPage({
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
  let collegeHint: string | undefined;

  if (collegeParam) {
    const { institution } = await getInstitutionAllowedDomains(collegeParam);
    collegeHint = institution ? institution.name : collegeParam;
  }

  return (
    <>
      <AuthStateCleaner />
      <AuthSplitLayout mode="sign-in" returnTo={cleanReturnTo || undefined} collegeHint={collegeHint} />
    </>
  );
}
