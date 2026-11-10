import { ExternalLink, FileDown } from "lucide-react";
import Link from "next/link";
import { ExampleSticker } from "@/components/marketing/example-sticker";
import { StoryHero } from "@/components/marketing/page-hero";
import { CTABand, Section, SectionHeading } from "@/components/marketing/system";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { getPublicStats } from "@/lib/public-stats";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { CopyDeckLink } from "./pitch-client";
import { PITCH_DECK_PDF_URL, PROBLEMS, PRODUCT_LAYERS, REVENUE, ROADMAP, SLIDES_URL } from "./pitch-content";

export const metadata = buildMetadata({
  title: "Pitch",
  description:
    "CampusLoop's pitch: the problem with scattered campus life, the student-only app we built at BIT Mesra, the business model and the plan. Deck PDF included.",
  path: "/pitch",
});

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

function Rows({ items }: { items: { title: string; body: string }[] }) {
  return (
    <dl className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <div key={item.title} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-6">
          <dt className="font-semibold text-fg">{item.title}</dt>
          <dd className="text-fg-muted">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function PitchPage() {
  const stats = await getPublicStats();
  const today = [
    { title: "Live", body: "At BIT Mesra, with students using it today." },
    stats.students !== null && {
      title: "Verified students",
      body: `${fmt(stats.students)}, live count, test and preview accounts left out.`,
    },
    stats.resources !== null && {
      title: "Study files",
      body: `${fmt(stats.resources)} uploaded by students.`,
    },
    stats.activeColleges !== null && {
      title: "Colleges with students",
      body: `${fmt(stats.activeColleges)} with at least one verified student.`,
    },
    stats.directoryColleges > 0 && {
      title: "College directory",
      body: `${fmt(stats.directoryColleges)} colleges listed. Pages open on request.`,
    },
    {
      title: "Market",
      body: "43.3 million students in Indian higher education (AISHE 2021-22). We start with engineering colleges.",
    },
  ].filter((row): row is { title: string; body: string } => Boolean(row));

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "WebPage",
            name: "CampusLoop pitch",
            url: `${SITE_URL}/pitch`,
            publisher: { "@id": `${SITE_URL}/#organization` },
            mainEntity: {
              "@type": "DigitalDocument",
              name: "CampusLoop pitch deck",
              url: `${SITE_URL}/pitch.pdf`,
              encodingFormat: "application/pdf",
            },
          },
          breadcrumbJsonLd([{ name: "Pitch", path: "/pitch" }]),
        ]}
      />

      <StoryHero
        title="One trusted app for every Indian campus."
        lede="CampusLoop brings each college's social life into one app that only its students can join, using the one thing outsiders don't have: a college email."
        actions={
          <>
            <Link href="/contact" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Talk to us
            </Link>
            <a
              href={PITCH_DECK_PDF_URL}
              download="CampusLoop-Pitch-Deck.pdf"
              className="inline-flex min-h-11 items-center gap-2 px-2 font-semibold text-story-field-fg underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-story-field-fg"
            >
              <FileDown className="size-4" aria-hidden="true" />
              Download the deck
            </a>
          </>
        }
        footnote="Started at BIT Mesra by Shaswat Raj."
        aside={
          <ExampleSticker author="Anonymous, 3rd year" college="BIT Mesra">
            <p className="sticker-caption text-2xl">Who else is skipping the 8 AM lab tomorrow?</p>
          </ExampleSticker>
        }
      />

      <Section id="deck">
        <SectionHeading
          title="The deck"
          lede="Campus density, why it's hard to copy, the college directory, revenue and the 2026 plan."
        />
        <div className="flex flex-wrap gap-3">
          <a href={PITCH_DECK_PDF_URL} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
            Open the PDF
            <ExternalLink aria-hidden="true" />
          </a>
          <CopyDeckLink path={PITCH_DECK_PDF_URL} />
          <a
            href={SLIDES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost" })}
          >
            View slides
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
        <div className="mt-8 hidden aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-surface-muted md:block">
          <iframe
            src={`${PITCH_DECK_PDF_URL}#toolbar=1&navpanes=0&view=FitH`}
            title="CampusLoop pitch deck"
            className="h-full w-full border-0"
            loading="lazy"
          />
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          title="The problem"
          lede="Students run campus life on tools that were never made for a campus."
        />
        <Rows items={PROBLEMS} />
      </Section>

      <Section>
        <SectionHeading
          title="Where we are today"
          lede="Live numbers from our database. Small counts are hidden until they mean something."
        />
        <Rows items={today} />
      </Section>

      <Section tone="muted">
        <SectionHeading
          title="The product"
          lede="Each part feeds the next: verified entry makes matching safe, matching brings people to the feed, the feed brings them to services, and points bring the next campus."
        />
        <Rows items={PRODUCT_LAYERS} />
      </Section>

      <Section>
        <SectionHeading
          title="How it makes money"
          lede="Every stream needs lots of students on one campus first."
        />
        <Rows items={REVENUE} />
      </Section>

      <Section tone="muted">
        <SectionHeading title="The plan" />
        <ol className="space-y-8 border-l border-border-strong pl-6">
          {ROADMAP.map((step) => (
            <li key={step.when}>
              <h3 className="text-xl text-fg">{step.title}</h3>
              <p className="text-sm font-semibold text-fg-subtle">{step.when}</p>
              <p className="mt-1 max-w-xl text-fg-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <CTABand
        title="Help us bring CampusLoop to more campuses."
        lede="We're raising our first round to launch on engineering campuses across India."
        primaryHref="/contact"
        primaryLabel="Contact us"
        secondaryHref="/investors"
        secondaryLabel="Read the investor page"
      />
    </MarketingShell>
  );
}
