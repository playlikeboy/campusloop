import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/marketing/page-hero";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { FAQS } from "./faqs";
import { HelpClient } from "./help-client";

export const metadata = buildMetadata({
  title: "Help",
  description:
    "Quick answers on verifying your college email, finding notes, anonymous posts, reporting harassment and managing your account.",
  path: "/help",
});

const MORE_HELP = [
  { href: "/college-request", title: "My college isn't listed", line: "Send us its email domain." },
  { href: "/safety#helplines", title: "I need help right now", line: "Helplines and how to report." },
  { href: "/guide", title: "How does a feature work?", line: "Step-by-step guides for everything." },
  { href: "/contact", title: "Talk to a person", line: "Email the right team." },
];

export default function HelpPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "FAQPage",
            mainEntity: FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          },
          breadcrumbJsonLd([{ name: "Help", path: "/help" }]),
        ]}
      />
      <div className="mx-auto w-full max-w-3xl px-[var(--gutter)] py-12 sm:py-16">
        <PageIntro title="How can we help?" lede="Search a question or pick a topic." className="mb-8" />
        <HelpClient />

        <section aria-labelledby="more-help" className="mt-14">
          <h2 id="more-help" className="text-2xl text-fg">
            Still stuck?
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
            {MORE_HELP.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex min-h-16 items-center justify-between gap-4 px-4 py-3 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5"
                >
                  <span>
                    <span className="block font-semibold text-fg">{item.title}</span>
                    <span className="block text-sm text-fg-muted">{item.line}</span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-fg-subtle group-hover:text-fg"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </MarketingShell>
  );
}
