import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Binary,
  BookOpen,
  Bookmark,
  Bot,
  Briefcase,
  Calendar,
  Clock,
  Cloud,
  Code2,
  Coins,
  Compass,
  Cpu,
  Dumbbell,
  Film,
  Flame,
  Gamepad2,
  GitPullRequest,
  Globe,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Layers,
  Leaf,
  Lightbulb,
  MapPin,
  MessageSquareQuote,
  Microscope,
  Music,
  Palette,
  Rocket,
  Scroll,
  ShieldCheck,
  Smartphone,
  Smile,
  Sparkles,
  Target,
  Trophy,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import type { articleCategoryEnum } from "@/db/schema/articles";

export const ARTICLES_CANONICAL_HOST = "https://campusloop.space";
export const CANONICAL_ARTICLE_HOST = ARTICLES_CANONICAL_HOST;
export const ARTICLES_TITLE = "Articles";
export const ARTICLES_SUBTITLE = "Ideas, guides & stories from students";

export type ArticleCategoryKey = (typeof articleCategoryEnum)[number];

export type ArticleCategoryGroupKey = "ALL" | "TECHNOLOGY" | "ACADEMICS" | "LIFESTYLE";

export type ArticleTone = "brand" | "reward" | "crush" | "success" | "warning" | "neutral";

/** Chip/badge utilities for a category tone. Pairs stay inside the semantic token set. */
export const ARTICLE_TONE_CLASSES: Record<ArticleTone, string> = {
  brand: "text-brand-text bg-brand-subtle border-brand-subtle-border",
  reward: "text-reward-text bg-reward-subtle border-reward/30",
  crush: "text-crush-text bg-crush-subtle border-crush/30",
  success: "text-success bg-success-subtle border-success/20",
  warning: "text-warning bg-warning-subtle border-warning/20",
  neutral: "text-fg-muted bg-surface-muted border-border",
};

export interface ArticleCategoryMeta {
  key: ArticleCategoryKey;
  slug: string;
  label: string;
  description: string;
  group: "TECHNOLOGY" | "ACADEMICS" | "LIFESTYLE" | "GENERAL";
  icon: LucideIcon;
  tone: ArticleTone;
}

export const ARTICLE_CATEGORY_GROUPS: { id: ArticleCategoryGroupKey; label: string; icon: LucideIcon }[] = [
  { id: "ALL", label: "All Categories", icon: Compass },
  { id: "TECHNOLOGY", label: "Tech & Dev", icon: Code2 },
  { id: "ACADEMICS", label: "Academics & Career", icon: GraduationCap },
  { id: "LIFESTYLE", label: "Campus & Lifestyle", icon: Sparkles },
];

