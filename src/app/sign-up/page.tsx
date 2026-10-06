import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthStateCleaner } from "@/components/auth/auth-state-cleaner";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
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

  const college = params?.college;
  const domainParam = (await searchParams)?.domain;

  let collegeHint: string | undefined = undefined;
  let allowedDomains: string[] = [];

  if (college) {
    const { institution, domains } = await getInstitutionAllowedDomains(college);
    if (institution) {
      collegeHint = institution.name;
      allowedDomains = domains;
    } else {
      collegeHint = college;
    }
  }

  const queryParts: string[] = [];
  if (cleanReturnTo) {
    queryParts.push(`after_auth_return_to=${encodeURIComponent(cleanReturnTo)}`);
    queryParts.push(`returnTo=${encodeURIComponent(cleanReturnTo)}`);
  } else {
    queryParts.push(`after_auth_return_to=${encodeURIComponent("/onboarding")}`);
  }
  if (college) {
    queryParts.push(`college=${encodeURIComponent(college)}`);
  }

  const handlerHref = `/handler/sign-up?${queryParts.join("&")}`;
  const signInQuery = new URLSearchParams();
  if (cleanReturnTo) signInQuery.set("returnTo", cleanReturnTo);
  if (college) signInQuery.set("college", college);
  if (domainParam) signInQuery.set("domain", domainParam);
  const signInHref = `/sign-in${signInQuery.toString() ? `?${signInQuery.toString()}` : ""}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center">
      <AuthStateCleaner />
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <AuthVisualPanel mode="sign-up" />
        <div className="flex items-center justify-center p-4 sm:p-8 lg:p-12 w-full">
          <AuthFormCard
            mode="sign-up"
            handlerHref={handlerHref}
            oppositeHref={signInHref}
            collegeHint={collegeHint}
            allowedDomains={allowedDomains}
            initialDomain={domainParam}
          />
        </div>
      </div>
    </div>
  );
}
