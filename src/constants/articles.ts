import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Briefcase,
  Clock,
  Code2,
  Compass,
  Cpu,
  Flame,
  GraduationCap,
  Layers,
  Lightbulb,
  MessageSquareQuote,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import type { articleCategoryEnum } from "@/db/schema/articles";

export const ARTICLES_CANONICAL_HOST = "https://campsy.app";
export const ARTICLES_TITLE = "Articles";
export const ARTICLES_SUBTITLE = "Ideas, guides & stories from students";

export type ArticleCategoryKey = (typeof articleCategoryEnum)[number];

export interface ArticleCategoryMeta {
  key: ArticleCategoryKey;
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
}

export const ARTICLE_CATEGORIES: Record<ArticleCategoryKey, ArticleCategoryMeta> = {
  GENERAL: {
    key: "GENERAL",
    label: "General",
    description: "General campus thoughts, experiences, and open stories",
    icon: Compass,
    colorClass: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  },
  TECH_AND_CODE: {
    key: "TECH_AND_CODE",
    label: "Tech & Code",
    description: "Software engineering, web development, systems, and algorithms",
    icon: Code2,
    colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  },
  PLACEMENTS: {
    key: "PLACEMENTS",
    label: "Placements",
    description: "On-campus placement roadmaps, interview debriefs, and OA tips",
    icon: Briefcase,
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  CAMPUS_LIFE: {
    key: "CAMPUS_LIFE",
    label: "Campus Life",
    description: "Hostel survival, fests, club culture, and campus memories",
    icon: GraduationCap,
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  RESEARCH: {
    key: "RESEARCH",
    label: "Research",
    description: "Academic papers, AI experiments, lab breakthroughs, and thesis",
    icon: Cpu,
    colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  INTERNSHIPS: {
    key: "INTERNSHIPS",
    label: "Internships",
    description: "Summer internships, off-campus referrals, and cold emailing guides",
    icon: Rocket,
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  PROJECTS: {
    key: "PROJECTS",
    label: "Projects",
    description: "Open source builds, side projects, hackathons, and tear-downs",
    icon: Layers,
    colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  GUIDES: {
    key: "GUIDES",
    label: "Guides",
    description: "Step-by-step practical guides, tooling, and college hacks",
    icon: Lightbulb,
    colorClass: "text-teal-500 bg-teal-500/10 border-teal-500/20",
  },
  OPINION: {
    key: "OPINION",
    label: "Opinion",
    description: "Perspectives on education, tech trends, and university life",
    icon: MessageSquareQuote,
    colorClass: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },
};

export const ARTICLE_CATEGORY_LIST = Object.values(ARTICLE_CATEGORIES);

export type ArticleFeedTab = "for_you" | "latest" | "trending" | "following" | "saved";

export interface FeedTabMeta {
  id: ArticleFeedTab;
  label: string;
  icon: LucideIcon;
  authRequired?: boolean;
}

export const ARTICLE_FEED_TABS: FeedTabMeta[] = [
  { id: "for_you", label: "For You", icon: Sparkles },
  { id: "latest", label: "Latest", icon: Clock },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "following", label: "Following", icon: Users, authRequired: true },
  { id: "saved", label: "Saved", icon: Bookmark, authRequired: true },
];

export const ARTICLE_SORT_OPTIONS = [
  { id: "latest", label: "Latest First" },
  { id: "trending", label: "Trending Now" },
  { id: "popular", label: "Most Upvoted" },
] as const;

export function getCategoryMeta(categoryKey?: string | null): ArticleCategoryMeta {
  if (categoryKey && categoryKey in ARTICLE_CATEGORIES) {
    return ARTICLE_CATEGORIES[categoryKey as ArticleCategoryKey];
  }
  return ARTICLE_CATEGORIES.GENERAL;
}
