/**
 * CampusLoop Streaks & Daily Missions Constants
 * Authoritative constants driving streak qualification, milestone tiers, and daily mission rotations.
 */

export const DEFAULT_STREAK_TIMEZONE = "Asia/Kolkata";

export const STREAK_QUALIFYING_EVENTS = {
  POST_CREATE: {
    key: "POST_CREATE",
    label: "Created a post or confession",
    description: "Shared a post, question or confession",
    pointsBonus: 5,
  },
  POLL_VOTE: {
    key: "POLL_VOTE",
    label: "Voted in a campus poll",
    description: "Voted in a poll",
    pointsBonus: 2,
  },
  COMMENT_CREATE: {
    key: "COMMENT_CREATE",
    label: "Commented on a discussion",
    description: "Replied to a post",
    pointsBonus: 3,
  },
  ACADEMIC_UPLOAD: {
    key: "ACADEMIC_UPLOAD",
    label: "Uploaded verified study notes",
    description: "Shared notes, PYQs or formula sheets",
    pointsBonus: 30,
  },
  ACADEMIC_BOOKMARK: {
    key: "ACADEMIC_BOOKMARK",
    label: "Saved a semester study pack",
    description: "Saved notes for your semester",
    pointsBonus: 5,
  },
  COMMUNITY_JOIN: {
    key: "COMMUNITY_JOIN",
    label: "Joined a campus club",
    description: "Joined a club or tech chapter",
    pointsBonus: 5,
  },
  EVENT_RSVP: {
    key: "EVENT_RSVP",
    label: "Registered for a campus event",
    description: "Signed up for a hackathon, fest or workshop",
    pointsBonus: 10,
  },
  UTILITY_LIST: {
    key: "UTILITY_LIST",
    label: "Listed on Campus Living",
    description: "Listed a book, cycle, room, lost item or ride",
    pointsBonus: 15,
  },
  DAILY_MISSION_COMPLETE: {
    key: "DAILY_MISSION_COMPLETE",
    label: "Finished today's task",
    description: "Did the task of the day",
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
    description: "3 days in a row",
  },
  {
    days: 7,
    points: 25,
    title: "One-Week Run",
    badge: "Flame",
    iconName: "Flame",
    description: "7 days in a row",
  },
  {
    days: 14,
    points: 50,
    title: "Two-Week Habit",
    badge: "Zap",
    iconName: "Zap",
    description: "14 days in a row",
  },
  {
    days: 30,
    points: 100,
    title: "Campus Regular",
    badge: "Star",
    iconName: "Star",
    description: "30 days in a row",
  },
  {
    days: 60,
    points: 150,
    title: "Term Pioneer",
    badge: "Award",
    iconName: "Award",
    description: "60 days in a row",
  },
  {
    days: 100,
    points: 250,
    title: "Century Legend",
    badge: "Crown",
    iconName: "Crown",
    description: "100 days in a row",
  },
  {
    days: 180,
    points: 500,
    title: "Semester Pillar",
    badge: "Trophy",
    iconName: "Trophy",
    description: "180 days in a row, about one semester",
  },
  {
    days: 365,
    points: 1000,
    title: "Campus Immortal",
    badge: "Trophy",
    iconName: "Trophy",
    description: "365 days in a row",
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
    title: "Save a note",
    instruction: "Save a note or question paper for your branch.",
    ctaLabel: "Open study material",
    ctaHref: "/academics",
    qualifyingEvent: "ACADEMIC_BOOKMARK",
  },
  {
    dayOfWeek: 1, // Monday
    title: "Post something",
    instruction: "Post a question, confession or poll for your college.",
    ctaLabel: "Write a post",
    ctaHref: "/post/new",
    qualifyingEvent: "POST_CREATE",
  },
  {
    dayOfWeek: 2, // Tuesday
    title: "Vote in a poll",
    instruction: "Vote in a poll and see what others picked.",
    ctaLabel: "See polls",
    ctaHref: "/feeds?type=POLL",
    qualifyingEvent: "POLL_VOTE",
  },
  {
    dayOfWeek: 3, // Wednesday
    title: "Leave a comment",
    instruction: "Reply to a classmate's post.",
    ctaLabel: "Open feed",
    ctaHref: "/feeds",
    qualifyingEvent: "COMMENT_CREATE",
  },
  {
    dayOfWeek: 4, // Thursday
    title: "Join a community",
    instruction: "Join a club, tech chapter or branch group.",
    ctaLabel: "See communities",
    ctaHref: "/communities",
    qualifyingEvent: "COMMUNITY_JOIN",
  },
  {
    dayOfWeek: 5, // Friday
    title: "Sign up for an event",
    instruction: "Register for a hackathon, fest or workshop.",
    ctaLabel: "See events",
    ctaHref: "/events",
    qualifyingEvent: "EVENT_RSVP",
  },
  {
    dayOfWeek: 6, // Saturday
    title: "List something",
    instruction: "List an item on Buy and sell, Housing, Lost and found or Ride share.",
    ctaLabel: "Open Living",
    ctaHref: "/living",
    qualifyingEvent: "UTILITY_LIST",
  },
];

export function getTodayDailyMission(date = new Date()): DailyMissionTemplate {
  const day = date.getDay();
  return DAILY_MISSION_SCHEDULE.find((m) => m.dayOfWeek === day) || DAILY_MISSION_SCHEDULE[1];
}
