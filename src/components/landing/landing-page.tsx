import type { Course } from "@/db/schema";
import type { PublicStats } from "@/lib/public-stats";
import { LandingFeatures } from "./landing-features";
import { LandingHero, LandingTape } from "./landing-hero";
import { LandingClose, LandingFaq, LandingSafety } from "./landing-trust";

/** Home page for visitors: story hero, the tape of what lives here, what you can do, safety, questions, and a last call to join. */
export function LandingPage({ courses, stats }: { courses: Course[]; stats: PublicStats }) {
  return (
    <div className="bg-bg text-fg">
      <LandingHero stats={stats} />
      <LandingTape />
      <LandingFeatures courses={courses} stats={stats} />
      <LandingSafety />
      <LandingFaq />
      <LandingClose stats={stats} />
    </div>
  );
}
