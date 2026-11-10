"use client";

import {
  Ban,
  BriefcaseBusiness,
  Check,
  Copy,
  ExternalLink,
  EyeOff,
  FileDown,
  FileText,
  Flame,
  HeartHandshake,
  Megaphone,
  MessagesSquare,
  Presentation,
  ShieldCheck,
  ShoppingBag,
  Split,
  Store,
  Ticket,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CTABand, Section, SectionHeading, StatCard } from "@/components/marketing/system";
import type { PublicStats } from "@/lib/public-stats";

const PITCH_DECK_PDF_URL = process.env.NEXT_PUBLIC_PITCH_DECK_PDF_URL || "/pitch.pdf";
const SLIDES_URL = "https://canva.link/zdg5k3nnw9ifaaa";

const PAIN_POINTS = [
  {
    icon: Split,
    title: "Fragmented by default",
    body: "Campus life is scattered across WhatsApp groups, unofficial Instagram pages, dead Discord servers and anonymous confession accounts nobody moderates.",
  },
  {
    icon: Ban,
    title: "No identity guarantee",
    body: "Every existing channel is open to recruiters, bots and catfish. Students self-censor because they cannot know who is reading.",
  },
  {
    icon: EyeOff,
    title: "Anonymity without safety",
    body: "Confession pages run on DMs to an anonymous admin. No accountability, no moderation, no way to act on harassment or doxxing.",
  },
  {
    icon: Flame,
    title: "Attention leaks off campus",
    body: "India's most engaged demographic spends hours a day on platforms that know nothing about their campus.",
  },
];

const PRODUCT_LAYERS = [
  {
    icon: ShieldCheck,
    title: "Identity and gatekeeping",
    body: "Email verification on college domains. Every verified account on a campus cleared the same check; other emails get Campus Preview without the verified tick.",
  },
  {
    icon: MessagesSquare,
    title: "Campus feed and confessions",
    body: "Campus-scoped posts, polls, memes and anonymous confessions with a sealed, audited identity link.",
  },
  {
    icon: HeartHandshake,
    title: "Campus Match and Secret Crush",
    body: "A swipe deck and mutual-reveal crush list where every profile is a verified student aged 18 or older.",
  },
  {
    icon: Store,
    title: "Utility sub-hubs",
    body: "Buy and sell, lost and found, housing, rideshare, events and a campus services marketplace: classifieds that only work with campus density.",
  },
  {
    icon: Trophy,
    title: "Loop Points",
    body: "Points reward posting, inviting and helping, so every student is a distribution channel.",
  },
];

const REVENUE_STREAMS = [
  {
    icon: Megaphone,
    title: "Campus-targeted brand activations",
    body: "Co-living, laptops, bootcamps and D2C brands reach a verified, geo-dense 18 to 24 audience.",
  },
  {
    icon: Ticket,
    title: "Event ticketing",
    body: "Commission on fests, workshops and club passes sold where the audience already is.",
  },
  {
    icon: ShoppingBag,
    title: "Campus commerce",
    body: "Commission and delivery fees on marketplace orders paid online, plus merchant subscriptions.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Verified talent discovery",
    body: "Startups reach real students by college, branch and skill without the spam.",
  },
];

const ROADMAP = [
  {
    phase: "Now",
    title: "Live at BIT Mesra",
    body: "Feed, confessions, polls, stories, Campus Match, chat, communities, Academic Vault, marketplace, moderation console and Campus Preview are deployed at campusloop.space on Cloudflare's edge.",
  },
  {
    phase: "Next two quarters",
    title: "Density playbook in engineering campuses",
    body: "Ambassador-led launches aiming at deep penetration per campus across the first 25 colleges, compounding through referral loops.",
  },
  {
    phase: "12 to 18 months",
    title: "Monetisation switch-on",
    body: "Brand activations and event ticketing in dense campuses first; marketplace take-rate follows liquidity.",
  },
];

