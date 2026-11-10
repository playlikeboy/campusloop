import { Check, EyeOff, Rocket } from "lucide-react";
import type { Course } from "@/db/schema";
import { promotionProgress } from "@/lib/courses/promotion";
import { cn } from "@/lib/utils";

/** Shown to a community course's creator: where the course shows up and what gets it into the catalog. */
export function CourseListingStatus({ course }: { course: Course }) {
  if (course.source !== "COMMUNITY" || course.status !== "PUBLISHED") return null;
  if (course.listed) {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-md bg-verified-subtle px-3 py-2 text-sm font-semibold text-verified-text">
        <Rocket className="size-4" aria-hidden /> Your course is in the catalog
      </p>
    );
  }
  const steps = promotionProgress(course);
  return (
    <section className="mt-4 rounded-lg border border-border bg-surface p-4" aria-labelledby="listing-status">
      <h2 id="listing-status" className="flex items-center gap-2 font-sans text-sm font-bold text-fg">
        <EyeOff className="size-4" aria-hidden /> Not in the catalog yet
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        Students at your college can already find it. It joins the catalog by itself once every bar below is
        full.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((s) => {
          const pct = s.done ? 100 : s.target > 0 ? Math.min(100, (s.current / s.target) * 100) : 0;
          const goal = s.label === "Rating" ? `${s.target}+` : s.target;
          return (
            <li key={s.label}>
              <div className="relative flex h-10 items-center overflow-hidden rounded-sm bg-poll-track px-3 text-sm">
                <span
                  aria-hidden
                  className={cn(
                    "poll-fill absolute inset-0",
                    s.done ? "bg-poll-fill-chosen" : "bg-poll-fill"
                  )}
                  style={{ "--fill": pct } as React.CSSProperties}
                />
                <span className="relative flex flex-1 items-center gap-1.5 font-semibold text-fg">
                  {s.done && <Check className="size-4" aria-hidden />}
                  {s.label}
                </span>
                <span className="relative tabular-nums text-fg">
                  {s.current} / {goal}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
