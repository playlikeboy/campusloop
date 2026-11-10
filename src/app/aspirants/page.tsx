import Link from "next/link";
import { ExampleSticker } from "@/components/marketing/example-sticker";
import { StoryHero } from "@/components/marketing/page-hero";
import { CTABand } from "@/components/marketing/system";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata = buildMetadata({
  title: "Campus Preview for aspirants",
  description:
    "Choosing a college? Read what real students say about classes, hostels and placements with any email, before admission.",
  path: "/aspirants",
});

const WHAT_YOU_READ = [
  {
    title: "Classes",
    body: "How tough exams are, which teachers explain well, and how strict attendance is.",
  },
  { title: "Hostel and mess", body: "Rooms, Wi-Fi, late-night food and how room allotment works." },
  {
    title: "Placements and clubs",
    body: "Coding clubs, hackathon teams and honest internship advice from seniors.",
  },
];

const STEPS = [
  {
    title: "Sign up with any email",
    body: "Gmail or Outlook works. You get Campus Preview, without the verified tick.",
  },
  { title: "Follow the colleges you like", body: "Read their pages, feeds and study material." },
  {
    title: "Verify after admission",
    body: "Add your college email when you get it. The same account gets the verified tick and everything opens up.",
  },
];

export default function AspirantsPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Campus Preview", path: "/aspirants" }])} />
      <StoryHero
        title="See real college life before you choose."
        lede="Brochures show the best photos. Campus Preview shows what students actually say. All you need is an email."
        actions={
          <>
            <Link href="/sign-up" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Sign up with any email
            </Link>
            <Link
              href="/colleges"
              className="inline-flex min-h-11 items-center px-2 font-semibold text-story-field-fg underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-story-field-fg"
            >
              Browse colleges
            </Link>
          </>
        }
        aside={
          <ExampleSticker author="Senior, Mechanical" college="BIT Mesra">
            <p className="sticker-caption text-2xl">Mess food is fine. Get a cooler for the summer.</p>
          </ExampleSticker>
        }
      />

      <div className="mx-auto w-full max-w-[var(--container-marketing)] px-[var(--gutter)] py-16 sm:py-20">
        <section aria-labelledby="read" className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <h2 id="read" className="text-3xl text-fg md:text-4xl">
            What you can read
          </h2>
          <dl className="divide-y divide-border border-y border-border">
            {WHAT_YOU_READ.map((item) => (
              <div key={item.title} className="py-4">
                <dt className="font-semibold text-fg">{item.title}</dt>
                <dd className="mt-1 text-fg-muted">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="how"
          className="mt-20 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
        >
          <h2 id="how" className="text-3xl text-fg md:text-4xl">
            How it works
          </h2>
          <div>
            <ol className="space-y-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted font-semibold tabular-nums text-fg"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-sans text-base font-semibold text-fg">{step.title}</h3>
                    <p className="mt-1 text-fg-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm text-fg-subtle">
              Verified-only spaces, like Campus Match, open after you verify a college email.
            </p>
          </div>
        </section>
      </div>

      <CTABand
        title="Start reading today."
        lede="Free, and it takes a minute."
        primaryHref="/sign-up"
        primaryLabel="Sign up with any email"
        secondaryHref="/colleges"
        secondaryLabel="Browse colleges"
      />
    </MarketingShell>
  );
}
