import { eq } from "drizzle-orm";
import { Award, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateActions } from "@/components/courses/certificate-actions";
import { getDb } from "@/db";
import { courseCertificates, courses } from "@/db/schema";
import { courseProvider, formatDuration } from "@/lib/courses/format";
import { buildMetadata, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function formatIssued(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

async function load(id: string) {
  if (!/^[A-Z0-9_-]{4,40}$/i.test(id)) return null;
  const rows = await getDb()
    .select({ cert: courseCertificates, course: courses })
    .from(courseCertificates)
    .innerJoin(courses, eq(courses.id, courseCertificates.courseId))
    .where(eq(courseCertificates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = await load(id);
  if (!r) notFound();
  return buildMetadata({
    title: `${r.cert.recipientName} completed ${r.cert.courseTitle}`,
    description: `Certificate of completion for ${r.cert.courseTitle}, issued by CampusLoop on ${formatIssued(r.cert.issuedAt)}.`,
    path: `/certificates/${r.cert.id}`,
    noindex: true,
  });
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  const r = await load(id);
  if (!r) notFound();
  const { cert, course } = r;
  const url = `${SITE_URL}/certificates/${cert.id}`;
  const date = formatIssued(cert.issuedAt);
  const provider = courseProvider(course);

  return (
    <main className="min-h-dvh bg-surface-muted px-[var(--gutter)] py-10 print:bg-bg print:p-0">
      <div className="mx-auto max-w-3xl space-y-6">
        <article
          className="sticker relative overflow-hidden p-8 text-center sm:p-14 print:rounded-none print:shadow-none"
          aria-label="Certificate of completion"
        >
          <div
            className="pointer-events-none absolute inset-3 rounded-lg border border-border-strong"
            aria-hidden="true"
          />
          <div className="relative">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-verified-subtle text-verified-text">
              <Award className="size-7" aria-hidden="true" />
            </div>
            <p className="mt-4 font-display text-lg font-bold text-fg">Certificate of completion</p>
            <p className="mt-8 text-sm text-fg-muted">This certifies that</p>
            <h1 className="mt-2 text-balance text-4xl text-fg sm:text-5xl">{cert.recipientName}</h1>
            <p className="mt-6 text-sm text-fg-muted">completed every lecture of</p>
            <p className="mt-2 text-xl font-bold text-fg sm:text-2xl">{cert.courseTitle}</p>
            <p className="mt-2 text-sm text-fg-muted">
              {course.lecturesCount} lectures · {formatDuration(course.durationSec)} · taught by{" "}
              {course.instructorName}
            </p>
            <dl className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-fg-muted">Issued</dt>
                <dd className="font-semibold text-fg">{date}</dd>
              </div>
              <div>
                <dt className="text-fg-muted">Issued by</dt>
                <dd className="font-semibold text-fg">CampusLoop</dd>
              </div>
              <div>
                <dt className="text-fg-muted">Certificate ID</dt>
                <dd className="font-mono font-semibold text-fg">{cert.id}</dd>
              </div>
            </dl>
            <p className="mt-8 flex flex-wrap items-center justify-center gap-x-1.5 text-sm text-fg-muted">
              <ShieldCheck className="size-4 shrink-0 text-verified-text" aria-hidden="true" />
              <span>Check it at</span>
              <span className="break-all">{url.replace("https://", "")}</span>
            </p>
            {provider && (
              <p className="mx-auto mt-4 max-w-lg text-xs text-fg-muted">
                Course content by {provider}
                {course.license ? `, licensed ${course.license}` : ""}. CampusLoop issues this certificate for
                finishing the lectures. It is not issued or endorsed by {provider}.
              </p>
            )}
          </div>
        </article>
        <CertificateActions url={url} courseTitle={cert.courseTitle} issued={cert.issuedAt} id={cert.id} />
        <p className="text-center text-sm print:hidden">
          <Link
            href={`/courses/${course.slug}`}
            className="font-semibold text-brand-text underline-offset-4 hover:underline"
          >
            View the course
          </Link>
        </p>
      </div>
    </main>
  );
}
