"use client";

import { Award, Bookmark, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyLearning } from "@/hooks/use-courses";
import { CourseCard } from "./course-card";

type Tab = "learning" | "wishlist" | "certificates";

const browse = (
  <Button asChild>
    <Link href="/courses">Browse courses</Link>
  </Button>
);

function Grid({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>;
}

export function MyLearningClient() {
  const { data, error, isLoading, mutate } = useMyLearning();
  const [tab, setTab] = useState<Tab>("learning");
  const learning = data?.learning ?? [];
  const inProgress = learning.filter((l) => !l.completedAt);
  const done = learning.filter((l) => l.completedAt);
  const wishlist = data?.wishlist ?? [];
  const certificates = data?.certificates ?? [];

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "learning", label: "My courses", n: learning.length },
    { id: "wishlist", label: "Saved", n: wishlist.length },
    { id: "certificates", label: "Certificates", n: certificates.length },
  ];

  const progressGrid = (items: typeof learning) => (
    <Grid>
      {items.map((l) => (
        <li key={l.course.id}>
          <CourseCard
            course={l.course}
            href={`/learn/${l.course.slug}`}
            progress={
              l.course.lecturesCount
                ? Math.min(100, Math.round((l.completedLectures / l.course.lecturesCount) * 100))
                : 0
            }
          />
        </li>
      ))}
    </Grid>
  );

  let body: React.ReactNode;
  if (error) {
    body = (
      <EmptyState
        icon={BookOpen}
        title="Couldn't load your courses"
        description="Check your connection and try again."
        action={<Button onClick={() => mutate()}>Try again</Button>}
      />
    );
  } else if (isLoading) {
    body = (
      <Grid>
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Skeleton className="aspect-[4/3] rounded-lg" />
          </li>
        ))}
      </Grid>
    );
  }

  return (
    <div className="px-4 pb-16 sm:px-0">
      <h1 className="text-3xl text-fg">My learning</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-5 gap-6">
        <TabsList aria-label="My learning sections" className="no-scrollbar max-w-full overflow-x-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="min-h-11 flex-none">
              {t.label}
              <span className="text-xs tabular-nums text-fg-subtle">{t.n}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {body ?? (
          <>
            <TabsContent value="learning">
              {learning.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No courses yet"
                  description="Every course is free. Pick one to start."
                  action={browse}
                />
              ) : (
                <div className="space-y-10">
                  {inProgress.length > 0 && (
                    <section aria-labelledby="in-progress">
                      <h2 id="in-progress" className="mb-3 text-lg text-fg">
                        In progress
                      </h2>
                      {progressGrid(inProgress)}
                    </section>
                  )}
                  {done.length > 0 && (
                    <section aria-labelledby="finished">
                      <h2 id="finished" className="mb-3 text-lg text-fg">
                        Finished
                      </h2>
                      {progressGrid(done)}
                    </section>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="wishlist">
              {wishlist.length === 0 ? (
                <EmptyState
                  icon={Bookmark}
                  title="Nothing saved yet"
                  description="Tap Save on a course to keep it here."
                  action={browse}
                />
              ) : (
                <Grid>
                  {wishlist.map((c) => (
                    <li key={c.id}>
                      <CourseCard course={c} />
                    </li>
                  ))}
                </Grid>
              )}
            </TabsContent>
            <TabsContent value="certificates">
              {certificates.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No certificates yet"
                  description="Finish every lecture in a course to get one."
                  action={browse}
                />
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                  {certificates.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/certificates/${c.id}`}
                        className="flex min-h-16 items-center gap-4 px-4 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-verified-subtle text-verified-text">
                          <Award className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-fg">{c.courseTitle}</span>
                          <span className="text-xs text-fg-muted">
                            Issued{" "}
                            {new Date(c.issuedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </span>
                        <ChevronRight className="size-4 text-fg-muted" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
