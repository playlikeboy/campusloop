import {
  BookMarked,
  BookOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers,
  Library,
  type LucideIcon,
  Presentation,
  Zap,
} from "lucide-react";

export type SearchSort = "relevance" | "popular" | "downloads" | "views" | "latest";
export type SearchScope = "campus" | "global";

export const RESOURCE_TYPES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "NOTES", label: "Notes", icon: FileText },
  { id: "PYQ", label: "PYQs", icon: GraduationCap },
  { id: "CHEAT_SHEET", label: "Cheat sheets", icon: Zap },
  { id: "PLAYLISTS", label: "Playlists", icon: Library },
  { id: "BOOK", label: "Books", icon: BookMarked },
  { id: "MODULE", label: "Units", icon: BookOpen },
  { id: "PPT", label: "Slides", icon: Presentation },
  { id: "LAB_MANUAL", label: "Lab manuals", icon: FlaskConical },
];

export const BRANCHES = [
  "All",
  "Computer Science",
  "ECE",
  "Information Technology",
  "Mechanical",
  "Civil",
  "Electrical",
  "Chemical",
  "BioTech",
  "Architecture",
  "Management",
  "Pharmacy",
  "Design",
  "Basic Sciences",
] as const;

export const SEMESTERS = [
  { id: "all", label: "All semesters" },
  ...Array.from({ length: 8 }, (_, i) => ({ id: String(i + 1), label: `Semester ${i + 1}` })),
];

export const SORT_OPTIONS: { value: SearchSort; label: string; needsQuery?: boolean }[] = [
  { value: "relevance", label: "Best match", needsQuery: true },
  { value: "popular", label: "Most upvoted" },
  { value: "downloads", label: "Most downloaded" },
  { value: "views", label: "Most viewed" },
  { value: "latest", label: "Newest" },
];

export const POPULAR_CURRICULUM_CODES = [
  { code: "CS201", label: "Data Structures" },
  { code: "CS303", label: "Operating Systems" },
  { code: "CS302", label: "DBMS" },
  { code: "CS401", label: "Computer Networks" },
  { code: "MA101", label: "Engineering Maths" },
  { code: "EC201", label: "Digital Electronics" },
  { code: "CS305", label: "Theory of Computation" },
  { code: "CS501", label: "Machine Learning" },
] as const;

export const TRENDING_TOPICS = [
  "AKTU Quantum",
  "Semester PYQ",
  "Formula cheat sheet",
  "Lab viva questions",
  "Object Oriented Programming",
  "Compiler Design",
  "Engineering Mechanics",
] as const;
