import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BarChart3, CalendarCheck, ChevronDown, Heart, PlayCircle, Users, VenetianMask } from "lucide-react";
import type { Course } from "@/db/schema";
import type { PublicStats } from "@/lib/public-stats";
import { formatDuration } from "@/lib/courses/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ANONYMITY_STATEMENT,
  COMPLIANCE_LINE,
  FOUNDER,
  LANDING_FAQS,
  MATCH_AGE_LINE,
  SAFETY_ROWS,
} from "@/constants/landing";
import { LandingCollegeSearch } from "./landing-college-search";

const CONTAINER = "mx-auto w-full max-w-[var(--container-marketing)] px-[var(--gutter)]";
const H2 = "text-balance text-[length:var(--text-section)] font-bold leading-[1.05] tracking-tight text-fg [overflow-wrap:break-word] min-w-0";
const LEAD = "text-pretty text-[length:var(--text-lead)] leading-snug text-fg-muted";
const TEXT_LINK = "font-semibold text-brand-text underline underline-offset-4 decoration-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const POLL = [
  { label: "Maggi point by the gate", pct: 46 },
  { label: "Night canteen", pct: 31 },
  { label: "Order in", pct: 23 },
];

const COMMUNITIES = ["Dramatics society", "Placement prep, final year", "Hostel 7 football"];

/** Count wording: a live figure only above threshold, otherwise the claim without a number. */
function resourcesLine(stats: PublicStats) {
  return stats.resources !== null
    ? `${stats.resources.toLocaleString("en-IN")} peer-shared notes and previous-year papers, sorted by branch and semester.`
    : "Peer-shared notes and previous-year papers, sorted by branch and semester.";
}

function feedCardHead(icon: ReactNode, title: string, meta: string) {
  return (
    <header className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-text">{icon}</span>
      <span className="min-w-0">
        <strong className="block truncate text-sm font-bold text-fg">{title}</strong>
        <small className="block text-xs text-fg-subtle">{meta}</small>
      </span>
    </header>
  );
}

