import { ArrowUpRight, Heart, PlayCircle } from "lucide-react";
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
 * The field behind a panel. Ink and deep are story fields; the washes follow the
 * colour laws: pink is Campus Match only, yellow is Loop Points only.
 */
const FIELDS = {
  ink: "story-field story-frame-ink",
  deep: "story-field story-frame-deep",
  mist: "bg-brand-subtle text-fg",
  muted: "bg-surface-muted text-fg",
  crush: "bg-crush-subtle text-fg",
  reward: "bg-reward-subtle text-fg",
} as const;

type Field = keyof typeof FIELDS;

const ON_DARK: Record<Field, boolean> = {
  ink: true,
  deep: true,
  mist: false,
  muted: false,
  crush: false,
  reward: false,
};

interface PanelProps {
  id: string;
  field: Field;
  title: string;
  text: string;
  href: string;
  sticker: ReactNode;
  /** Lead panels get the largest caption. */
  lead?: boolean;
  /** Sticker tilt at rest; it straightens on hover. */
  tilt: string;
  stickerClassName?: string;
  className?: string;
}

/**
 * One story panel on the wall. The whole panel is the link; its name is the
 * title, the line underneath is its description.
 */
function Panel({
  id,
  field,
  title,
  text,
  href,
  sticker,
  lead,
  tilt,
  stickerClassName,
  className,
}: PanelProps) {
  const dark = ON_DARK[field];
  return (
    <li className={cn("min-w-0", className)}>
      <Link
        href={href}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-text`}
        className={cn(
          "group relative flex h-full flex-col gap-8 overflow-hidden rounded-xl p-6 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:p-8",
          FIELDS[field]
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3
              id={`${id}-title`}
              className={cn(
                "sticker-caption text-balance",
                lead ? "max-w-[11ch] text-5xl sm:text-6xl" : "max-w-[12ch] text-4xl"
              )}
            >
              {title}
            </h3>
            <p
              id={`${id}-text`}
              className={cn(
                "mt-3 max-w-[32ch] text-pretty",
                lead ? "text-lg" : "text-base",
                dark ? "text-story-field-muted" : "text-fg-muted"
              )}
            >
              {text}
            </p>
          </div>
          <span
            aria-hidden="true"
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
              dark ? "bg-sticker text-sticker-fg" : "bg-fg text-bg"
            )}
          >
            <ArrowUpRight className="size-5" />
          </span>
        </div>
        <div
          className={cn(
            "mt-auto w-full transition-transform duration-300 ease-out group-hover:rotate-0 group-hover:-translate-y-1",
            tilt,
            stickerClassName
          )}
        >
          {sticker}
        </div>
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

/** What you can do here: an uneven wall of story panels, each on its own field and each its own link. */
export function LandingFeatures({ courses, stats }: { courses: Course[]; stats: PublicStats }) {
  const picks = courses.slice(0, 3);
  const eventTarget = exampleEventTarget();

  return (
    <section className={`${LANDING_CONTAINER} pt-28 pb-20 lg:pt-36 lg:pb-28`} aria-labelledby="features-title">
      <h2
        id="features-title"
        className="max-w-[14ch] text-balance text-[length:var(--text-display-s)] leading-none text-fg"
      >
        What you can do here
      </h2>
      <ul className="mt-10 grid gap-4 sm:gap-5 lg:mt-14 lg:grid-cols-12">
        <Panel
          id="feature-confess"
          field="ink"
          lead
          className="lg:col-span-7"
          tilt="-rotate-2"
          stickerClassName="max-w-md"
          title="Confess anonymously"
          text="Say the thing. Your name never shows."
          href="/confessions"
          sticker={
            <QuestionSticker prompt="Confess something">
              <p>To whoever fills the chai flask outside the library during midsems: thank you.</p>
            </QuestionSticker>
          }
        />
        <Panel
          id="feature-poll"
          field="mist"
          lead
          className="lg:col-span-5"
          tilt="rotate-2"
          stickerClassName="max-w-sm self-end"
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
        <Panel
          id="feature-notes"
          field="deep"
          className="lg:col-span-5"
          tilt="rotate-1"
          stickerClassName="max-w-sm"
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
        <Panel
          id="feature-events"
          field="muted"
          className="lg:col-span-3"
          tilt="-rotate-3"
          title="Never miss a fest"
          text="Fests, talks and club meetups, with a reminder."
          href="/events"
          sticker={<CountdownSticker title="Robotics workshop" target={eventTarget} />}
        />
        <li className="grid min-w-0 gap-4 sm:gap-5 lg:col-span-4">
          <ul className="contents">
            <Panel
              id="feature-match"
              field="crush"
              tilt="-rotate-2"
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
            <Panel
              id="feature-invite"
              field="reward"
              tilt="rotate-2"
              stickerClassName="w-auto self-start"
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
        </li>
      </ul>
      <p className="mt-10 text-sm text-fg-subtle">The posts and polls on this page are examples.</p>
    </section>
  );
}
