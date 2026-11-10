/** Choice lists for onboarding. Values are stored on the profile, so keep them stable. */

/** Same tags as profile editing, so both screens offer the same choices. */
export const POPULAR_INTERESTS = [
  "Tech & Coding",
  "Late Night Tea",
  "Hostel Life",
  "Campus Dating",
  "Gaming & Esports",
  "Startups & AI",
  "Music & Jamming",
  "Exam Prep",
  "Sports & Fitness",
  "Photography",
  "Memes & Banter",
  "Cinema & TV",
];

/** What a prospective student is interested in, in place of a degree and branch. */
export const PROSPECTIVE_FIELDS = [
  "Engineering & Tech",
  "Medical & Healthcare",
  "Commerce & Management",
  "Arts & Humanities",
  "Law & Policy",
  "Design & Media",
  "Sciences",
  "General / Exploring",
];

export const PROSPECTIVE_STAGES = [
  "High School Senior",
  "College Applicant",
  "Gap Year Explorer",
  "Prospective Student",
  "General Visitor",
];

export const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export type Gender = (typeof GENDERS)[number]["value"];

export const MAX_DREAM_CAMPUSES = 5;