function formatCount(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function PitchClient({ stats }: { stats: PublicStats }) {
  const [copiedDeckLink, setCopiedDeckLink] = useState(false);

  const handleCopyDeckLink = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/pitch.pdf` : "https://campusloop.space/pitch.pdf";
    try {
      await navigator.clipboard.writeText(url);
      setCopiedDeckLink(true);
      toast.success("Copied link to pitch.pdf");
      setTimeout(() => setCopiedDeckLink(false), 2000);
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const tractionCards = [
    stats.students !== null && { value: formatCount(stats.students), label: "Verified students", sub: "Live count, seeded and preview accounts excluded" },
    stats.resources !== null && { value: formatCount(stats.resources), label: "Study resources in the Academic Vault", sub: "Uploaded by students" },
    stats.activeColleges !== null && { value: formatCount(stats.activeColleges), label: "Colleges with verified members", sub: "At least one verified student each" },
    stats.directoryColleges > 0 && { value: formatCount(stats.directoryColleges), label: "Colleges in our directory", sub: "Hubs open on request" },
  ].filter((card): card is { value: string; label: string; sub: string } => Boolean(card));

  return (
    <div className="flex flex-col">
      <Section className="pb-16 pt-16 md:pb-20 md:pt-20">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-semibold text-brand-text">Investor pitch</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-fg md:text-6xl">
            The verified social graph for India&apos;s college students.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-fg-muted md:text-lg">
            CampusLoop pulls each college&apos;s fragmented social life into one student-only network, gated by
            the one credential outsiders do not have: a college email. Density per campus is the product and
            the moat.
          </p>
          <p className="text-sm font-medium text-fg-muted">Built at BIT Mesra by Shaswat Raj.</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-6 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
            >
              Talk to us
            </Link>
            <a
              href={PITCH_DECK_PDF_URL}
              download="CampusLoop-Pitch-Deck.pdf"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-5 text-sm font-semibold text-fg hover:bg-surface-muted"
            >
              <FileDown className="size-4" aria-hidden />
              Download deck (PDF)
            </a>
            <button
              type="button"
              onClick={handleCopyDeckLink}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-fg hover:bg-surface-muted"
              title="Copy direct link to pitch.pdf"
            >
              {copiedDeckLink ? (
                <>
                  <Check className="size-4 text-success" aria-hidden />
                  <span>Copied link</span>
                </>
              ) : (
                <>
                  <Copy className="size-4 text-fg-muted" aria-hidden />
                  <span>Copy PDF link</span>
                </>
              )}
            </button>
            <a
              href={SLIDES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-fg hover:bg-surface-muted"
            >
              <Presentation className="size-4 text-fg-muted" aria-hidden />
              <span>Slides</span>
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>
        </div>
      </Section>

      <Section id="deck" tone="muted">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            className="pb-0"
            title="Pitch deck"
            lede="The deck covers campus density, the student moat, the college directory, monetisation and the 2026 expansion plan."
          />
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <a
              href={PITCH_DECK_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-fg hover:bg-surface-muted"
            >
              <ExternalLink className="size-4 text-fg-muted" aria-hidden />
              Open full screen
            </a>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
                <FileText className="size-4" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-fg">pitch.pdf</p>
            </div>
            <a
              href={PITCH_DECK_PDF_URL}
              download="CampusLoop-Pitch-Deck.pdf"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline"
            >
              <FileDown className="size-4" aria-hidden /> Download
            </a>
          </div>
          <div className="relative aspect-[16/10] min-h-[440px] w-full bg-surface-muted md:min-h-[640px]">
            <iframe
              src={`${PITCH_DECK_PDF_URL}#toolbar=1&navpanes=0&view=FitH`}
              title="CampusLoop pitch deck PDF"
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading
          title="Campus life happens everywhere except one place."
          lede="India's most engaged demographic coordinates its social life through tools that were never built for a campus."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {PAIN_POINTS.map((p) => (
            <div key={p.title} className="h-full rounded-lg border border-border bg-surface p-5">
              <span className="flex size-9 items-center justify-center rounded-md bg-danger-subtle text-danger">
                <p.icon className="size-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-semibold text-fg">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          title="Verification is the product."
          lede="One code sent to a college email does what no moderation team can: it makes every verified account a real student. That guarantee unlocks honest confessions, safe matching, trusted commerce and an audience advertisers cannot buy elsewhere."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {tractionCards.map((card) => (
            <StatCard key={card.label} value={card.value} label={card.label} sub={card.sub} />
          ))}
          <StatCard value="Live" label="At BIT Mesra" sub="Deployed product, onboarding students today" />
          <StatCard value="25" label="Target colleges for the first density push" sub="Ambassador-led launches" />
        </div>
      </Section>

      <Section>
        <SectionHeading title="Five layers, one loop." lede="Live today at campusloop.space." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_LAYERS.map((layer) => (
            <div key={layer.title} className="h-full rounded-lg border border-border bg-surface p-5">
              <span className="flex size-9 items-center justify-center rounded-md bg-brand-subtle text-brand-text">
                <layer.icon className="size-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-semibold text-fg">{layer.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{layer.body}</p>
            </div>
          ))}
          <div className="flex h-full flex-col justify-center rounded-lg bg-brand-subtle p-5">
            <p className="text-sm font-medium leading-relaxed text-fg">
              Each layer compounds the others: identity makes matching safe, matching drives the feed, the feed
              drives utility, utility drives points, and points recruit the next campus.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          title="A wedge into young India."
          lede="Higher education is the densest, most identifiable segment of India's youth internet, and it graduates into every other market."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard value="43.3M" label="Students in Indian higher education" sub="AISHE 2021-22, Ministry of Education" />
          <StatCard value="Engineering first" label="Initial segment" sub="English-first, smartphone-native, hostel-dense campuses" />
          <StatCard value="25 campuses" label="First density beachhead" sub="Ambassador-led launches" />
        </div>
      </Section>

      <Section>
        <SectionHeading
          title="Density monetises four ways."
          lede="Every stream needs campus density first, which is why the moat and the revenue plan are the same plan."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {REVENUE_STREAMS.map((r) => (
            <div key={r.title} className="h-full rounded-lg border border-border bg-surface p-5">
              <span className="flex size-9 items-center justify-center rounded-md bg-success-subtle text-success">
                <r.icon className="size-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-semibold text-fg">{r.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{r.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading title="Shipped first. Raising second." lede="The platform is live and onboarding students today." />
        <ol className="relative space-y-8 border-l border-border pl-6">
          {ROADMAP.map((step) => (
            <li key={step.phase} className="relative">
              <span className="absolute -left-[1.85rem] top-1 size-3 rounded-full border-2 border-bg bg-brand" />
              <p className="text-xs font-semibold text-brand-text">{step.phase}</p>
              <h3 className="mt-0.5 text-base font-semibold text-fg">{step.title}</h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-fg-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <CTABand
        title="Back the verified campus graph."
        lede="We're raising our first round to run the density playbook across Indian engineering campuses."
        primaryHref="/contact"
        primaryLabel="Contact us"
        secondaryHref="/investors"
        secondaryLabel="Read the investor brief"
      />
    </div>
  );
}
