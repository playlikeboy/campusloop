import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VerifiedSticker } from "@/components/ui/stickers";
import type { PublicStats } from "@/lib/public-stats";
import { LandingCollegeSearch } from "./landing-college-search";
import { FAQS, HERO, SAFETY_PARAGRAPH } from "./landing-copy";
import { collegeCountHint, LANDING_CONTAINER } from "./landing-hero";

const H2 = "text-balance text-[length:var(--text-section)] text-fg";
const TEXT_LINK =
  "font-semibold text-brand-text underline underline-offset-4 decoration-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Who is here and how it stays safe, in one plain paragraph. */
export function LandingSafety() {
  return (
    <section className="border-t border-border bg-surface-muted" aria-labelledby="safety-title">
      <div className={`${LANDING_CONTAINER} grid gap-8 py-20 lg:grid-cols-12 lg:gap-12 lg:py-24`}>
        <h2 id="safety-title" className={`${H2} lg:col-span-5`}>
          Only students from your college
        </h2>
        <div className="lg:col-span-7 lg:pt-2">
          <p className="max-w-[60ch] text-pretty text-[length:var(--text-lead)] leading-relaxed text-fg-muted">
            {SAFETY_PARAGRAPH}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/safety" className={TEXT_LINK}>
              How we keep it safe
            </Link>
            <VerifiedSticker className="rotate-3" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Answers stay in the DOM so readers and the FAQPage JSON-LD see the same text. */
export function LandingFaq() {
  return (
    <section
      className={`${LANDING_CONTAINER} grid gap-10 py-20 lg:grid-cols-12 lg:gap-12 lg:py-24`}
      aria-labelledby="faq-title"
    >
      <h2 id="faq-title" className={`${H2} lg:col-span-4`}>
        Questions
      </h2>
      <div className="divide-y divide-border border-y border-border lg:col-span-8">
        {FAQS.map(([question, answer]) => (
          <details key={question} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-4 text-lg font-semibold text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              {question}
              <ChevronDown
                className="size-5 shrink-0 text-fg-subtle transition-ui group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="max-w-[65ch] pb-5 text-pretty text-base leading-relaxed text-fg-muted">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Closing story field: find your college or join. */
export function LandingClose({ stats }: { stats: PublicStats }) {
  return (
    <section className="story-field" aria-labelledby="join-title">
      <div
        className={`${LANDING_CONTAINER} grid gap-10 py-20 lg:grid-cols-12 lg:items-end lg:gap-12 lg:py-24`}
      >
        <div className="lg:col-span-6">
          <h2
            id="join-title"
            className="text-balance text-[length:var(--text-display-s)] leading-[0.95] text-story-field-fg"
          >
            Find your college
          </h2>
          <Button asChild size="lg" variant="onField" className="mt-8">
            <Link href="/sign-up">{HERO.cta}</Link>
          </Button>
        </div>
        <div className="lg:col-span-6">
          <LandingCollegeSearch label="Search colleges" hint={collegeCountHint(stats)} tone="field" />
          <p className="mt-4 text-sm text-story-field-muted">
            Not listed?{" "}
            <Link
              href="/college-request"
              className="rounded-sm font-semibold text-story-field-fg underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-story-field-fg"
            >
              Request your college
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
