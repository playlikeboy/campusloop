import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  DocLayout,
  DocList,
  DocNote,
  DocSection,
  type DocSectionRef,
  LegalDocHeader,
  MailLink,
} from "@/components/marketing/legal-doc";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { DemoCredentials } from "./demo-client";

export const metadata = buildMetadata({
  title: "Demo account",
  description:
    "Try CampusLoop without a college email. Sign in with the shared demo account to see the feed, notes, clubs, events and Campus Match.",
  path: "/demo",
});

const SECTIONS: DocSectionRef[] = [
  { id: "sign-in", label: "Sign in" },
  { id: "try", label: "What to try" },
  { id: "pages", label: "Pages to open" },
  { id: "questions", label: "Questions" },
];

const PAGES = [
  { href: "/feeds", label: "Feed", line: "Posts, polls and confessions from the campus." },
  { href: "/academics", label: "Study material", line: "Notes and past papers by branch and semester." },
  { href: "/colleges", label: "Colleges", line: "Search any college and request a missing one." },
  { href: "/matching", label: "Campus Match", line: "Swipe through verified students aged 18+." },
  { href: "/communities", label: "Communities", line: "Clubs, societies and interest groups." },
  { href: "/events", label: "Events", line: "Fests, hackathons and workshops." },
  { href: "/marketplace", label: "Marketplace (beta)", line: "Order from campus shops and services." },
];

export default function DemoPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Demo account", path: "/demo" }])} />
      <DocLayout
        sections={SECTIONS}
        header={
          <LegalDocHeader
            title="Try the demo account"
            summary="CampusLoop is normally only for students with a college email. This shared account lets investors, testers and college staff look around."
          />
        }
      >
        <DocSection id="sign-in" title="Sign in">
          <DemoCredentials />
          <Link href="/sign-in?returnTo=/feeds" className={buttonVariants({ size: "lg" })}>
            Sign in with the demo account
            <ArrowRight aria-hidden="true" />
          </Link>
          <DocNote>Other people use this account too. Don&apos;t post anything personal.</DocNote>
        </DocSection>

        <DocSection id="try" title="What to try">
          <DocList
            items={[
              "Open your profile and look for the verified tick and the college name.",
              "On the feed, switch between your campus and Global to see posts from other colleges.",
              "Open the menu and switch the feed between everyone and named posts only, to see how anonymous posts work.",
            ]}
          />
        </DocSection>

        <DocSection id="pages" title="Pages to open">
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {PAGES.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className="group flex min-h-16 items-center justify-between gap-4 px-4 py-3 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span>
                    <span className="block font-semibold text-fg">{page.label}</span>
                    <span className="block text-sm text-fg-muted">{page.line}</span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-fg-subtle group-hover:text-fg"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </DocSection>

        <DocSection id="questions" title="Questions">
          <dl className="space-y-5">
            <div>
              <dt className="font-semibold text-fg">Can our college try it with our own email domain?</dt>
              <dd className="mt-1">
                Yes. Send the domain from the{" "}
                <Link
                  href="/college-request"
                  className="text-brand-text underline underline-offset-4 hover:no-underline"
                >
                  request page
                </Link>{" "}
                or write to <MailLink email="partners@campusloop.space" />.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">Found a bug?</dt>
              <dd className="mt-1">
                Email <MailLink email="support@campusloop.space" /> with what you did and what went wrong.
              </dd>
            </div>
          </dl>
        </DocSection>
      </DocLayout>
    </MarketingShell>
  );
}
