import { Heart, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CountdownSticker,
  LoopPointsSticker,
  PollSticker,
  QuestionSticker,
  Sticker,
} from "@/components/ui/stickers";
import type { Course } from "@/db/schema";
import { formatDuration } from "@/lib/courses/format";
import type { PublicStats } from "@/lib/public-stats";
import { cn } from "@/lib/utils";
import { LANDING_CONTAINER } from "./landing-hero";

const EVENT_OFFSET_MS = 5 * 24 * 60 * 60 * 1000;

/** Example event start, a few days from the request time. The page renders per request. */
function exampleEventTarget(): number {
  return Date.now() + EVENT_OFFSET_MS;
}

/**
 * One sticker on the wall. The whole unit is the link; its name is the title,
 * the line underneath is its description.
 */
function Feature({
  id,
  sticker,
  title,
  text,
  href,
  lead,
  stickerClassName,
  className,
}: {
  id: string;
  sticker: ReactNode;
  title: string;
  text: string;
  href: string;
  lead?: boolean;
  stickerClassName?: string;
  className?: string;
}) {
  return (
    <li className={cn("relative min-w-0 hover:z-10 focus-within:z-10", className)}>
      <Link
        href={href}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-text`}
        className="group block rounded-sticker outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
      >
        <div
          className={cn(
            "w-full transition-transform duration-200 ease-out group-hover:-translate-y-1",
            lead ? "max-w-md" : "max-w-xs",
            stickerClassName
          )}
        >
          {sticker}
        </div>
        <h3
          id={`${id}-title`}
          className={cn(
            "mt-6 text-fg decoration-2 underline-offset-4 group-hover:text-brand-text group-hover:underline",
            lead ? "text-3xl" : "text-xl"
          )}
        >
          {title}
        </h3>
        <p id={`${id}-text`} className="mt-1.5 max-w-[34ch] text-pretty text-base text-fg-muted">
          {text}
        </p>
      </Link>
    </li>
  );
}

function CoursesSticker({ courses }: { courses: Course[] }) {
  return (
    <Sticker className="overflow-hidden">
      <p className="sticker-caption bg-sticker-header px-4 py-3 text-lg text-sticker-header-fg">
        Free courses
      </p>
      <ul className="divide-y divide-border">
        {courses.map((c) => (
          <li key={c.id} className="px-4 py-3">
            <span className="line-clamp-1 text-sm font-semibold">{c.title}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
              <PlayCircle className="size-3.5" aria-hidden="true" />
              {c.lecturesCount} lectures, {formatDuration(c.durationSec)}
            </span>
          </li>
        ))}
      </ul>
    </Sticker>
  );
}

function notesText(stats: PublicStats): string {
  return stats.resources !== null
    ? `${stats.resources.toLocaleString("en-IN")} notes and past papers by branch, plus free courses.`
    : "Notes and past papers by branch, plus free courses.";
}

/** What you can do here: an uneven sticker wall where each sticker is its own link. */
export function LandingFeatures({ courses, stats }: { courses: Course[]; stats: PublicStats }) {
  const picks = courses.slice(0, 3);
  const eventTarget = exampleEventTarget();

  return (
    <section className={`${LANDING_CONTAINER} py-20 lg:py-28`} aria-labelledby="features-title">
      <h2 id="features-title" className="max-w-[18ch] text-balance text-[length:var(--text-section)] text-fg">
        What you can do here
      </h2>
      <ul className="mt-14 grid gap-y-14 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
        <Feature
          id="feature-confess"
          lead
          className="lg:col-span-7"
          stickerClassName="lg:-rotate-2"
          title="Confess anonymously"
          text="Say the thing. Your name never shows."
          href="/confessions"
          sticker={
            <QuestionSticker prompt="Confess something">
              <p>To whoever fills the chai flask outside the library during midsems: thank you.</p>
            </QuestionSticker>
          }
        />
        <Feature
          id="feature-poll"
          lead
          className="lg:col-span-5 lg:mt-12"
          stickerClassName="lg:rotate-2"
          title="Ask your whole campus"
          text="Polls on anything, from mess food to fest dates."
          href="/feeds"
          sticker={
            <PollSticker
              question="Fest headliner?"
              showResults
              options={[
                { id: "band", label: "A live band", votes: 54 },
                { id: "dj", label: "DJ night", votes: 46 },
              ]}
              footer="Example poll"
            />
          }
        />
        <Feature
          id="feature-events"
          className="lg:col-span-3 lg:mt-16"
          stickerClassName="lg:-rotate-3"
          title="Never miss a fest"
          text="Fests, talks and club meetups, with a reminder."
          href="/events"
          sticker={<CountdownSticker title="Robotics workshop" target={eventTarget} />}
        />
        <Feature
          id="feature-notes"
          className="lg:col-span-3 lg:-ml-12 lg:mt-28"
          stickerClassName="lg:rotate-1"
          title="Notes, past papers, courses"
          text={notesText(stats)}
          href="/academics"
          sticker={
            picks.length > 0 ? (
              <CoursesSticker courses={picks} />
            ) : (
              <QuestionSticker prompt="Free study material">
                <p>Notes, past papers and courses for your branch.</p>
              </QuestionSticker>
            )
          }
        />
        <Feature
          id="feature-match"
          className="lg:col-span-3 lg:-ml-12 lg:mt-12"
          stickerClassName="lg:-rotate-2"
          title="Campus Match"
          text="Verified students 18+. Likes show only when mutual."
          href="/matching"
          sticker={
            <Sticker tone="crush" className="flex items-center gap-4 p-5">
              <Heart className="size-9 shrink-0 fill-current" aria-hidden="true" />
              <span>
                <span className="sticker-caption block text-3xl">It's a match</span>
                <span className="mt-1 block text-sm font-medium">You both liked each other.</span>
              </span>
            </Sticker>
          }
        />
        <Feature
          id="feature-invite"
          className="lg:col-span-3 lg:-ml-12 lg:mt-32"
          stickerClassName="lg:rotate-3"
          title="Bring your friends"
          text="Invite a friend, get 20 Loop Points when they join."
          href="/sign-up"
          sticker={
            <LoopPointsSticker
              points={20}
              label="Loop Points for an invite"
              className="h-12 px-5 text-base"
            />
          }
        />
      </ul>
      <p className="mt-16 text-sm text-fg-subtle">The posts and polls on this page are examples.</p>
    </section>
  );
}
