"use client";

import { Award, Bookmark, BookmarkCheck, Clock, Pencil, PlayCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { courseAction, useCourse } from "@/hooks/use-courses";
import { formatDuration } from "@/lib/courses/format";
import { lectureCount } from "./lecture-kind";
import { ProgressBar } from "./progress-bar";

/** Side panel on the course page: join or continue, save, share, what you get. */
export function EnrollPanel({ slug }: { slug: string }) {
  const router = useRouter();
  const { data, error, mutate } = useCourse(slug);
  const [busy, setBusy] = useState(false);

  if (error && !data) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 text-sm">
        <p className="font-semibold text-fg">Couldn't load this course.</p>
        <Button variant="secondary" className="mt-3" onClick={() => mutate()}>
          Try again
        </Button>
      </div>
    );
  }
  if (!data) return <Skeleton className="h-72 rounded-lg" />;

  const { course, viewer, lectures, canEdit } = data;
  const doneCount = viewer.completedIds.length;
  const progress = lectures.length ? Math.round((doneCount / lectures.length) * 100) : 0;
  const resume =
    viewer.lastLectureId ?? lectures.find((l) => !viewer.completedIds.includes(l.id))?.id ?? lectures[0]?.id;

  async function enroll() {
    setBusy(true);
    try {
      await courseAction(`/api/courses/${slug}/enroll`);
      await mutate();
      router.push(lectures[0] ? `/learn/${slug}/${lectures[0].id}` : `/courses/${slug}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't join the course. Try again.";
      if (msg.startsWith("Sign in")) router.push(`/sign-in?returnTo=/courses/${slug}`);
      else toast.error(msg);
      setBusy(false);
    }
  }

  async function wishlist() {
    try {
      const r = await courseAction<{ wishlisted: boolean }>(`/api/courses/${slug}/wishlist`);
      await mutate();
      toast.success(r.wishlisted ? "Saved for later" : "Removed from saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in to save courses");
    }
  }

  async function share() {
    const url = `${window.location.origin}/courses/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: course.title, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar instead.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="font-display text-2xl font-extrabold text-fg">Free</p>
      {viewer.enrolled ? (
        <>
          <div className="mt-3">
            <ProgressBar value={progress} label="Your progress" />
            <p className="mt-1.5 text-sm tabular-nums text-fg-muted">
              {doneCount} of {lectureCount(lectures.length)} done
            </p>
          </div>
          <Button asChild size="lg" className="mt-4 w-full">
            <Link href={resume ? `/learn/${slug}/${resume}` : `/learn/${slug}`}>
              <PlayCircle className="size-5" aria-hidden /> {progress > 0 ? "Continue" : "Start course"}
            </Link>
          </Button>
        </>
      ) : (
        <Button size="lg" onClick={enroll} loading={busy} className="mt-3 w-full">
          {!busy && <PlayCircle className="size-5" aria-hidden />} Join for free
        </Button>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={wishlist} aria-pressed={viewer.wishlisted}>
          {viewer.wishlisted ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
          {viewer.wishlisted ? "Saved" : "Save"}
        </Button>
        <Button variant="secondary" onClick={share}>
          <Share2 aria-hidden /> Share
        </Button>
      </div>
      {canEdit && course.source === "COMMUNITY" && (
        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link href={`/courses/${slug}/edit`}>
            <Pencil aria-hidden /> Edit course
          </Link>
        </Button>
      )}
      <ul className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-fg-muted">
        <li className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" aria-hidden />
          {formatDuration(course.durationSec)} of video, {lectureCount(course.lecturesCount)}
        </li>
        <li className="flex items-center gap-2">
          <Award className="size-4 shrink-0" aria-hidden />
          Certificate when you finish
        </li>
      </ul>
    </div>
  );
}
