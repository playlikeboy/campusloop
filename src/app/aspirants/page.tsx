import { BookOpen, MessageSquare, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/shells/marketing-shell";

export const metadata: Metadata = {
  title: "Campus Preview · CampusLoop",
  description:
    "See what college life is like before you pick a campus. Campus Preview lets prospective students read real student discussions, hostel reviews and senior advice without a college email.",
  keywords: ["prospective student college life", "college reviews", "campus culture", "hostel reviews India", "Campus Preview"],
  alternates: { canonical: "https://campusloop.space/aspirants" },
  openGraph: {
    title: "Campus Preview · CampusLoop",
    description: "Read real campus discussions and senior advice before admission, with any email.",
    url: "https://campusloop.space/aspirants",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://campusloop.space/opengraph-image.png", width: 1200, height: 630, alt: "CampusLoop Campus Preview" }],
  },
};

const CARDS = [
  {
    icon: BookOpen,
    title: "Academic reality",
    body: "How hard mid-sems are, which professors teach well, and whether attendance rules are enforced, before you lock your preference list.",
  },
  {
    icon: MessageSquare,
    title: "Hostel and mess life",
    body: "What students say about hostel hygiene, late-night food, Wi-Fi and room allotment.",
  },
  {
    icon: Trophy,
    title: "Placements and tech culture",
    body: "Active coding societies, hackathon teams and senior internship advice beyond average-package charts.",
  },
];

const STEPS = [
  {
    title: "Sign up with any email",
    body: "A personal email (Gmail, Outlook or similar) opens Campus Preview. You get an account without the verified tick.",
  },
  {
    title: "Follow your target colleges",
    body: "Pick the campuses you are considering and read their hubs, feeds and Academic Vault.",
  },
  {
    title: "Verify once you are admitted",
    body: "When your college email arrives, verify it and the same account gets the verified tick and full access, including Campus Match at 18+.",
  },
];

export default function AspirantsPage() {
  return (
    <MarketingShell>
      <main id="aspirants-main-content" className="py-12 sm:py-16">
        <div className="mx-auto w-full max-w-5xl space-y-16 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-5 text-center">
            <p className="text-sm font-semibold text-brand-text">Campus Preview</p>
            <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">
              See what college life is really like before you get there.
            </h1>
            <p className="text-base leading-relaxed text-fg-muted sm:text-lg">
              Brochures sell glossy campus photos. Campus Preview gives prospective students a candid read of
              student discussions, hostel reality and placement experience, with any email address.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/colleges"
                className="inline-flex h-11 items-center rounded-md bg-brand px-6 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
              >
                Browse colleges
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-5 text-sm font-semibold text-fg hover:bg-surface-muted"
              >
                Create a free account
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="space-y-3 rounded-lg border border-border bg-surface p-6">
                  <div className="flex size-9 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <h2 className="text-base font-semibold text-fg">{card.title}</h2>
                  <p className="text-sm leading-relaxed text-fg-muted">{card.body}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-6 rounded-xl border border-border bg-surface p-6 sm:p-10">
            <h2 className="text-center text-2xl font-bold tracking-tight text-fg">How Campus Preview works</h2>
            <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="space-y-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-fg">{i + 1}</span>
                  <h3 className="text-base font-semibold text-fg">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-fg-muted">{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="text-sm text-fg-muted">
              Preview accounts do not carry the verified tick. Spaces reserved for verified students, including
              Campus Match, open after you verify a college email.
            </p>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
