import type { Course } from "@/db/schema";
import type { PublicStats } from "@/lib/public-stats";
import { LandingFeatures } from "./landing-features";
import { LandingHero } from "./landing-hero";
import { LandingClose, LandingFaq, LandingSafety } from "./landing-trust";

/** Home page for visitors: story hero, what you can do, safety, questions, and a last call to join. */
export function LandingPage({ courses, stats }: { courses: Course[]; stats: PublicStats }) {
  return (
    <div className="bg-bg text-fg">
      <LandingHero stats={stats} />
      <LandingFeatures courses={courses} stats={stats} />
      <LandingSafety />
      <LandingFaq />
      <LandingClose stats={stats} />
    </div>
  );
}
