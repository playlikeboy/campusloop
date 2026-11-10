import type { Metadata } from "next";
import { DocsHubClient } from "@/components/docs/docs-hub-client";
import { DocsJoinBand } from "@/components/docs/docs-join-band";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { hexclaveServerApp } from "@/hexclave/server";
import { DOCS_FEATURES } from "@/lib/docs-features";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata: Metadata = buildMetadata({
  title: "How CampusLoop works",
  description:
    "Plain write-ups on how each CampusLoop feature works: the campus feed, anonymous confessions, polls, Campus Match, the marketplace and student verification.",
  path: "/docs",
  keywords: ["how CampusLoop works", "CampusLoop docs", "anonymous confessions", "student verification"],
});

export default async function DocsHubPage() {
  const user = await hexclaveServerApp.getUser();
  const listJsonLd = {
    "@type": "CollectionPage",
    name: "How CampusLoop works",
    url: absoluteUrl("/docs"),
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: DOCS_FEATURES.map((f, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: f.title,
        url: absoluteUrl(`/docs/${f.slug}`),
      })),
    },
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Docs", path: "/docs" }]), listJsonLd]} />
      <MarketingShell isAuthenticated={Boolean(user)}>
        <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6 sm:py-14">
          <header className="max-w-2xl space-y-3">
            <h1 className="text-4xl text-fg sm:text-5xl">How CampusLoop works</h1>
            <p className="text-lg text-fg-muted">
              Short write-ups on each feature: what it does, how it keeps you safe, and what we can and can't
              see.
            </p>
          </header>
          <DocsHubClient features={DOCS_FEATURES} />
        </div>
        <DocsJoinBand signedIn={Boolean(user)} />
      </MarketingShell>
    </>
  );
}
