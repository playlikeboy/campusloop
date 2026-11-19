import { Smartphone } from "lucide-react";
import Link from "next/link";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { ApkDownloadButton } from "./apk-download-button";

export const metadata = buildMetadata({
  title: "Android app (beta)",
  description:
    "Get the CampusLoop Android beta: your campus feed, events, courses and chats in one app. Free download, Android only for now.",
  path: "/download",
});

const STEPS = [
  {
    title: "Allow installs from your browser",
    body: "Android asks once. Tap Settings on the prompt and turn on “Allow from this source” for Chrome (or the browser you used).",
  },
  {
    title: "Open the file",
    body: "Open campusloop-beta.apk from your notifications or the Downloads folder, then tap Install.",
  },
  {
    title: "Sign in",
    body: "Open CampusLoop and sign in with the same account you use on the website. Everything is already there.",
  },
];

export default function DownloadPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "WebPage",
            name: "CampusLoop Android app (beta)",
            url: `${SITE_URL}/download`,
            inLanguage: "en-IN",
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          breadcrumbJsonLd([{ name: "Android app", path: "/download" }]),
        ]}
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-text">
          <Smartphone className="size-4" aria-hidden /> Android beta
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-fg sm:text-5xl">CampusLoop on your phone</h1>
        <p className="mt-4 text-lg text-fg-muted">
          The beta app is the same CampusLoop you use on the website, in its own app with notifications. It is early, so
          you may hit a rough edge. Tell us when you do.
        </p>

        <div className="mt-8">
          <ApkDownloadButton />
          <p className="mt-3 text-sm text-fg-muted">Android only. Free.</p>
        </div>

        <section aria-labelledby="install-title" className="mt-12">
          <h2 id="install-title" className="font-sans text-xl font-semibold text-fg">
            How to install
          </h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-lg border border-border bg-surface p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle font-semibold tabular-nums text-brand-text">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-fg">{step.title}</h3>
                  <p className="mt-1 text-sm text-fg-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="iphone-title" className="mt-12 rounded-lg border border-border bg-surface-muted p-4">
          <h2 id="iphone-title" className="font-semibold text-fg">
            On an iPhone?
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            There is no iPhone app yet. Open campusloop.space in Safari, tap Share, then “Add to Home Screen”. It works like
            an app.
          </p>
        </section>

        <p className="mt-8 text-sm text-fg-muted">
          The app follows the same{" "}
          <Link href="/privacy" className="font-semibold text-brand-text underline underline-offset-4">
            privacy policy
          </Link>{" "}
          as the website.
        </p>
      </div>
    </MarketingShell>
  );
}
