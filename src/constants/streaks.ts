/**
 * CampusLoop Streaks & Daily Missions Constants
 * Authoritative constants driving streak qualification, milestone tiers, and daily mission rotations.
 */

export const DEFAULT_STREAK_TIMEZONE = "Asia/Kolkata";

export const STREAK_QUALIFYING_EVENTS = {
  POST_CREATE: {
    key: "POST_CREATE",
    label: "Created a post or confession",
    description: "Shared an authentic update, question, or confession with your campus",
    pointsBonus: 5,
  },
  POLL_VOTE: {
    key: "POLL_VOTE",
    label: "Voted in a campus poll",
    description: "Participated in a live student poll",
    pointsBonus: 2,
  },
  COMMENT_CREATE: {
    key: "COMMENT_CREATE",
    label: "Commented on a discussion",
    description: "Added a constructive reply or answer for peers",
    pointsBonus: 3,
  },
  ACADEMIC_UPLOAD: {
    key: "ACADEMIC_UPLOAD",
    label: "Uploaded verified study notes",
    description: "Helped batchmates by sharing notes, PYQs, or formula sheets",
    pointsBonus: 30,
  },
  ACADEMIC_BOOKMARK: {
    key: "ACADEMIC_BOOKMARK",
    label: "Saved a semester study pack",
    description: "Bookmarked syllabus-aligned notes to your semester locker",
    pointsBonus: 5,
  },
  COMMUNITY_JOIN: {
    key: "COMMUNITY_JOIN",
    label: "Joined a campus club",
    description: "Became a member of a student society or tech chapter",
    pointsBonus: 5,
  },
  EVENT_RSVP: {
    key: "EVENT_RSVP",
    label: "Registered for a campus event",
    description: "Signed up for an upcoming hackathon, fest, or workshop",
    pointsBonus: 10,
  },
  UTILITY_LIST: {
    key: "UTILITY_LIST",
    label: "Listed on Campus Living",
    description: "Listed a book, bicycle, room, lost item, or ride share",
    pointsBonus: 15,
  },
  DAILY_MISSION_COMPLETE: {
    key: "DAILY_MISSION_COMPLETE",
    label: "Completed Daily Campus Mission",
    description: "Finished today's featured campus mission",
    pointsBonus: 10,
  },
} as const;

export type StreakEventType = keyof typeof STREAK_QUALIFYING_EVENTS;

export interface StreakMilestone {
  days: number;
  points: number;
  title: string;
  badge: string;
  iconName: "Seedling" | "Flame" | "Zap" | "Star" | "Award" | "Crown" | "Trophy" | "Sparkles";
  description: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 3,
    points: 15,
    title: "Loop Starter",
    badge: "Seedling",
    iconName: "Seedling",
    description: "First 3 consecutive days on campus",
  },
  {
    days: 7,
    points: 25,
    title: "One-Week Run",
    badge: "Flame",
    iconName: "Flame",
    description: "A full week of active participation",
  },
  {
    days: 14,
    points: 50,
    title: "Two-Week Habit",
    badge: "Zap",
    iconName: "Zap",
    description: "Consistent 14 days keeping the loop alive",
  },
  {
    days: 30,
    points: 100,
    title: "Campus Regular",
    badge: "Star",
    iconName: "Star",
    description: "30-day powerhouse campus student",
  },
  {
    days: 60,
    points: 150,
    title: "Term Pioneer",
    badge: "Award",
    iconName: "Award",
    description: "Two straight months active in your college loop",
  },
  {
    days: 100,
    points: 250,
    title: "Century Legend",
    badge: "Crown",
    iconName: "Crown",
    description: "Triple digits! Official campus institution",
  },
  {
    days: 180,
    points: 500,
    title: "Semester Pillar",
    badge: "Trophy",
    iconName: "Trophy",
    description: "Carried your campus through an entire academic semester",
  },
  {
    days: 365,
    points: 1000,
    title: "Campus Immortal",
    badge: "Sparkles",
    iconName: "Sparkles",
    description: "One complete academic year of daily campus leadership",
  },
];

export interface DailyMissionTemplate {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  title: string;
  instruction: string;
  ctaLabel: string;
  ctaHref: string;
  qualifyingEvent: StreakEventType;
}

export const DAILY_MISSION_SCHEDULE: DailyMissionTemplate[] = [
  {
    dayOfWeek: 0, // Sunday
    title: "Sunday Prep: Study Vault",
    instruction: "Save or star a semester note or question paper for your branch.",
    ctaLabel: "Open Academics",
    ctaHref: "/academics",
    qualifyingEvent: "ACADEMIC_BOOKMARK",
  },
  {
    dayOfWeek: 1, // Monday
    title: "Monday Pulse: Campus Update",
    instruction: "Post a question, confession, or poll on your campus timeline.",
    ctaLabel: "Write Post",
    ctaHref: "/post/new",
    qualifyingEvent: "POST_CREATE",
  },
  {
    dayOfWeek: 2, // Tuesday
    title: "Tuesday Voice: Cast Your Vote",
    instruction: "Vote in a campus poll and see what your peers think.",
    ctaLabel: "Browse Polls",
    ctaHref: "/feeds?type=POLL",
    qualifyingEvent: "POLL_VOTE",
  },
  {
    dayOfWeek: 3, // Wednesday
    title: "Wednesday Connect: Add Your Voice",
    instruction: "Reply or leave a helpful comment on a classmate's post.",
    ctaLabel: "Open Feed",
    ctaHref: "/feeds",
    qualifyingEvent: "COMMENT_CREATE",
  },
  {
    dayOfWeek: 4, // Thursday
    title: "Thursday Circle: Join a Community",
    instruction: "Discover a student club, tech chapter, or branch community.",
    ctaLabel: "Explore Clubs",
    ctaHref: "/communities",
    qualifyingEvent: "COMMUNITY_JOIN",
  },
  {
    dayOfWeek: 5, // Friday
    title: "Friday Plans: Find an Event",
    instruction: "Browse upcoming college hackathons, fests, or workshops.",
    ctaLabel: "Explore Events",
    ctaHref: "/events",
    qualifyingEvent: "EVENT_RSVP",
  },
  {
    dayOfWeek: 6, // Saturday
    title: "Saturday Loop: Campus Living",
    instruction: "Check out Buy & Sell, Housing, Lost & Found, or Ride Share.",
    ctaLabel: "Open Living Hub",
    ctaHref: "/living",
    qualifyingEvent: "UTILITY_LIST",
  },
];

export function getTodayDailyMission(date = new Date()): DailyMissionTemplate {
  const day = date.getDay();
  return DAILY_MISSION_SCHEDULE.find((m) => m.dayOfWeek === day) || DAILY_MISSION_SCHEDULE[1];
}
