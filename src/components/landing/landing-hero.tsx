import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PublicStats } from "@/lib/public-stats";
import { LandingCollegeSearch } from "./landing-college-search";
import { HERO } from "./landing-copy";
import { LandingStoryFrame } from "./landing-story-frame";

export const LANDING_CONTAINER = "mx-auto w-full max-w-[var(--container-marketing)] px-[var(--gutter)]";

/** White sticker button for use on a violet story field. */

export function collegeCountHint(stats: PublicStats): string | undefined {
  return stats.directoryColleges > 0
    ? `${stats.directoryColleges.toLocaleString("en-IN")} colleges listed so far`
    : undefined;
}

/** First viewport: violet story field, headline, college email CTA, college search, and the story frame. */
export function LandingHero({ stats }: { stats: PublicStats }) {
  return (
    <section className="story-field overflow-x-clip" aria-labelledby="hero-title">
      <div
        className={`${LANDING_CONTAINER} grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:py-20`}
      >
        <div className="min-w-0 lg:col-span-6 xl:col-span-7">
          <h1
            id="hero-title"
            className="max-w-[12ch] text-balance text-[length:var(--text-display)] leading-[0.95] text-story-field-fg"
          >
            {HERO.title}
          </h1>
          <p className="mt-5 max-w-[42ch] text-pretty text-[length:var(--text-lead)] leading-snug text-story-field-muted">
            {HERO.lead}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button asChild size="lg" variant="onField">
              <Link href="/sign-up">{HERO.cta}</Link>
            </Button>
            <Link
              href="/sign-in"
              className="rounded-sm text-base font-semibold text-story-field-fg underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-story-field-fg"
            >
              I already have an account
            </Link>
          </div>
          {stats.students !== null && (
            <p className="mt-4 text-sm text-story-field-muted">
              {stats.students.toLocaleString("en-IN")} verified students have joined.
            </p>
          )}
          <div className="mt-10 max-w-lg">
            <LandingCollegeSearch label="Find your college" hint={collegeCountHint(stats)} tone="field" />
          </div>
        </div>
        <div className="min-w-0 lg:col-span-6 xl:col-span-5">
          <LandingStoryFrame />
        </div>
      </div>
    </section>
  );
}
