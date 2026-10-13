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

export interface ArticleCategoryMeta {
  key: ArticleCategoryKey;
  slug: string;
  label: string;
  description: string;
  group: "TECHNOLOGY" | "ACADEMICS" | "LIFESTYLE" | "GENERAL";
  icon: LucideIcon;
  colorClass: string;
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
    colorClass: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  },
  TECH_AND_CODE: {
    key: "TECH_AND_CODE",
    slug: "tech-and-code",
    label: "Tech & Code",
    description: "Software engineering, web development, systems, and algorithms",
    group: "TECHNOLOGY",
    icon: Code2,
    colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  },
  PLACEMENTS: {
    key: "PLACEMENTS",
    slug: "placements",
    label: "Placements & Jobs",
    description: "On-campus placement roadmaps, interview debriefs, and OA tips",
    group: "ACADEMICS",
    icon: Briefcase,
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  CAMPUS_LIFE: {
    key: "CAMPUS_LIFE",
    slug: "campus-life",
    label: "Campus Life & Hostel",
    description: "Hostel survival, fests, club culture, and campus memories",
    group: "LIFESTYLE",
    icon: GraduationCap,
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  RESEARCH: {
    key: "RESEARCH",
    slug: "research",
    label: "Research & Science",
    description: "Academic papers, AI experiments, lab breakthroughs, and thesis",
    group: "ACADEMICS",
    icon: Microscope,
    colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  INTERNSHIPS: {
    key: "INTERNSHIPS",
    slug: "internships",
    label: "Internships & Fellowships",
    description: "Summer internships, off-campus referrals, and cold emailing guides",
    group: "ACADEMICS",
    icon: Rocket,
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  PROJECTS: {
    key: "PROJECTS",
    slug: "projects",
    label: "Projects & Showcases",
    description: "Open source builds, side projects, hackathons, and tear-downs",
    group: "TECHNOLOGY",
    icon: Layers,
    colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  GUIDES: {
    key: "GUIDES",
    slug: "guides",
    label: "Guides",
    description: "Step-by-step practical guides, tooling, and college hacks",
    group: "GENERAL",
    icon: Lightbulb,
    colorClass: "text-teal-500 bg-teal-500/10 border-teal-500/20",
  },
  OPINION: {
    key: "OPINION",
    slug: "opinion",
    label: "Opinion",
    description: "Perspectives on education, tech trends, and university life",
    group: "GENERAL",
    icon: MessageSquareQuote,
    colorClass: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },

  // Phase 2: Technology and Development (10)
  TECH_AND_PROGRAMMING: {
    key: "TECH_AND_PROGRAMMING",
    slug: "tech-and-programming",
    label: "Technology & Programming",
    description: "Foundational programming, software architecture, and modern developer tooling",
    group: "TECHNOLOGY",
    icon: Code2,
    colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  AI_AND_ML: {
    key: "AI_AND_ML",
    slug: "ai-and-ml",
    label: "AI & Machine Learning",
    description: "LLMs, deep learning, PyTorch, model fine-tuning, and applied AI applications",
    group: "TECHNOLOGY",
    icon: Cpu,
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  WEB_DEVELOPMENT: {
    key: "WEB_DEVELOPMENT",
    slug: "web-development",
    label: "Web Development",
    description: "Next.js, React, modern CSS, backend APIs, edge computing, and full-stack craft",
    group: "TECHNOLOGY",
    icon: Globe,
    colorClass: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  },
  MOBILE_DEV: {
    key: "MOBILE_DEV",
    slug: "mobile-development",
    label: "Mobile App Development",
    description: "React Native, Flutter, Swift, Kotlin, and high-performance cross-platform apps",
    group: "TECHNOLOGY",
    icon: Smartphone,
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  DATA_SCIENCE: {
    key: "DATA_SCIENCE",
    slug: "data-science",
    label: "Data Science & Analytics",
    description: "Data pipelines, SQL mastery, exploratory data analysis, and predictive models",
    group: "TECHNOLOGY",
    icon: BarChart3,
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  CYBERSECURITY: {
    key: "CYBERSECURITY",
    slug: "cybersecurity",
    label: "Cybersecurity & Privacy",
    description: "CTFs, ethical hacking, network defense, app sec, and digital rights",
    group: "TECHNOLOGY",
    icon: ShieldCheck,
    colorClass: "text-red-500 bg-red-500/10 border-red-500/20",
  },
  CLOUD_AND_DEVOPS: {
    key: "CLOUD_AND_DEVOPS",
    slug: "cloud-and-devops",
    label: "Cloud & DevOps",
    description: "Docker, Kubernetes, AWS, Cloudflare Workers, CI/CD, and site reliability",
    group: "TECHNOLOGY",
    icon: Cloud,
    colorClass: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  },
  OPEN_SOURCE: {
    key: "OPEN_SOURCE",
    slug: "open-source",
    label: "Open Source",
    description: "GSoC roadmaps, first pull requests, community governance, and open collaboration",
    group: "TECHNOLOGY",
    icon: GitPullRequest,
    colorClass: "text-green-500 bg-green-500/10 border-green-500/20",
  },
  ROBOTICS: {
    key: "ROBOTICS",
    slug: "robotics",
    label: "Electronics & Robotics",
    description: "Arduino, ESP32, ROS, embedded systems, microcontrollers, and hardware hacks",
    group: "TECHNOLOGY",
    icon: Bot,
    colorClass: "text-teal-500 bg-teal-500/10 border-teal-500/20",
  },
  PRODUCT_DEV: {
    key: "PRODUCT_DEV",
    slug: "product-development",
    label: "Product Development",
    description: "Product discovery, system thinking, technical requirements, and execution",
    group: "TECHNOLOGY",
    icon: Layers,
    colorClass: "text-violet-500 bg-violet-500/10 border-violet-500/20",
  },

  // Phase 2: Academics and Career (10)
  ACADEMICS: {
    key: "ACADEMICS",
    slug: "academics",
    label: "Academics & Study Materials",
    description: "Semester exam prep, PYQ debriefs, subject summaries, and high-CGPA guides",
    group: "ACADEMICS",
    icon: GraduationCap,
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  DSA: {
    key: "DSA",
    slug: "dsa",
    label: "Data Structures & Algorithms",
    description: "LeetCode patterns, graph theory, DP blueprints, and time complexity deep dives",
    group: "ACADEMICS",
    icon: Binary,
    colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  },
  JOBS_AND_CAREER: {
    key: "JOBS_AND_CAREER",
    slug: "jobs-and-career",
    label: "Placements & Career Opportunities",
    description: "On-campus placement seasons, off-campus hiring cycles, and salary insights",
    group: "ACADEMICS",
    icon: Briefcase,
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  FELLOWSHIPS: {
    key: "FELLOWSHIPS",
    slug: "fellowships",
    label: "Internships & Fellowships",
    description: "Research fellowships, tech internships, stipend comparisons, and applications",
    group: "ACADEMICS",
    icon: Award,
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  HACKATHONS: {
    key: "HACKATHONS",
    slug: "hackathons",
    label: "Hackathons & Competitions",
    description: "Winning hackathon playbooks, ideation templates, and team formation",
    group: "ACADEMICS",
    icon: Trophy,
    colorClass: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  },
  INTERVIEW_PREP: {
    key: "INTERVIEW_PREP",
    slug: "interview-prep",
    label: "Interview Preparation",
    description: "Technical mock interviews, HR rounds, behavioural prep, and coding debriefs",
    group: "ACADEMICS",
    icon: Target,
    colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  CAREER_ADVICE: {
    key: "CAREER_ADVICE",
    slug: "career-advice",
    label: "Resume & Career Advice",
    description: "ATS-beating resumes, LinkedIn optimization, cold outreach, and portfolio audits",
    group: "ACADEMICS",
    icon: Compass,
    colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  SCHOLARSHIPS: {
    key: "SCHOLARSHIPS",
    slug: "scholarships",
    label: "Scholarships & Grants",
    description: "Merit-cum-means scholarships, state fellowships, and study-abroad stipends",
    group: "ACADEMICS",
    icon: Scroll,
    colorClass: "text-teal-500 bg-teal-500/10 border-teal-500/20",
  },
  SCIENCE_AND_RESEARCH: {
    key: "SCIENCE_AND_RESEARCH",
    slug: "science-and-research",
    label: "Science & Research Papers",
    description: "Undergraduate research papers, IEEE/ACM publications, and lab findings",
    group: "ACADEMICS",
    icon: Microscope,
    colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  },
  STARTUPS: {
    key: "STARTUPS",
    slug: "startups",
    label: "Startups & Entrepreneurship",
    description: "Student ventures, university incubators, grant funding, and pitch decks",
    group: "ACADEMICS",
    icon: Rocket,
    colorClass: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },

  // Phase 2: Lifestyle and Community (18)
  HOSTEL_LIFE: {
    key: "HOSTEL_LIFE",
    slug: "hostel-life",
    label: "Hostel Life & Campus Living",
    description: "Hostel survival guides, mess food hacks, roommates, and late-night study sessions",
    group: "LIFESTYLE",
    icon: Home,
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  CLUBS: {
    key: "CLUBS",
    slug: "clubs",
    label: "Clubs & Societies",
    description: "Technical societies, cultural clubs, fest organizing committees, and club inductions",
    group: "LIFESTYLE",
    icon: Users,
    colorClass: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  },
  EVENTS_OPPORTUNITIES: {
    key: "EVENTS_OPPORTUNITIES",
    slug: "events-opportunities",
    label: "Events & College Fests",
    description: "Campus cultural fests, tech symposiums, speaker sessions, and workshops",
    group: "LIFESTYLE",
    icon: Calendar,
    colorClass: "text-pink-500 bg-pink-500/10 border-pink-500/20",
  },
  GAMING: {
    key: "GAMING",
    slug: "gaming",
    label: "Gaming & Esports",
    description: "Valorant tournaments, BGMI scrims, LAN fests, PC builds, and collegiate leagues",
    group: "LIFESTYLE",
    icon: Gamepad2,
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  MEMES: {
    key: "MEMES",
    slug: "memes",
    label: "Memes & Campus Humor",
    description: "Relatable exam season memes, college banter, and campus pop culture",
    group: "LIFESTYLE",
    icon: Smile,
    colorClass: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  },
  ENTERTAINMENT: {
    key: "ENTERTAINMENT",
    slug: "entertainment",
    label: "Movies, Anime & Pop Culture",
    description: "Anime watchlists, movie reviews, pop culture debates, and weekend marathons",
    group: "LIFESTYLE",
    icon: Film,
    colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  MUSIC_AND_ARTS: {
    key: "MUSIC_AND_ARTS",
    slug: "music-and-arts",
    label: "Music & Fine Arts",
    description: "College bands, visual arts, photography showcases, and musical jams",
    group: "LIFESTYLE",
    icon: Music,
    colorClass: "text-violet-500 bg-violet-500/10 border-violet-500/20",
  },
  DESIGN: {
    key: "DESIGN",
    slug: "design",
    label: "Design & Creativity",
    description: "UI/UX casestudies, graphic design, Figma workflows, typography, and motion",
    group: "LIFESTYLE",
    icon: Palette,
    colorClass: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
  },
  BOOKS: {
    key: "BOOKS",
    slug: "books",
    label: "Books & Literature",
    description: "Book clubs, novel recommendations, poetry, and reflective student essays",
    group: "LIFESTYLE",
    icon: BookOpen,
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  SPORTS_AND_FITNESS: {
    key: "SPORTS_AND_FITNESS",
    slug: "sports-and-fitness",
    label: "Sports & Athletics",
    description: "Inter-hostel sports leagues, badminton, football, cricket, and athletic meets",
    group: "LIFESTYLE",
    icon: Dumbbell,
    colorClass: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },
  HEALTH: {
    key: "HEALTH",
    slug: "health",
    label: "Health & Wellbeing",
    description: "Mental health hygiene, gym nutrition, stress management, and mindfulness",
    group: "LIFESTYLE",
    icon: HeartPulse,
    colorClass: "text-red-500 bg-red-500/10 border-red-500/20",
  },
  FINANCE: {
    key: "FINANCE",
    slug: "finance",
    label: "Personal Finance & Literacy",
    description: "Student budgeting, mutual funds, freelancing taxes, and pocket money investments",
    group: "LIFESTYLE",
    icon: Coins,
    colorClass: "text-green-500 bg-green-500/10 border-green-500/20",
  },
  PRODUCTIVITY: {
    key: "PRODUCTIVITY",
    slug: "productivity",
    label: "Productivity & Habits",
    description: "Notion setups, time blocking, deep work systems, and semester goal setting",
    group: "LIFESTYLE",
    icon: Zap,
    colorClass: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  },
  TRAVEL: {
    key: "TRAVEL",
    slug: "travel",
    label: "Travel & Weekend Getaways",
    description: "Budget student trips, mountain treks, local city food walks, and road journeys",
    group: "LIFESTYLE",
    icon: MapPin,
    colorClass: "text-teal-500 bg-teal-500/10 border-teal-500/20",
  },
  FOOD: {
    key: "FOOD",
    slug: "food",
    label: "Food & Cooking Hacks",
    description: "Hostel electric kettle recipes, best late-night dhabas, and campus street food",
    group: "LIFESTYLE",
    icon: UtensilsCrossed,
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  RELATIONSHIPS: {
    key: "RELATIONSHIPS",
    slug: "relationships",
    label: "Relationships & Social Life",
    description: "Friendships, networking, campus dating, social anxiety, and roommate diplomacy",
    group: "LIFESTYLE",
    icon: Heart,
    colorClass: "text-pink-500 bg-pink-500/10 border-pink-500/20",
  },
  SUSTAINABILITY: {
    key: "SUSTAINABILITY",
    slug: "sustainability",
    label: "Sustainability & Environment",
    description: "Green campus drives, zero-waste dorms, climate action, and renewable tech",
    group: "LIFESTYLE",
    icon: Leaf,
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  SHOWCASES: {
    key: "SHOWCASES",
    slug: "showcases",
    label: "Student Showcases",
    description: "Showcasing peer side projects, startup demos, artwork, and creative portfolios",
    group: "LIFESTYLE",
    icon: Sparkles,
    colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
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
