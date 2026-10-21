import { eq } from "drizzle-orm";
import { Award, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateActions } from "@/components/courses/certificate-actions";
import { getDb } from "@/db";
import { courseCertificates, courses } from "@/db/schema";
import { formatDuration } from "@/lib/courses/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

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
  const r = await load((await params).id);
  if (!r) notFound();
  return {
    title: `${r.cert.recipientName} completed ${r.cert.courseTitle}`,
    description: `Certificate of completion issued by CampusLoop on ${r.cert.issuedAt.toDateString()}.`,
    robots: { index: false, follow: false },
  };
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  const r = await load(id);
  if (!r) notFound();
  const { cert, course } = r;
  const url = `https://campusloop.space/certificates/${cert.id}`;
  const date = cert.issuedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="min-h-dvh bg-muted/40 px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl space-y-6">
        <article className="relative overflow-hidden rounded-3xl bg-background p-8 text-center shadow-sm sm:p-14 print:rounded-none print:shadow-none" aria-label="Certificate of completion">
          <div className="pointer-events-none absolute inset-3 rounded-[20px] border-2 border-primary/25" aria-hidden />
          <div className="relative">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Award className="size-7" aria-hidden />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Certificate of completion</p>
            <p className="mt-8 text-sm text-muted-foreground">This certifies that</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-5xl">{cert.recipientName}</h1>
            <p className="mt-6 text-sm text-muted-foreground">completed every lecture of</p>
            <p className="mt-2 text-xl font-bold text-foreground sm:text-2xl">{cert.courseTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {course.lecturesCount} lectures · {formatDuration(course.durationSec)} · taught by {course.instructorName}
            </p>
            <div className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
              <div><p className="text-muted-foreground">Issued</p><p className="font-semibold text-foreground">{date}</p></div>
              <div><p className="text-muted-foreground">Issued by</p><p className="font-semibold text-foreground">CampusLoop</p></div>
              <div><p className="text-muted-foreground">Certificate ID</p><p className="font-mono font-semibold text-foreground">{cert.id}</p></div>
            </div>
            <p className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden /> Verify at {url.replace("https://", "")}
            </p>
            {course.source === "CS50" && (
              <p className="mx-auto mt-4 max-w-lg text-[11px] leading-relaxed text-muted-foreground">
                Course content by CS50 at Harvard University, licensed CC BY-NC-SA 4.0. This certificate is issued by CampusLoop for
                completing the lectures and is not issued or endorsed by Harvard University or CS50.
              </p>
            )}
          </div>
        </article>
        <CertificateActions url={url} courseTitle={cert.courseTitle} issued={cert.issuedAt} id={cert.id} />
        <p className="text-center text-sm print:hidden">
          <Link href={`/courses/${course.slug}`} className="font-semibold text-primary hover:underline">View the course</Link>
        </p>
      </div>
    </main>
  );
}
