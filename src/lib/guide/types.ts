/**
 * Product Guide catalogue types.
 *
 * One GuideEntry = one public page at /guide/[slug], one block in /llms-full.txt,
 * and one sitemap URL. Written for three readers at once: students (how and why),
 * investors (purpose and value), and AI models (complete, literal, structured).
 *
 * KEEP IN SYNC: when a feature is added or changed, update its entry here.
 * See AGENTS.md "Product Guide & Docs Sync Rule".
 */

export type GuideCategory =
  | "Start here"
  | "Social"
  | "Connect"
  | "Campus life"
  | "Academics"
  | "Marketplace & living"
  | "Account & safety"
  | "Platform";

export type GuideAudience = "Students" | "Aspirants" | "Clubs" | "Merchants" | "Admins" | "Developers" | "Investors";

export interface GuideRoute {
  path: string;
  label: string;
}

export interface GuideUseCase {
  who: string;
  scenario: string;
}

export interface GuideEntry {
  slug: string;
  title: string;
  /** One sentence: what it is. */
  summary: string;
  category: GuideCategory;
  audiences: GuideAudience[];
  /** In-app pages this feature lives on. */
  routes: GuideRoute[];
  /** The intent: what problem it exists to solve. */
  purpose: string;
  /** Reasons a student would choose to use it. */
  whyUse: string[];
  /** Ordered steps, written as instructions. */
  howToUse: string[];
  useCases: GuideUseCase[];
  tips?: string[];
  /** What is visible to whom, what is stored. */
  privacy?: string[];
  /** Why it matters to the business: retention, network effects, revenue, moat. */
  investorAngle: string;
  faq: { q: string; a: string }[];
  related: string[];
  keywords: string[];
  /** Matching long-form essay at /docs/[slug], if one exists. */
  essaySlug?: string;
  /** ISO date of the last content update. */
  updated: string;
}
