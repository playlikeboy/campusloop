import { BookOpen, Car, Gamepad2, Home, PackageSearch, ShoppingBag } from "lucide-react";
import type { DedicatedHubType } from "@/components/communities/hub-types";
import type { ComboboxOption } from "@/components/ui/searchable-combobox";

export const HUB_CATEGORIES: Array<{
  id: DedicatedHubType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}> = [
  { id: "lost_found", label: "Lost & found", icon: PackageSearch, href: "/lost-and-found" },
  { id: "marketplace", label: "Buy & sell", icon: ShoppingBag, href: "/buy-and-sell" },
  { id: "gaming", label: "Gaming", icon: Gamepad2, href: "/gaming" },
  { id: "rideshare", label: "Ride share", icon: Car, href: "/rideshare" },
  { id: "housing", label: "Rooms & flats", icon: Home, href: "/housing" },
  { id: "academics", label: "Notes", icon: BookOpen, href: "/academics" },
];

export const CONDITION_OPTIONS: ComboboxOption[] = [
  { value: "NEW", label: "New or like new" },
  { value: "GOOD", label: "Good, lightly used" },
  { value: "FAIR", label: "Used, works fine" },
];

export const GAME_OPTIONS: ComboboxOption[] = [
  { value: "Valorant", label: "Valorant" },
  { value: "BGMI", label: "BGMI / PUBG Mobile" },
  { value: "CS2", label: "Counter-Strike 2" },
  { value: "Dota 2", label: "Dota 2" },
  { value: "FIFA", label: "EA Sports FC / FIFA" },
  { value: "Chess", label: "Chess.com" },
];

export const GAMING_MODE_OPTIONS = [
  { value: "5v5 Competitive", label: "Ranked" },
  { value: "Casual", label: "Casual" },
  { value: "Scrim", label: "Scrim" },
  { value: "Tournament", label: "Tournament" },
];

export const HUB_BRANCH_OPTIONS: ComboboxOption[] = [
  { value: "All", label: "All branches" },
  { value: "Computer Science", label: "Computer Science (CSE)" },
  { value: "ECE", label: "Electronics & Comm (ECE)" },
  { value: "Information Technology", label: "Information Tech (IT)" },
  { value: "Mechanical", label: "Mechanical (MECH)" },
  { value: "Civil", label: "Civil Engineering" },
  { value: "Electrical", label: "Electrical (EEE/EE)" },
  { value: "Chemical", label: "Chemical" },
  { value: "BioTech", label: "Biotechnology" },
];

export const HUB_SEMESTER_OPTIONS: ComboboxOption[] = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
  value: String(s),
  label: `Semester ${s}`,
}));

export const RESOURCE_TYPES = [
  { value: "NOTES", label: "Notes" },
  { value: "PYQ", label: "Past papers" },
  { value: "CHEAT_SHEET", label: "Cheat sheet" },
  { value: "LAB_MANUAL", label: "Lab manual" },
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number]["value"];

export const TITLE_PLACEHOLDERS: Record<DedicatedHubType, string> = {
  lost_found: "Black Titan watch found in the library",
  marketplace: "Hero Sprint cycle with lock",
  gaming: "Valorant 5v5, need 2 players",
  rideshare: "Cab from campus to airport",
  housing: "1 BHK near Gate 2",
  academics: "End-sem notes for CS201",
};

/** Kinds of post that can carry one photo. */
export const PHOTO_TYPES: DedicatedHubType[] = ["lost_found", "marketplace", "housing", "academics"];

export interface HubFormValues {
  lfType: "LOST" | "FOUND";
  location: string;
  reward: string;
  price: string;
  condition: string;
  category: string;
  hostelLocation: string;
  gameName: string;
  mode: string;
  rankTier: string;
  gamerTag: string;
  slotsTotal: string;
  scheduledAt: string;
  origin: string;
  destination: string;
  departureTime: string;
  totalSeats: string;
  pricePerSeat: string;
  rentPerMonth: string;
  distanceFromCampus: string;
  occupancyType: string;
  genderPreference: string;
  resourceType: ResourceType;
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: string;
  driveUrl: string;
}

export const INITIAL_HUB_VALUES: HubFormValues = {
  lfType: "LOST",
  location: "",
  reward: "",
  price: "",
  condition: "GOOD",
  category: "Cycles",
  hostelLocation: "",
  gameName: "Valorant",
  mode: "5v5 Competitive",
  rankTier: "",
  gamerTag: "",
  slotsTotal: "5",
  scheduledAt: "",
  origin: "",
  destination: "",
  departureTime: "",
  totalSeats: "4",
  pricePerSeat: "",
  rentPerMonth: "",
  distanceFromCampus: "",
  occupancyType: "SINGLE_ROOM",
  genderPreference: "ANY",
  resourceType: "NOTES",
  subjectCode: "",
  subjectName: "",
  branch: "Computer Science",
  semester: "3",
  driveUrl: "",
};

export type SetHubValue = <K extends keyof HubFormValues>(key: K, value: HubFormValues[K]) => void;
