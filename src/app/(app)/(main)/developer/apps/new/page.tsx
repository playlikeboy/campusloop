import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppForm } from "@/components/oauth/app-form";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export const metadata: Metadata = privateMetadata("Register an app");

export default async function NewOauthAppPage() {
  const user = await getCachedAuthUser().catch(() => null);
  if (!user) redirect("/sign-in?returnTo=/developer/apps/new");
  return (
    <div className="mx-auto max-w-5xl px-4 py-4 pb-20">
      <Link
        href="/developer"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden /> Developer settings
      </Link>
      <h1 className="mt-2 text-3xl text-fg sm:text-4xl">Register an app</h1>
      <p className="mt-1 max-w-2xl text-fg-muted">
        Get a client ID for Login with CampusLoop. Sign-in, name, photo and the verified-student check work as
        soon as you create it.
      </p>
      <div className="mt-8">
        <AppForm />
      </div>
    </div>
  );
}