export function LandingPage({ courses, stats }: { courses: Course[]; stats: PublicStats }) {
  const picks = courses.slice(0, 4);

  return (
    <div id="main-landing-content" className="bg-bg text-fg">
      {/* Hero: Stage on a full-bleed Loop Blue band, the feed cards standing on it. */}
      <section className="bg-brand text-brand-fg" aria-labelledby="hero-title">
        <div className={`${CONTAINER} grid items-center gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24`}>
          <div className="lg:col-span-5">
            <h1 id="hero-title" className="min-w-0 text-balance text-[length:var(--text-display)] font-bold leading-[1.0] tracking-tight [overflow-wrap:break-word]">
              Your campus, verified.
            </h1>
            <p className="mt-6 max-w-[28ch] text-pretty text-[length:var(--text-lead)] leading-snug">
              Everything happening at your college, open only to its verified students.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="primary" size="lg" className="bg-surface text-brand-text hover:bg-surface-muted focus-visible:ring-brand-fg focus-visible:ring-offset-brand">
                <Link href="/sign-up">Join with college email</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="border border-brand-fg text-brand-fg hover:bg-brand-hover focus-visible:ring-brand-fg focus-visible:ring-offset-brand">
                <Link href="/colleges">Find your college</Link>
              </Button>
            </div>
          </div>

          <figure data-slot="hero" data-kind="product" data-alt="The campus feed of a signed-in student at their college" className="min-w-0 lg:col-span-7">
            <div className="landing-card-stack grid gap-4 sm:grid-cols-2">
              <article className="rounded-xl bg-surface p-5 text-fg shadow-sm sm:[--tilt:-1.5deg]" aria-label="Example anonymous confession">
                {feedCardHead(<VenetianMask size={18} aria-hidden="true" />, "Anonymous", "Confession, your college only")}
                <p className="mt-4 text-pretty text-base leading-relaxed">
                  To whoever keeps refilling the chai flask outside the library during midsems: you carried my DSA grade.
                </p>
                <p className="mt-4 flex gap-5 text-sm font-semibold text-fg-muted" aria-hidden="true">
                  <span>Upvote</span>
                  <span>Reply</span>
                </p>
              </article>

              <article className="rounded-xl bg-surface p-5 text-fg shadow-sm sm:[--tilt:1deg]" aria-label="Example campus poll">
                {feedCardHead(<BarChart3 size={18} aria-hidden="true" />, "Best late-night food near campus?", "Poll, closes tonight")}
                <ul className="mt-4 space-y-2">
                  {POLL.map((option) => (
                    <li key={option.label} className="relative overflow-hidden rounded-md bg-surface-muted">
                      <span className="landing-poll-bar absolute inset-y-0 left-0 bg-brand-subtle" style={{ "--pct": `${option.pct}%` } as CSSProperties} aria-hidden="true" />
                      <span className="relative flex justify-between px-3 py-2 text-sm">
                        <span>{option.label}</span>
                        <b className="tabular-nums">{option.pct}%</b>
                      </span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-xl bg-surface p-5 text-fg shadow-sm sm:col-span-2 sm:[--tilt:0.5deg]" aria-label="Example club event">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {feedCardHead(<CalendarCheck size={18} aria-hidden="true" />, "Robotics club: line-follower workshop", "Friday, 6 pm, Lab 3")}
                  <span className="rounded-md bg-brand px-4 py-2 text-sm font-bold text-brand-fg" aria-hidden="true">RSVP</span>
                </div>
              </article>
            </div>
            <figcaption className="mt-4 text-sm">Example posts. Your feed shows your college only.</figcaption>
          </figure>
        </div>
      </section>

      {/* Academic vault: head block beside real catalog picks. */}
      <section className={`${CONTAINER} grid gap-12 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32`} aria-labelledby="vault-title">
        <div className="lg:col-span-5">
          <h2 id="vault-title" className={H2}>Notes, past papers and free courses</h2>
          <p className={`${LEAD} mt-5`}>{resourcesLine(stats)}</p>
          <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-base">
            <Link href="/academics" className={TEXT_LINK}>Open the Academic Vault</Link>
            <Link href="/courses" className={TEXT_LINK}>Browse free courses</Link>
          </p>
        </div>
        {picks.length > 0 ? (
          <figure className="min-w-0 lg:col-span-7">
            <ul className="grid gap-4 sm:grid-cols-2">
              {picks.map((c) => (
                <li key={c.id} className="min-w-0">
                  <Link href={`/courses/${c.slug}`} className="group block overflow-hidden rounded-lg bg-surface shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none">
                    <span className="block aspect-video w-full bg-surface-muted">
                      {c.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- catalog thumbnails come from arbitrary hosts
                        <img src={c.thumbnailUrl} alt="" width={640} height={360} loading="lazy" className="size-full object-cover" />
                      )}
                    </span>
                    <span className="block p-4">
                      <small className="block text-sm text-fg-subtle">{c.source === "CS50" ? "Harvard CS50" : (c.provider ?? c.instructorName)}</small>
                      <strong className="mt-1 line-clamp-2 block text-base font-bold leading-snug text-fg">{c.title}</strong>
                      <small className="mt-2 flex items-center gap-1.5 text-sm text-fg-muted">
                        <PlayCircle size={14} aria-hidden="true" /> {c.lecturesCount} lectures, {formatDuration(c.durationSec)}
                      </small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <figcaption className="mt-4 text-sm text-fg-muted">Picked from the course catalog.</figcaption>
          </figure>
        ) : (
          <dl className="grid gap-6 self-center lg:col-span-7 sm:grid-cols-3">
            {[
              ["Notes", "By subject and semester, shared by students who sat the course."],
              ["Past papers", "Previous-year questions for your branch."],
              ["Courses", "Full video courses from universities and educators, free."],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-border pt-4">
                <dt className="text-lg font-bold text-fg">{t}</dt>
                <dd className="mt-1 text-base text-fg-muted">{d}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Clubs and communities: split, visual first on wide screens. */}
      <section className="bg-surface-muted" aria-labelledby="clubs-title">
        <div className={`${CONTAINER} grid gap-12 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28`}>
          <figure data-slot="communities" data-kind="product" data-alt="A college's communities list with one upcoming event" className="min-w-0 lg:order-first lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-5">
              <ul className="divide-y divide-border rounded-xl bg-surface shadow-sm sm:col-span-3" aria-label="Example communities">
                {COMMUNITIES.map((name) => (
                  <li key={name} className="flex items-center justify-between gap-4 px-5 py-4">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-text"><Users size={18} aria-hidden="true" /></span>
                      <span className="truncate font-semibold text-fg">{name}</span>
                    </span>
                    <span className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-fg" aria-hidden="true">Join</span>
                  </li>
                ))}
              </ul>
              <article className="flex flex-col justify-between rounded-xl bg-surface p-5 shadow-sm sm:col-span-2" aria-label="Example event">
                <small className="text-sm text-fg-subtle">Saturday, 4 pm, Auditorium</small>
                <strong className="mt-2 block text-lg font-bold leading-snug text-fg">Fest auditions: music and dance</strong>
                <span className="mt-6 self-start rounded-md bg-brand px-4 py-2 text-sm font-bold text-brand-fg" aria-hidden="true">Going</span>
              </article>
            </div>
            <figcaption className="mt-4 text-sm text-fg-muted">Example communities and event.</figcaption>
          </figure>
          <div className="self-center lg:col-span-5">
            <h2 id="clubs-title" className={H2}>Clubs and fests, without forty group chats</h2>
            <p className={`${LEAD} mt-5`}>Every club, society and event at your college in one place, with the people who are in them.</p>
            <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-base">
              <Link href="/communities" className={TEXT_LINK}>Communities</Link>
              <Link href="/events" className={TEXT_LINK}>Events</Link>
              <Link href="/feeds" className={TEXT_LINK}>Campus feed</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Anonymity: the approved statement, set as the section. */}
      <section className={`${CONTAINER} py-24 lg:py-32`} aria-labelledby="anon-title">
        <h2 id="anon-title" className="text-sm font-semibold text-fg-muted">What anonymous means here</h2>
        <p className="mt-6 max-w-[34ch] text-balance text-[length:var(--text-display-s)] font-bold leading-[1.1] tracking-tight text-fg [overflow-wrap:break-word] min-w-0 lg:max-w-[40ch]">
          {ANONYMITY_STATEMENT}
        </p>
        <p className="mt-8 text-base text-fg-muted">{COMPLIANCE_LINE}</p>
      </section>

      {/* Campus Match: the only place crush pink appears. */}
      <section className="bg-crush-subtle" aria-labelledby="match-title">
        <div className={`${CONTAINER} grid gap-12 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28`}>
          <div className="self-center lg:col-span-6">
            <h2 id="match-title" className={H2}>Campus Match</h2>
            <p className={`${LEAD} mt-5`}>For verified students aged 18 and over. Interest shows only when it is mutual.</p>
            <p className="mt-8">
              <Link href="/dating" className={TEXT_LINK}>How Campus Match works</Link>
            </p>
          </div>
          <figure data-slot="match" data-kind="product" data-alt="A Campus Match card for a verified student" className="min-w-0 lg:col-span-5 lg:col-start-8">
            <article className="rounded-xl bg-surface p-6 shadow-sm" aria-label="Example match card">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-14 items-center justify-center rounded-full bg-crush-subtle text-crush-text"><Heart size={24} aria-hidden="true" /></span>
                <Badge variant="outline" className="h-auto whitespace-normal py-1 text-crush-text">{MATCH_AGE_LINE}</Badge>
              </div>
              <strong className="mt-5 block text-xl font-bold text-fg">Verified student, third year</strong>
              <p className="mt-2 text-base text-fg-muted">Same college. Likes shown only to a mutual match.</p>
              <div className="mt-6 grid grid-cols-2 gap-3" aria-hidden="true">
                <span className="rounded-md border border-border py-2.5 text-center text-sm font-semibold text-fg">Pass</span>
                <span className="rounded-md bg-crush py-2.5 text-center text-sm font-bold text-crush-fg">Like</span>
              </div>
            </article>
            <figcaption className="mt-4 text-sm text-fg-muted">Example card. No photos are shown here.</figcaption>
          </figure>
        </div>
      </section>

      {/* Safety: rows parted by hairlines, facts from /safety. */}
      <section className={`${CONTAINER} py-24 lg:py-32`} aria-labelledby="safety-title">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 id="safety-title" className={H2}>What happens when something goes wrong</h2>
            <p className="mt-8">
              <Link href="/safety" className={TEXT_LINK}>Safety standards and helplines</Link>
            </p>
          </div>
          <dl className="divide-y divide-border border-y border-border lg:col-span-8">
            {SAFETY_ROWS.map(([term, detail]) => (
              <div key={term} className="grid gap-2 py-6 sm:grid-cols-12 sm:gap-6">
                <dt className="text-lg font-bold text-fg sm:col-span-5">{term}</dt>
                <dd className="text-pretty text-base text-fg-muted sm:col-span-7">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FAQ: answers live in the DOM for readers and for the FAQPage JSON-LD. */}
      <section className="bg-surface-muted" id="faq" aria-labelledby="faq-title">
        <div className={`${CONTAINER} grid gap-10 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28`}>
          <h2 id="faq-title" className={`${H2} lg:col-span-4`}>Before you join</h2>
          <div className="landing-faq divide-y divide-border lg:col-span-8">
            {LANDING_FAQS.map(([question, answer]) => (
              <details key={question} className="group py-2">
                <summary className="flex min-h-[52px] cursor-pointer items-center justify-between gap-6 rounded-md py-3 text-lg font-semibold text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  {question}
                  <ChevronDown size={20} aria-hidden="true" className="shrink-0 text-fg-subtle" />
                </summary>
                <p className="max-w-[65ch] pb-4 text-pretty text-base leading-relaxed text-fg-muted">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Close: the job itself, the college search and the join action. */}
      <section className={`${CONTAINER} py-24 lg:py-32`} aria-labelledby="join-title">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 id="join-title" className={H2}>Start with your college</h2>
            <p className={`${LEAD} mt-5`}>Free for students. Built at {FOUNDER.campus} by {FOUNDER.name}.</p>
            <div className="mt-8">
              <Button asChild variant="primary" size="lg">
                <Link href="/sign-up">Join with college email</Link>
              </Button>
            </div>
          </div>
          <div className="self-center lg:col-span-7">
            <LandingCollegeSearch label="Search the college directory" />
            <p className="mt-3 text-sm text-fg-muted">
              Not there yet? <Link href="/college-request" className={TEXT_LINK}>Request your college</Link>, or read the <Link href="/guide" className={TEXT_LINK}>product guide</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
