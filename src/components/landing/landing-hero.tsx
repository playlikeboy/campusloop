import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PublicStats } from "@/lib/public-stats";
import { LandingCollegeSearch } from "./landing-college-search";
import { HERO, TAPE_WORDS } from "./landing-copy";
import { LandingStoryFrame } from "./landing-story-frame";

export const LANDING_CONTAINER = "mx-auto w-full max-w-[var(--container-marketing)] px-[var(--gutter)]";

export function collegeCountHint(stats: PublicStats): string | undefined {
  return stats.directoryColleges > 0
    ? `${stats.directoryColleges.toLocaleString("en-IN")} colleges listed so far`
    : undefined;
}

/** First viewport: violet story field, sticker headline, college email CTA, college search, and the story frame. */
export function LandingHero({ stats }: { stats: PublicStats }) {
  return (
    <section className="story-field overflow-x-clip" aria-labelledby="hero-title">
      <div
        className={`${LANDING_CONTAINER} grid items-center gap-12 pt-12 pb-20 sm:pt-16 sm:pb-24 lg:grid-cols-12 lg:gap-12 lg:pt-20 lg:pb-28`}
      >
        <div className="min-w-0 lg:col-span-6 xl:col-span-7">
          <h1
            id="hero-title"
            className="text-[length:var(--text-display)] leading-[0.95] text-story-field-fg"
          >
            <span className="block">{HERO.titleLead}</span>{" "}
            <span className="mt-3 inline-block -rotate-2 text-balance rounded-sticker bg-sticker px-[0.22em] pt-[0.06em] pb-[0.14em] text-brand-text shadow-sticker-lift sm:mt-4">
              {HERO.titleSticker}
            </span>
          </h1>
          <p className="mt-8 max-w-[42ch] text-pretty text-[length:var(--text-lead)] leading-snug text-story-field-muted">
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

function TapeRun({ hidden }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {TAPE_WORDS.map((word) => (
        <li key={word} className="flex items-center">
          <span className="sticker-caption px-5 text-3xl whitespace-nowrap sm:px-7 sm:text-5xl">{word}</span>
          <span aria-hidden="true" className="size-3 shrink-0 rotate-12 rounded-sm bg-brand sm:size-4" />
        </li>
      ))}
    </ul>
  );
}

/** Ink tape stuck across the seam between the hero and the page: what lives here, in the caption voice. */
export function LandingTape() {
  return (
    <div className="relative z-10 -my-7 overflow-x-clip sm:-my-9">
      <div className="story-field story-frame-ink -mx-[3%] -rotate-1 py-4 shadow-sticker-lift sm:py-5">
        <div className="landing-tape flex w-max">
          <TapeRun />
          <TapeRun hidden />
        </div>
      </div>
    </div>
  );
}
