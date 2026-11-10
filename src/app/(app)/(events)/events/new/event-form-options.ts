import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Cloud,
  Code2,
  Coffee,
  Compass,
  Flame,
  Gift,
  Globe,
  Laptop,
  Link2,
  Lock,
  type LucideIcon,
  Mic,
  Palette,
  Sparkles,
  Trophy,
  User,
  UserPlus,
  Users,
  Users2,
} from "lucide-react";

export interface FormOption<T extends string = string> {
  value: T;
  label: string;
  desc: string;
  icon: LucideIcon;
}

export const EVENT_TYPES: FormOption[] = [
  { value: "HACKATHON", label: "Hackathon", desc: "Build something, demo it", icon: Code2 },
  { value: "WORKSHOP", label: "Workshop", desc: "Learn by doing", icon: BookOpen },
  { value: "FEST", label: "College fest", desc: "Cultural, tech or sports fest", icon: Sparkles },
  { value: "COMPETITION", label: "Competition", desc: "Quizzes, debates, case studies", icon: Trophy },
  { value: "SEMINAR", label: "Talk", desc: "Guest lectures and alumni talks", icon: Mic },
  { value: "MEETUP", label: "Meetup", desc: "Casual hangouts", icon: Users },
  { value: "CULTURAL", label: "Cultural", desc: "Music, dance, drama, photos", icon: Palette },
  { value: "SPORTS", label: "Sports or esports", desc: "Matches and gaming", icon: Flame },
];

export const MODES: FormOption[] = [
  { value: "OFFLINE", label: "In person", desc: "At a place on campus", icon: Building2 },
  { value: "ONLINE", label: "Online", desc: "Meet, Zoom or Discord", icon: Globe },
  { value: "HYBRID", label: "Both", desc: "On campus and streamed", icon: Laptop },
];

export const PARTICIPATION_TYPES: FormOption[] = [
  { value: "SOLO", label: "Solo", desc: "Everyone signs up alone", icon: User },
  { value: "TEAM", label: "Teams", desc: "Sign up as a team", icon: Users2 },
  { value: "BOTH", label: "Solo or team", desc: "Either works", icon: UserPlus },
];

export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export const VISIBILITY_OPTIONS: FormOption<Visibility>[] = [
  { value: "PUBLIC", label: "Public", desc: "Shows in Events and search", icon: Globe },
  { value: "UNLISTED", label: "Unlisted", desc: "Only people with the link", icon: Link2 },
  { value: "PRIVATE", label: "My college", desc: "Only students from your college", icon: Lock },
];

export const AUDIENCE_OPTIONS: FormOption<"ALL" | "MINE">[] = [
  { value: "ALL", label: "All colleges", desc: "Any student can join", icon: Globe },
  { value: "MINE", label: "Only my college", desc: "Students from your college", icon: Building2 },
];

const PATTERN = (style: string, seed: string, bg: string) =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${bg}`;

export const PRESET_BANNERS = [
  { label: "Hackathon", url: PATTERN("shapes", "hackathon-neon-grid", "0f172a,1e1b4b") },
  { label: "Fest", url: PATTERN("shapes", "vibrant-campus-fest", "7c2d12,831843") },
  { label: "Workshop", url: PATTERN("identicon", "tech-workshop-code", "0284c7,0f766e") },
  { label: "Esports", url: PATTERN("shapes", "gaming-esports-arena", "312e81,581c87") },
];

const PATTERN_BACKGROUNDS = [
  "0f172a,1e1b4b",
  "312e81,581c87",
  "0284c7,0f766e",
  "7c2d12,831843",
  "042f2e,14532d",
];

export function randomPatternUrl(): string {
  const style = Math.random() < 0.5 ? "shapes" : "identicon";
  const seed = Math.random().toString(36).substring(2, 10);
  const bg = PATTERN_BACKGROUNDS[Math.floor(Math.random() * PATTERN_BACKGROUNDS.length)];
  return PATTERN(style, seed, bg);
}

export const VENUE_SUGGESTIONS = ["Main auditorium", "Seminar hall", "Computer lab", "Open-air theatre"];

export const SUGGESTED_PERKS: { label: string; icon: LucideIcon }[] = [
  { label: "Certificates", icon: Award },
  { label: "Cash prizes", icon: Trophy },
  { label: "Free food", icon: Coffee },
  { label: "Stickers and swag", icon: Gift },
  { label: "Cloud credits", icon: Cloud },
  { label: "Internship referrals", icon: Briefcase },
  { label: "Mentoring", icon: Compass },
];

export const DESCRIPTION_TEMPLATE = `## What it is

Say what happens at the event and who it is for.

## Schedule

| Time | What |
| --- | --- |
| 10:00 AM | Welcome |
| 12:30 PM | Lunch |
| 04:00 PM | Demos |
| 06:00 PM | Results |

## Rules

1. Bring your college ID.
2. Teams of 1 to 4.

## How winners are picked

- Write your judging criteria here.
`;

export interface EventFormState {
  title: string;
  tagline: string;
  clubName: string;
  description: string;
  bannerUrl: string;
  eventType: string;
  mode: string;
  venue: string;
  meetingUrl: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  participationType: string;
  minTeamSize: string;
  maxTeamSize: string;
  maxParticipants: string;
  isPaid: boolean;
  entryFee: string;
  prizesDescription: string;
  perks: string[];
  loopPointsReward: string;
  isAllColleges: boolean;
  visibility: Visibility;
}

export const INITIAL_FORM: EventFormState = {
  title: "",
  tagline: "",
  clubName: "",
  description: "",
  bannerUrl: "",
  eventType: "HACKATHON",
  mode: "OFFLINE",
  venue: "",
  meetingUrl: "",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  participationType: "SOLO",
  minTeamSize: "1",
  maxTeamSize: "4",
  maxParticipants: "",
  isPaid: false,
  entryFee: "",
  prizesDescription: "",
  perks: [],
  loopPointsReward: "30",
  isAllColleges: true,
  visibility: "PUBLIC",
};

export type SetField = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) => void;

export interface FormSectionProps {
  form: EventFormState;
  set: SetField;
  isExternal: boolean;
}

/** Reads a saved draft back, keeping only keys whose type still matches. */
export function restoreDraft(raw: string | null): Partial<EventFormState> | null {
  if (!raw) return null;
  const saved = JSON.parse(raw) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, initial] of Object.entries(INITIAL_FORM)) {
    const value = saved[key];
    if (Array.isArray(initial) ? Array.isArray(value) : typeof value === typeof initial) out[key] = value;
  }
  return out as Partial<EventFormState>;
}

export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
