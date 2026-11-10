import { ArrowLeft, Check, Globe, Scale, Signal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/common/markdown-content";
import { CourseCurriculum } from "@/components/courses/course-curriculum";
import { CourseListingStatus } from "@/components/courses/course-listing-status";
import { CourseReviews } from "@/components/courses/course-reviews";
import { CourseViewBeacon } from "@/components/courses/course-view-beacon";
import { EnrollPanel } from "@/components/courses/enroll-panel";
import { RatingStars } from "@/components/courses/rating-stars";
import { categorySlug } from "@/lib/courses/catalog-params";
import { attributionNote, formatDuration, LEVEL_LABEL } from "@/lib/courses/format";
import { canEditCourse, currentProfile, getCourseDetail, getViewerState } from "@/lib/courses/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await getCourseDetail(slug);
  if (!d) return {};
  const c = d.course;
  if (c.status !== "PUBLISHED") {
    return {
      title: `${c.title} (Draft)`,
      robots: { index: false, follow: false },
    };
  }
  const url = `https://campusloop.space/courses/${c.slug}`;
  return {
    title: `${c.title} — Free Course`,
    description: (c.subtitle ? `${c.subtitle}. ` : "") + c.description.slice(0, 220),
    keywords: [...c.tags, c.category, "free course", "certificate"],
    alternates: { canonical: url },
    // Unlisted community courses are shareable by link but stay out of search until promoted.
    robots: c.listed ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: c.title,
      description: c.subtitle ?? c.description.slice(0, 200),
      url,
      siteName: "CampusLoop",
      type: "website",
      images: c.thumbnailUrl ? [{ url: c.thumbnailUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      images: c.thumbnailUrl ? [c.thumbnailUrl] : undefined,
    },
  };
}

export default async function CourseLandingPage({ params }: Props) {
  const { slug } = await params;
  const d = await getCourseDetail(slug);
  const profile = await currentProfile();
  if (!d || (d.course.status !== "PUBLISHED" && !canEditCourse(d.course, profile))) notFound();
  const { course: c, sections } = d;
  const viewer = await getViewerState(c.id, profile?.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: c.subtitle ?? c.description.slice(0, 300),
    url: `https://campusloop.space/courses/${c.slug}`,
    provider:
      c.source === "CS50"
        ? { "@type": "Organization", name: "Harvard University (CS50)", sameAs: c.sourceUrl }
        : c.provider
          ? { "@type": "Organization", name: c.provider, ...(c.sourceUrl ? { sameAs: c.sourceUrl } : {}) }
          : { "@type": "Organization", name: "CampusLoop", sameAs: "https://campusloop.space" },
    isAccessibleForFree: true,
    inLanguage: "en",
    ...(c.license?.includes("BY-NC-SA")
      ? { license: "https://creativecommons.org/licenses/by-nc-sa/4.0/" }
      : {}),
    ...(c.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: c.ratingAvg.toFixed(1),
            ratingCount: c.ratingCount,
          },
        }
      : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${Math.round(c.durationSec / 3600)}H`,
    },
    offers: { "@type": "Offer", price: 0, priceCurrency: "INR", category: "Free" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {c.status === "PUBLISHED" && <CourseViewBeacon slug={c.slug} />}
      <div className="px-4 pb-20 sm:px-0">
        <nav
          aria-label="Course navigation"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground"
        >
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-3.5 py-1.5 text-xs font-bold text-foreground transition-ui hover:bg-muted hover:text-primary cursor-pointer"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            <span>Courses</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <Link
            href={`/courses/category/${categorySlug(c.category)}`}
            className="rounded-full px-2 py-1 text-xs hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            {c.category}
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="truncate max-w-[200px] text-foreground font-medium sm:max-w-md">{c.title}</span>
        </nav>
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{c.category}</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {c.title}
            </h1>
            {c.subtitle && <p className="mt-2 text-lg text-muted-foreground">{c.subtitle}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {c.ratingCount > 0 && <RatingStars value={c.ratingAvg} count={c.ratingCount} />}
              <span>{c.enrollCount.toLocaleString("en-IN")} learners</span>
              <span className="inline-flex items-center gap-1">
                <Signal className="size-4" aria-hidden />
                {LEVEL_LABEL[c.level]}
              </span>
              <span className="inline-flex items-center gap-1">
                <Globe className="size-4" aria-hidden />
                {c.language}
              </span>
            </div>
            <p className="mt-2 text-sm text-foreground">
              Created by <span className="font-semibold">{d.creator?.displayName ?? c.instructorName}</span>
              {c.sourceUrl && c.source !== "COMMUNITY" && (
                <>
                  {" · "}
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    {c.source === "CS50" ? "Course site" : "Original playlist"}
                  </a>
                </>
              )}
            </p>
            {canEditCourse(c, profile) && <CourseListingStatus course={c} />}

            {c.thumbnailUrl && (
              <img
                src={c.thumbnailUrl}
                alt=""
                className="mt-6 aspect-video w-full rounded-2xl object-cover lg:hidden"
              />
            )}
            <div className="mt-6 lg:hidden">
              <EnrollPanel slug={c.slug} />
            </div>

            {c.outcomes.length > 0 && (
              <section className="mt-10 rounded-2xl bg-card/60 p-5 shadow-2xs">
                <h2 className="text-xl font-bold text-foreground">What you'll learn</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {c.outcomes.map((o) => (
                    <li key={o} className="flex gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-xl font-bold text-foreground">Course content</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {sections.length} section{sections.length === 1 ? "" : "s"} · {c.lecturesCount} lectures ·{" "}
                {formatDuration(c.durationSec)} total
              </p>
              <div className="mt-3">
                <CourseCurriculum
                  slug={c.slug}
                  sections={sections}
                  completedIds={viewer.completedIds}
                  enrolled={viewer.enrolled}
                />
              </div>
            </section>

            {c.requirements.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xl font-bold text-foreground">Requirements</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground marker:text-muted-foreground">
                  {c.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            {c.description && (
              <section className="mt-10">
                <h2 className="text-xl font-bold text-foreground">Description</h2>
                <div className="mt-2">
                  <MarkdownContent content={c.description} />
                </div>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-xl font-bold text-foreground">Instructor</h2>
              <p className="mt-2 font-semibold text-foreground">{c.instructorName}</p>
              {c.instructorBio && (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.instructorBio}</p>
              )}
              {attributionNote(c) && (
                <p className="mt-3 flex gap-2 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                  <Scale className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    {attributionNote(c)}
                    {c.source === "CS50" ? " Notes, slides and problem sets are on " : " "}
                    {c.sourceUrl && (
                      <a
                        href={c.sourceUrl}
                        className="font-semibold text-foreground underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {c.source === "CS50" ? "the course site" : "Watch the original playlist"}
                      </a>
                    )}
                    .
                  </span>
                </p>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-bold text-foreground">Reviews</h2>
              <div className="mt-3">
                <CourseReviews slug={c.slug} />
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {c.thumbnailUrl && (
                <img
                  src={c.thumbnailUrl}
                  alt=""
                  width={480}
                  height={270}
                  loading="lazy"
                  className="aspect-video w-full rounded-lg bg-surface-muted object-cover"
                />
              )}
              <EnrollPanel slug={c.slug} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
