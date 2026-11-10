import { and, eq } from "drizzle-orm";
import { ArrowLeft, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppCredentials } from "@/components/oauth/app-credentials";
import { AppForm } from "@/components/oauth/app-form";
import { Quickstart } from "@/components/oauth/quickstart";
import { getDb } from "@/db";
import { oauthClients } from "@/db/schema";
import { privateMetadata } from "@/lib/seo";
import { getCachedAuthUser, getCachedUserProfile } from "@/lib/server-cache";

export const dynamic = "force-dynamic";
export const metadata: Metadata = privateMetadata("App settings");

export default async function OauthAppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCachedAuthUser().catch(() => null);
  if (!user) redirect(`/sign-in?returnTo=/developer/apps/${id}`);
  const profile = await getCachedUserProfile(user.id);
  if (!profile) redirect("/onboarding");
  const app = await getDb().query.oauthClients.findFirst({
    where: and(eq(oauthClients.id, id), eq(oauthClients.ownerProfileId, profile.id)),
  });
  if (!app) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-4 pb-20">
      <div>
        <Link
          href="/developer"
          className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden /> Developer settings
        </Link>
        <h1 className="mt-2 text-3xl text-fg sm:text-4xl">{app.name}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-fg-muted tabular-nums">
          <Users className="size-4" aria-hidden />
          {app.usersCount} students signed in ·{" "}
          {app.type === "PUBLIC" ? "Browser or mobile app (PKCE)" : "Web app with a server"}
        </p>
        {app.status === "SUSPENDED" && (
          <p role="alert" className="mt-3 rounded-md bg-danger-subtle p-3 text-sm font-semibold text-danger">
            This app is suspended. Sign-ins are blocked. {app.reviewNote}
          </p>
        )}
      </div>

      <AppCredentials
        id={app.id}
        type={app.type}
        secretLast4={app.secretLast4}
        isFirstParty={app.isFirstParty}
        appName={app.name}
        redirectUris={app.redirectUris}
      />

      <section>
        <h2 className="mb-3 text-xl text-fg">Add the button</h2>
        <Quickstart clientId={app.id} />
      </section>

      <section>
        <h2 className="mb-3 text-xl text-fg">Settings</h2>
        <AppForm
          appId={app.id}
          initial={{
            name: app.name,
            description: app.description ?? "",
            homepageUrl: app.homepageUrl ?? "",
            logoUrl: app.logoUrl ?? "",
            privacyUrl: app.privacyUrl ?? "",
            termsUrl: app.termsUrl ?? "",
            type: app.type === "PUBLIC" ? "PUBLIC" : "CONFIDENTIAL",
            redirectUris: app.redirectUris,
          }}
        />
      </section>
    </div>
  );
}
