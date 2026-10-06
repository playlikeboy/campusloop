import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthStateCleaner } from "@/components/auth/auth-state-cleaner";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { hexclaveServerApp } from "@/hexclave/server";
import { sanitizeReturnTo } from "@/lib/auth-redirect";
import { getInstitutionAllowedDomains } from "@/lib/institutions";

export const metadata: Metadata = {
  title: "Sign In | CampusLoop — Verified Student Network",
  description: "Sign in to your verified campus community using your official college email.",
};

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
  const domainParam = params?.domain;

  let collegeHint: string | undefined = undefined;
  let allowedDomains: string[] = [];

  if (collegeParam) {
    const { institution, domains } = await getInstitutionAllowedDomains(collegeParam);
    if (institution) {
      collegeHint = institution.name;
      allowedDomains = domains;
    } else {
      collegeHint = collegeParam;
    }
  }

  // Construct safe handler href
  const queryParts: string[] = [];
  if (cleanReturnTo) {
    queryParts.push(`after_auth_return_to=${encodeURIComponent(cleanReturnTo)}`);
    queryParts.push(`returnTo=${encodeURIComponent(cleanReturnTo)}`);
  } else {
    queryParts.push(`after_auth_return_to=${encodeURIComponent("/feeds")}`);
  }
  if (collegeParam) {
    queryParts.push(`college=${encodeURIComponent(collegeParam)}`);
  }
  const handlerHref = `/handler/sign-in?${queryParts.join("&")}`;

  const signUpQuery = new URLSearchParams();
  if (cleanReturnTo) signUpQuery.set("returnTo", cleanReturnTo);
  if (collegeParam) signUpQuery.set("college", collegeParam);
  if (domainParam) signUpQuery.set("domain", domainParam);
  const signUpHref = `/sign-up${signUpQuery.toString() ? `?${signUpQuery.toString()}` : ""}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center">
      <AuthStateCleaner />
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <AuthVisualPanel mode="sign-in" />
        <div className="flex items-center justify-center p-4 sm:p-8 lg:p-12 w-full">
          <AuthFormCard
            mode="sign-in"
            handlerHref={handlerHref}
            oppositeHref={signUpHref}
            collegeHint={collegeHint}
            allowedDomains={allowedDomains}
            initialDomain={domainParam}
          />
        </div>
      </div>
    </div>
  );
}
