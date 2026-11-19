import { AppWindow, Globe, Smartphone, Zap } from "lucide-react";
import Link from "next/link";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import type { ApkVariant } from "@/lib/analytics/ga4";
import { ApkDownloadButton } from "./apk-download-button";

export const metadata = buildMetadata({
  title: "Android app (beta)",
  description:
    "Try the CampusLoop Android betas: the fast native app, the web app, or the Chrome app with every website feature, Google sign-in and notifications. Free, Android only for now.",
  path: "/download",
});

const BETAS: {
  variant: ApkVariant;
  name: string;
  icon: typeof Zap;
  summary: string;
  points: string[];
  file: string;
  cta: string;
}[] = [
  {
    variant: "expo",
    name: "CampusLoop app (beta)",
    icon: Zap,
    summary: "Built natively for Android. Faster and smoother, but it has fewer features than the website for now.",
    points: ["Quick to open and scroll", "Some website features are not in it yet", "Gets new features as we build them"],
    file: "campusloop-beta.apk",
    cta: "Download the app",
  },
  {
    variant: "capacitor",
    name: "CampusLoop Web app (beta)",
    icon: Globe,
    summary: "The campusloop.space website in its own app. Every feature of the website, always up to date.",
    points: [
      "Everything the website has, on day one",
      "Needs the internet, like the website",
      "Google sign-in opens your browser for a moment",
      "No push notifications yet",
    ],
    file: "campusloop-web-beta.apk",
    cta: "Download the web app",
  },
  {
    variant: "twa",
    name: "CampusLoop Chrome app (beta)",
    icon: AppWindow,
    summary: "Runs on Chrome. Every website feature, Google sign-in and notifications work.",
    points: ["Everything the website has, always up to date", "Needs Chrome on your phone", "Needs the internet, like the website"],
    file: "campusloop-twa-beta.apk",
    cta: "Download the Chrome app",
  },
];

const STEPS = [
  {
    title: "Allow installs from your browser",
    body: "Android asks once. Tap Settings on the prompt and turn on “Allow from this source” for Chrome (or the browser you used).",
  },
  {
    title: "Open the file",
    body: "Open the file (campusloop-beta.apk, campusloop-web-beta.apk or campusloop-twa-beta.apk) from your notifications or the Downloads folder, then tap Install.",
  },
  {
    title: "Sign in",
    body: "Open the app and sign in with the same account you use on the website. Everything is already there.",
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
          We are testing three Android apps and want to know which one you like. Install one, or all of them: they are
          separate apps and sit side by side on your phone. All are early, so you may hit a rough edge. Tell us when you do.
        </p>

        <ul aria-label="Android betas" className="mt-8 grid gap-4 sm:grid-cols-2">
          {BETAS.map((beta) => {
            const Icon = beta.icon;
            const titleId = `beta-${beta.variant}`;
            return (
              <li key={beta.variant} className="flex sm:odd:last:col-span-2">
                <article
                  aria-labelledby={titleId}
                  className="flex w-full flex-col rounded-lg border border-border bg-surface p-5"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand-subtle text-brand-text">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h2 id={titleId} className="mt-3 font-sans text-xl font-semibold text-fg">
                    {beta.name}
                  </h2>
                  <p className="mt-2 text-sm text-fg-muted">{beta.summary}</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-fg-muted">
                    {beta.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-5">
                    <ApkDownloadButton variant={beta.variant} label={beta.cta} />
                    <p className="mt-2 text-xs text-fg-muted">{beta.file}. Android only. Free.</p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

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
          All three apps follow the same{" "}
          <Link href="/privacy" className="font-semibold text-brand-text underline underline-offset-4">
            privacy policy
          </Link>{" "}
          as the website.
        </p>
      </div>
    </MarketingShell>
  );
}
