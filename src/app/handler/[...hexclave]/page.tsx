import { HexclaveHandler } from "@hexclave/next";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthStateCleaner } from "@/components/auth/auth-state-cleaner";
import { sanitizeReturnTo } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Authentication | CampusLoop",
  robots: { index: false, follow: false },
};

export default async function Handler({
  params,
  searchParams,
}: {
  params?: Promise<{ hexclave?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawAfterAuth =
    typeof resolvedSearchParams?.after_auth_return_to === "string"
      ? resolvedSearchParams.after_auth_return_to
      : undefined;
  const rawReturnTo =
    typeof resolvedSearchParams?.returnTo === "string"
      ? resolvedSearchParams.returnTo
      : undefined;

  const hexclaveParts = resolvedParams?.hexclave || [];

  // Intercept sign-out / logout paths to prevent Hexclave server-component sign-out crashes
  if (
    hexclaveParts.some((part) =>
      ["sign-out", "signout", "logout", "log-out"].includes(part.toLowerCase())
    )
  ) {
    const rawReturnTo =
      typeof resolvedSearchParams?.returnTo === "string"
        ? resolvedSearchParams.returnTo
        : typeof resolvedSearchParams?.after_auth_return_to === "string"
          ? resolvedSearchParams.after_auth_return_to
          : undefined;
    const cleanReturnTo = sanitizeReturnTo(rawReturnTo);
    const qs = cleanReturnTo ? `?returnTo=${encodeURIComponent(cleanReturnTo)}` : "";
    redirect(`/logout${qs}`);
  }

  // Intercept self-referential auth loop parameters
  const afterAuthIsDirty = rawAfterAuth && !sanitizeReturnTo(rawAfterAuth);
  const returnToIsDirty = rawReturnTo && !sanitizeReturnTo(rawReturnTo);

  if (afterAuthIsDirty || returnToIsDirty) {
    const targetPath = `/handler/${hexclaveParts.join("/")}`;
    const sp = new URLSearchParams();

    if (resolvedSearchParams) {
      for (const [key, value] of Object.entries(resolvedSearchParams)) {
        if (key === "after_auth_return_to" || key === "returnTo") continue;
        if (typeof value === "string") sp.set(key, value);
      }
    }

    const cleanDest =
      (rawReturnTo ? sanitizeReturnTo(rawReturnTo) : null) ||
      (rawAfterAuth ? sanitizeReturnTo(rawAfterAuth) : null);

    if (cleanDest) {
      sp.set("after_auth_return_to", cleanDest);
      sp.set("returnTo", cleanDest);
    }

    const qs = sp.toString() ? `?${sp.toString()}` : "";
    redirect(`${targetPath}${qs}`);
  }

  return (
    <>
      <AuthStateCleaner />
      <HexclaveHandler fullPage />
    </>
  );
}
