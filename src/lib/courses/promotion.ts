/**
 * Catalog promotion for community courses (client-safe, no DB).
 *
 * New community courses are unlisted: they appear in feeds for discovery but
 * not in the /courses catalog. Once learners show real interest (views,
 * enrolments, wishlists, completions, good ratings) the course is promoted to
 * the catalog. Promotion is sticky unless ratings collapse later.
 */

export interface CourseSignals {
  source: string;
  isFeatured: boolean;
  listed: boolean;
  lecturesCount: number;
  viewCount: number;
  enrollCount: number;
  wishlistCount: number;
  completionCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date | string;
}

/** Thresholds a community course must meet to join the catalog. */
export const PROMOTION = {
  minLectures: 3,
  minViews: 150,
  minLearners: 10,
  /** Bayesian rating floor, applied once a course has a few reviews. */
  minRating: 3.8,
  minReviewsForRating: 3,
  /** Delist a listed course if it is reviewed this badly by this many people. */
  delistRating: 3.2,
  delistReviews: 10,
} as const;

const PRIOR_RATING = 4;
const PRIOR_WEIGHT = 5;

/** Rating shrunk toward 4.0 so 1 review of 5 stars does not beat 500 of 4.7. */
export function bayesianRating(avg: number, count: number): number {
  if (count <= 0) return PRIOR_RATING;
  return (avg * count + PRIOR_RATING * PRIOR_WEIGHT) / (count + PRIOR_WEIGHT);
}

/**
 * Engagement score used to rank unlisted courses in feeds and to break ties in
 * the catalog's "Trending" sort. Log-damped so one viral metric cannot dominate,
 * and decayed by age (half-life ~ 21 days) so new courses get a fair shot.
 */
export function trendScore(s: CourseSignals, now = Date.now()): number {
  const quality = (bayesianRating(s.ratingAvg, s.ratingCount) - 3) / 2; // 0..1 for 3..5 stars
  const raw =
    Math.log1p(s.viewCount) * 1 +
    Math.log1p(s.enrollCount) * 3 +
    Math.log1p(s.wishlistCount) * 2 +
    Math.log1p(s.completionCount) * 4 +
    Math.log1p(s.ratingCount) * 2 * Math.max(0, quality);
  const ageDays = Math.max(0, (now - new Date(s.createdAt).getTime()) / 86_400_000);
  return Number((raw * 0.5 ** (ageDays / 21)).toFixed(4));
}

export interface PromotionProgress {
  label: string;
  current: number;
  target: number;
  done: boolean;
}

/** What is still missing before a community course joins the catalog. */
export function promotionProgress(s: CourseSignals): PromotionProgress[] {
  const rating = bayesianRating(s.ratingAvg, s.ratingCount);
  return [
    { label: "Lectures", current: s.lecturesCount, target: PROMOTION.minLectures, done: s.lecturesCount >= PROMOTION.minLectures },
    { label: "Views", current: s.viewCount, target: PROMOTION.minViews, done: s.viewCount >= PROMOTION.minViews },
    { label: "Learners", current: s.enrollCount, target: PROMOTION.minLearners, done: s.enrollCount >= PROMOTION.minLearners },
    {
      label: "Rating",
      current: Number(rating.toFixed(1)),
      target: PROMOTION.minRating,
      done: s.ratingCount < PROMOTION.minReviewsForRating || rating >= PROMOTION.minRating,
    },
  ];
}

/** Should this course be shown in the /courses catalog? */
export function shouldBeListed(s: CourseSignals): boolean {
  if (s.source !== "COMMUNITY" || s.isFeatured) return true;
  if (s.listed) {
    const tanked = s.ratingCount >= PROMOTION.delistReviews && bayesianRating(s.ratingAvg, s.ratingCount) < PROMOTION.delistRating;
    return !tanked;
  }
  return promotionProgress(s).every((p) => p.done);
}
