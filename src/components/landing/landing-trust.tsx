import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VerifiedSticker } from "@/components/ui/stickers";
import type { PublicStats } from "@/lib/public-stats";
import { LandingCollegeSearch } from "./landing-college-search";
import { FAQS, HERO, SAFETY_COMPLIANCE, SAFETY_POINTS } from "./landing-copy";
import { collegeCountHint, LANDING_CONTAINER } from "./landing-hero";

const TEXT_LINK =
  "font-semibold text-brand-text underline underline-offset-4 decoration-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Who is here and how it stays safe: a mint field (mint means verified / safe) with one fact per line. */
export function LandingSafety() {
  return (
    <section className="bg-verified-subtle text-fg" aria-labelledby="safety-title">
      <div className={`${LANDING_CONTAINER} grid gap-10 py-20 lg:grid-cols-12 lg:gap-12 lg:py-28`}>
        <div className="lg:col-span-5">
          <VerifiedSticker className="-rotate-3" />
          <h2
            id="safety-title"
            className="mt-6 max-w-[12ch] text-balance text-[length:var(--text-display-s)] leading-none"
          >
            Only students from your college
          </h2>
        </div>
        <div className="lg:col-span-7">
          <ul className="divide-y divide-fg/15 border-y border-fg/15">
            {SAFETY_POINTS.map(([title, text]) => (
              <li key={title} className="py-6">
                <h3 className="sticker-caption text-3xl sm:text-4xl">{title}</h3>
                <p className="mt-2 max-w-[52ch] text-pretty text-base text-fg-muted sm:text-lg">{text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-base text-fg-muted">
            {SAFETY_COMPLIANCE}
            <Link href="/safety" className={TEXT_LINK}>
              How we keep it safe
            </Link>
          </p>
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
      <h2
        id="faq-title"
        className="text-balance text-[length:var(--text-display-s)] leading-none text-fg lg:col-span-4"
      >
        Questions
      </h2>
      <div className="divide-y divide-border border-y border-border lg:col-span-8">
        {FAQS.map(([question, answer]) => (
          <details key={question} className="group">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-5 font-display text-xl font-bold tracking-tight text-fg outline-none hover:text-brand-text focus-visible:ring-2 focus-visible:ring-ring sm:text-2xl [&::-webkit-details-marker]:hidden">
              {question}
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg transition-ui group-open:rotate-180 group-open:bg-brand group-open:text-brand-fg"
              >
                <ChevronDown className="size-5" />
              </span>
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
        className={`${LANDING_CONTAINER} grid gap-10 py-20 lg:grid-cols-12 lg:items-end lg:gap-12 lg:py-32`}
      >
        <div className="lg:col-span-6">
          <h2
            id="join-title"
            className="max-w-[9ch] text-balance text-[length:var(--text-display)] leading-[0.95] text-story-field-fg"
          >
            Find your college
          </h2>
          <Button asChild size="lg" variant="onField" className="mt-8">
            <Link href="/sign-up">{HERO.cta}</Link>
          </Button>
          {stats.students !== null && (
            <p className="mt-4 text-sm text-story-field-muted">
              {stats.students.toLocaleString("en-IN")} verified students have joined.
            </p>
          )}
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
