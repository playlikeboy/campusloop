import Link from "next/link";
import { ExampleSticker } from "@/components/marketing/example-sticker";
import { StoryHero } from "@/components/marketing/page-hero";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { NAV_GROUPS } from "@/constants/navigation";
import { getPublicStats } from "@/lib/public-stats";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata = buildMetadata({
  title: "About",
  description:
    "CampusLoop is a student-only app for Indian colleges, started at BIT Mesra. Notes, a campus feed, clubs, events and campus services in one place.",
  path: "/about",
});

const FEATURE_GROUPS = NAV_GROUPS.filter((g) => g.id !== undefined && ["campus", "connect", "utilities", "learn"].includes(g.id));

export default async function AboutPage() {
  const stats = await getPublicStats();
  const directory =
    stats.directoryColleges > 0
      ? `${stats.directoryColleges.toLocaleString("en-IN")} colleges are in our directory`
      : "Colleges across India are in our directory";

  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "AboutPage",
            name: "About CampusLoop",
            url: `${SITE_URL}/about`,
            mainEntity: { "@id": `${SITE_URL}/#organization` },
          },
          breadcrumbJsonLd([{ name: "About", path: "/about" }]),
        ]}
      />

      <StoryHero
        title="Your campus, only for students."
        lede="CampusLoop puts your college's posts, notes, clubs, events and everyday services in one app. Only students from your college can see your campus."
        actions={
          <>
            <Link href="/sign-up" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Join with college email
            </Link>
            <Link
              href="/colleges"
              className="inline-flex min-h-11 items-center px-2 font-semibold text-story-field-fg underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-story-field-fg"
            >
              Find your college
            </Link>
          </>
        }
        footnote="Started at BIT Mesra by Shaswat Raj."
        aside={
          <ExampleSticker author="2nd year, CSE" college="BIT Mesra">
            <p className="sticker-caption text-2xl">Anyone selling a cycle before winter break?</p>
          </ExampleSticker>
        }
      />

      <div className="mx-auto w-full max-w-[var(--container-marketing)] px-[var(--gutter)] py-16 sm:py-20">
        <section aria-labelledby="facts" className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <h2 id="facts" className="text-3xl text-fg md:text-4xl">
            The basics
          </h2>
          <dl className="space-y-6 text-base">
            <div>
              <dt className="font-semibold text-fg">Who it's for</dt>
              <dd className="mt-1 text-fg-muted">
                Students at Indian colleges, who join with their college email. Anyone else can look around
                with Campus Preview, without the verified tick.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">Where it's live</dt>
              <dd className="mt-1 text-fg-muted">
                Live at BIT Mesra. {directory}, and new college pages open on request.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">Anonymous posts</dt>
              <dd className="mt-1 text-fg-muted">
                Anonymous posts never show your name or profile to anyone on CampusLoop. Your identity is
                encrypted separately and can only be recovered by CampusLoop for a lawful order or a serious
                safety report, and every such access is logged.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">Why we built it</dt>
              <dd className="mt-1 text-fg-muted">
                College life was spread across WhatsApp groups, random Telegram channels and old college
                portals. We wanted one place per campus that only students can get into.
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="features" className="mt-20">
          <h2 id="features" className="text-3xl text-fg md:text-4xl">
            What's inside
          </h2>
          <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_GROUPS.map((group) => (
              <div key={group.id}>
                <h3 className="font-sans text-sm font-semibold text-fg-subtle">{group.group}</h3>
                <ul className="mt-3 space-y-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="-mx-2 block rounded-md px-2 py-2 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="block font-semibold text-fg">{item.label}</span>
                        {item.desc && <span className="block text-sm text-fg-muted">{item.desc}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
