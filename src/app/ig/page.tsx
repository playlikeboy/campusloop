import { ArrowUpRight, BookOpen, CalendarDays, GraduationCap, School, Smartphone, UserPlus } from "lucide-react";
import Link from "next/link";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { SOCIAL_LINKS } from "@/constants/social";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "CampusLoop links",
  description: "Everything from our Instagram in one place: join your college, free notes, events and courses.",
  path: "/ig",
  noindex: true,
});

/** Every link is tagged, so sign-ups that start here show up as Instagram in analytics. */
const tag = (path: string, content: string) =>
  `${path}${path.includes("?") ? "&" : "?"}utm_source=instagram&utm_medium=bio&utm_content=${content}`;

const LINKS = [
  { href: tag("/colleges", "find-college"), icon: School, title: "Find your college", body: "1,400+ Indian colleges" },
  { href: tag("/academics", "notes"), icon: BookOpen, title: "Notes and past papers", body: "Free, by branch" },
  { href: tag("/events", "events"), icon: CalendarDays, title: "Fests and events", body: "With reminders" },
  { href: tag("/courses", "courses"), icon: GraduationCap, title: "Free courses", body: "With a certificate" },
  { href: tag("/aspirants", "aspirants"), icon: UserPlus, title: "Not in college yet?", body: "Look around first" },
  { href: tag("/download", "android"), icon: Smartphone, title: "Android app", body: "Beta" },
] as const;

export default function InstagramLinksPage() {
  return (
    <MarketingShell>
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-balance text-fg">Your campus. Only your campus.</h1>
          <p className="text-fg-muted">
            Confessions, polls, notes and events from students at your college. Free with a college email.
          </p>
        </header>

        <Link
          href={tag("/sign-up", "join")}
          className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}
        >
          Join with college email
        </Link>

        <ul className="flex flex-col gap-2">
          {LINKS.map(({ href, icon: Icon, title, body }) => (
            <li key={title}>
              <Link
                href={href}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-ui hover:bg-surface-muted"
              >
                <Icon className="size-5 shrink-0 text-brand-text" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">{title}</span>
                  <span className="block text-xs text-fg-muted">{body}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-center text-sm text-fg-muted">
          Follow{" "}
          <a
            href={SOCIAL_LINKS.instagram.url}
            className="font-semibold text-brand-text underline-offset-4 hover:underline"
          >
            {SOCIAL_LINKS.instagram.handle}
          </a>{" "}
          for a new campus story every day.
        </p>
      </div>
    </MarketingShell>
  );
}