export const ARTICLE_CATEGORIES: Record<ArticleCategoryKey, ArticleCategoryMeta> = {
  // Legacy / existing categories
  GENERAL: {
    key: "GENERAL",
    slug: "general",
    label: "General",
    description: "General campus thoughts, experiences, and open stories",
    group: "GENERAL",
    icon: Compass,
    tone: "neutral",
  },
  TECH_AND_CODE: {
    key: "TECH_AND_CODE",
    slug: "tech-and-code",
    label: "Tech & Code",
    description: "Software engineering, web development, systems, and algorithms",
    group: "TECHNOLOGY",
    icon: Code2,
    tone: "brand",
  },
  PLACEMENTS: {
    key: "PLACEMENTS",
    slug: "placements",
    label: "Placements & Jobs",
    description: "On-campus placement roadmaps, interview debriefs, and OA tips",
    group: "ACADEMICS",
    icon: Briefcase,
    tone: "success",
  },
  CAMPUS_LIFE: {
    key: "CAMPUS_LIFE",
    slug: "campus-life",
    label: "Campus Life & Hostel",
    description: "Hostel survival, fests, club culture, and campus memories",
    group: "LIFESTYLE",
    icon: GraduationCap,
    tone: "warning",
  },
  RESEARCH: {
    key: "RESEARCH",
    slug: "research",
    label: "Research & Science",
    description: "Academic papers, AI experiments, lab breakthroughs, and thesis",
    group: "ACADEMICS",
    icon: Microscope,
    tone: "brand",
  },
  INTERNSHIPS: {
    key: "INTERNSHIPS",
    slug: "internships",
    label: "Internships & Fellowships",
    description: "Summer internships, off-campus referrals, and cold emailing guides",
    group: "ACADEMICS",
    icon: Rocket,
    tone: "brand",
  },
  PROJECTS: {
    key: "PROJECTS",
    slug: "projects",
    label: "Projects & Showcases",
    description: "Open source builds, side projects, hackathons, and tear-downs",
    group: "TECHNOLOGY",
    icon: Layers,
    tone: "brand",
  },
  GUIDES: {
    key: "GUIDES",
    slug: "guides",
    label: "Guides",
    description: "Step-by-step practical guides, tooling, and college hacks",
    group: "GENERAL",
    icon: Lightbulb,
    tone: "success",
  },
  OPINION: {
    key: "OPINION",
    slug: "opinion",
    label: "Opinion",
    description: "Perspectives on education, tech trends, and university life",
    group: "GENERAL",
    icon: MessageSquareQuote,
    tone: "warning",
  },

  // Phase 2: Technology and Development (10)
  TECH_AND_PROGRAMMING: {
    key: "TECH_AND_PROGRAMMING",
    slug: "tech-and-programming",
    label: "Technology & Programming",
    description: "Foundational programming, software architecture, and modern developer tooling",
    group: "TECHNOLOGY",
    icon: Code2,
    tone: "brand",
  },
  AI_AND_ML: {
    key: "AI_AND_ML",
    slug: "ai-and-ml",
    label: "AI & Machine Learning",
    description: "LLMs, deep learning, PyTorch, model fine-tuning, and applied AI applications",
    group: "TECHNOLOGY",
    icon: Cpu,
    tone: "brand",
  },
  WEB_DEVELOPMENT: {
    key: "WEB_DEVELOPMENT",
    slug: "web-development",
    label: "Web Development",
    description: "Next.js, React, modern CSS, backend APIs, edge computing, and full-stack craft",
    group: "TECHNOLOGY",
    icon: Globe,
    tone: "brand",
  },
  MOBILE_DEV: {
    key: "MOBILE_DEV",
    slug: "mobile-development",
    label: "Mobile App Development",
    description: "React Native, Flutter, Swift, Kotlin, and high-performance cross-platform apps",
    group: "TECHNOLOGY",
    icon: Smartphone,
    tone: "brand",
  },
  DATA_SCIENCE: {
    key: "DATA_SCIENCE",
    slug: "data-science",
    label: "Data Science & Analytics",
    description: "Data pipelines, SQL mastery, exploratory data analysis, and predictive models",
    group: "TECHNOLOGY",
    icon: BarChart3,
    tone: "warning",
  },
  CYBERSECURITY: {
    key: "CYBERSECURITY",
    slug: "cybersecurity",
    label: "Cybersecurity & Privacy",
    description: "CTFs, ethical hacking, network defense, app sec, and digital rights",
    group: "TECHNOLOGY",
    icon: ShieldCheck,
    tone: "neutral",
  },
  CLOUD_AND_DEVOPS: {
    key: "CLOUD_AND_DEVOPS",
    slug: "cloud-and-devops",
    label: "Cloud & DevOps",
    description: "Docker, Kubernetes, AWS, Cloudflare Workers, CI/CD, and site reliability",
    group: "TECHNOLOGY",
    icon: Cloud,
    tone: "brand",
  },
  OPEN_SOURCE: {
    key: "OPEN_SOURCE",
    slug: "open-source",
    label: "Open Source",
    description: "GSoC roadmaps, first pull requests, community governance, and open collaboration",
    group: "TECHNOLOGY",
    icon: GitPullRequest,
    tone: "success",
  },
  ROBOTICS: {
    key: "ROBOTICS",
    slug: "robotics",
    label: "Electronics & Robotics",
    description: "Arduino, ESP32, ROS, embedded systems, microcontrollers, and hardware hacks",
    group: "TECHNOLOGY",
    icon: Bot,
    tone: "brand",
  },
  PRODUCT_DEV: {
    key: "PRODUCT_DEV",
    slug: "product-development",
    label: "Product Development",
    description: "Product discovery, system thinking, technical requirements, and execution",
    group: "TECHNOLOGY",
    icon: Layers,
    tone: "brand",
  },

  // Phase 2: Academics and Career (10)
  ACADEMICS: {
    key: "ACADEMICS",
    slug: "academics",
    label: "Academics & Study Materials",
    description: "Semester exam prep, PYQ debriefs, subject summaries, and high-CGPA guides",
    group: "ACADEMICS",
    icon: GraduationCap,
    tone: "warning",
  },
  DSA: {
    key: "DSA",
    slug: "dsa",
    label: "Data Structures & Algorithms",
    description: "LeetCode patterns, graph theory, DP blueprints, and time complexity deep dives",
    group: "ACADEMICS",
    icon: Binary,
    tone: "brand",
  },
  JOBS_AND_CAREER: {
    key: "JOBS_AND_CAREER",
    slug: "jobs-and-career",
    label: "Placements & Career Opportunities",
    description: "On-campus placement seasons, off-campus hiring cycles, and salary insights",
    group: "ACADEMICS",
    icon: Briefcase,
    tone: "success",
  },
  FELLOWSHIPS: {
    key: "FELLOWSHIPS",
    slug: "fellowships",
    label: "Internships & Fellowships",
    description: "Research fellowships, tech internships, stipend comparisons, and applications",
    group: "ACADEMICS",
    icon: Award,
    tone: "brand",
  },
  HACKATHONS: {
    key: "HACKATHONS",
    slug: "hackathons",
    label: "Hackathons & Competitions",
    description: "Winning hackathon playbooks, ideation templates, and team formation",
    group: "ACADEMICS",
    icon: Trophy,
    tone: "warning",
  },
  INTERVIEW_PREP: {
    key: "INTERVIEW_PREP",
    slug: "interview-prep",
    label: "Interview Preparation",
    description: "Technical mock interviews, HR rounds, behavioural prep, and coding debriefs",
    group: "ACADEMICS",
    icon: Target,
    tone: "brand",
  },
  CAREER_ADVICE: {
    key: "CAREER_ADVICE",
    slug: "career-advice",
    label: "Resume & Career Advice",
    description: "ATS-beating resumes, LinkedIn optimization, cold outreach, and portfolio audits",
    group: "ACADEMICS",
    icon: Compass,
    tone: "brand",
  },
  SCHOLARSHIPS: {
    key: "SCHOLARSHIPS",
    slug: "scholarships",
    label: "Scholarships & Grants",
    description: "Merit-cum-means scholarships, state fellowships, and study-abroad stipends",
    group: "ACADEMICS",
    icon: Scroll,
    tone: "success",
  },
  SCIENCE_AND_RESEARCH: {
    key: "SCIENCE_AND_RESEARCH",
    slug: "science-and-research",
    label: "Science & Research Papers",
    description: "Undergraduate research papers, IEEE/ACM publications, and lab findings",
    group: "ACADEMICS",
    icon: Microscope,
    tone: "brand",
  },
  STARTUPS: {
    key: "STARTUPS",
    slug: "startups",
    label: "Startups & Entrepreneurship",
    description: "Student ventures, university incubators, grant funding, and pitch decks",
    group: "ACADEMICS",
    icon: Rocket,
    tone: "warning",
  },

  // Phase 2: Lifestyle and Community (18)
  HOSTEL_LIFE: {
    key: "HOSTEL_LIFE",
    slug: "hostel-life",
    label: "Hostel Life & Campus Living",
    description: "Hostel survival guides, mess food hacks, roommates, and late-night study sessions",
    group: "LIFESTYLE",
    icon: Home,
    tone: "warning",
  },
  CLUBS: {
    key: "CLUBS",
    slug: "clubs",
    label: "Clubs & Societies",
    description: "Technical societies, cultural clubs, fest organizing committees, and club inductions",
    group: "LIFESTYLE",
    icon: Users,
    tone: "brand",
  },
  EVENTS_OPPORTUNITIES: {
    key: "EVENTS_OPPORTUNITIES",
    slug: "events-opportunities",
    label: "Events & College Fests",
    description: "Campus cultural fests, tech symposiums, speaker sessions, and workshops",
    group: "LIFESTYLE",
    icon: Calendar,
    tone: "warning",
  },
  GAMING: {
    key: "GAMING",
    slug: "gaming",
    label: "Gaming & Esports",
    description: "Valorant tournaments, BGMI scrims, LAN fests, PC builds, and collegiate leagues",
    group: "LIFESTYLE",
    icon: Gamepad2,
    tone: "brand",
  },
  MEMES: {
    key: "MEMES",
    slug: "memes",
    label: "Memes & Campus Humor",
    description: "Relatable exam season memes, college banter, and campus pop culture",
    group: "LIFESTYLE",
    icon: Smile,
    tone: "warning",
  },
  ENTERTAINMENT: {
    key: "ENTERTAINMENT",
    slug: "entertainment",
    label: "Movies, Anime & Pop Culture",
    description: "Anime watchlists, movie reviews, pop culture debates, and weekend marathons",
    group: "LIFESTYLE",
    icon: Film,
    tone: "neutral",
  },
  MUSIC_AND_ARTS: {
    key: "MUSIC_AND_ARTS",
    slug: "music-and-arts",
    label: "Music & Fine Arts",
    description: "College bands, visual arts, photography showcases, and musical jams",
    group: "LIFESTYLE",
    icon: Music,
    tone: "brand",
  },
  DESIGN: {
    key: "DESIGN",
    slug: "design",
    label: "Design & Creativity",
    description: "UI/UX casestudies, graphic design, Figma workflows, typography, and motion",
    group: "LIFESTYLE",
    icon: Palette,
    tone: "brand",
  },
  BOOKS: {
    key: "BOOKS",
    slug: "books",
    label: "Books & Literature",
    description: "Book clubs, novel recommendations, poetry, and reflective student essays",
    group: "LIFESTYLE",
    icon: BookOpen,
    tone: "success",
  },
  SPORTS_AND_FITNESS: {
    key: "SPORTS_AND_FITNESS",
    slug: "sports-and-fitness",
    label: "Sports & Athletics",
    description: "Inter-hostel sports leagues, badminton, football, cricket, and athletic meets",
    group: "LIFESTYLE",
    icon: Dumbbell,
    tone: "warning",
  },
  HEALTH: {
    key: "HEALTH",
    slug: "health",
    label: "Health & Wellbeing",
    description: "Mental health hygiene, gym nutrition, stress management, and mindfulness",
    group: "LIFESTYLE",
    icon: HeartPulse,
    tone: "success",
  },
  FINANCE: {
    key: "FINANCE",
    slug: "finance",
    label: "Personal Finance & Literacy",
    description: "Student budgeting, mutual funds, freelancing taxes, and pocket money investments",
    group: "LIFESTYLE",
    icon: Coins,
    tone: "success",
  },
  PRODUCTIVITY: {
    key: "PRODUCTIVITY",
    slug: "productivity",
    label: "Productivity & Habits",
    description: "Notion setups, time blocking, deep work systems, and semester goal setting",
    group: "LIFESTYLE",
    icon: Zap,
    tone: "warning",
  },
  TRAVEL: {
    key: "TRAVEL",
    slug: "travel",
    label: "Travel & Weekend Getaways",
    description: "Budget student trips, mountain treks, local city food walks, and road journeys",
    group: "LIFESTYLE",
    icon: MapPin,
    tone: "success",
  },
  FOOD: {
    key: "FOOD",
    slug: "food",
    label: "Food & Cooking Hacks",
    description: "Hostel electric kettle recipes, best late-night dhabas, and campus street food",
    group: "LIFESTYLE",
    icon: UtensilsCrossed,
    tone: "warning",
  },
  RELATIONSHIPS: {
    key: "RELATIONSHIPS",
    slug: "relationships",
    label: "Relationships & Social Life",
    description: "Friendships, networking, campus dating, social anxiety, and roommate diplomacy",
    group: "LIFESTYLE",
    icon: Heart,
    tone: "neutral",
  },
  SUSTAINABILITY: {
    key: "SUSTAINABILITY",
    slug: "sustainability",
    label: "Sustainability & Environment",
    description: "Green campus drives, zero-waste dorms, climate action, and renewable tech",
    group: "LIFESTYLE",
    icon: Leaf,
    tone: "success",
  },
  SHOWCASES: {
    key: "SHOWCASES",
    slug: "showcases",
    label: "Student Showcases",
    description: "Showcasing peer side projects, startup demos, artwork, and creative portfolios",
    group: "LIFESTYLE",
    icon: Sparkles,
    tone: "brand",
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
  if (!categoryKey) return ARTICLE_CATEGORIES.GENERAL;
  const upper = categoryKey.toUpperCase().replace(/-/g, "_");
  if (upper in ARTICLE_CATEGORIES) {
    return ARTICLE_CATEGORIES[upper as ArticleCategoryKey];
  }
  const matchBySlug = ARTICLE_CATEGORY_LIST.find((cat) => cat.slug === categoryKey.toLowerCase());
  if (matchBySlug) return matchBySlug;
  return ARTICLE_CATEGORIES.GENERAL;
}
