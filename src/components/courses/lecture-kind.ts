import { FileText, Link2, type LucideIcon, PlayCircle } from "lucide-react";

/** Icon for each lecture kind, shared by the course page and the player. */
export const LECTURE_ICON: Record<string, LucideIcon> = { VIDEO: PlayCircle, ARTICLE: FileText, LINK: Link2 };

export const lectureIcon = (kind: string): LucideIcon => LECTURE_ICON[kind] ?? PlayCircle;

/** "1 lecture" / "12 lectures". */
export const lectureCount = (n: number) => `${n.toLocaleString("en-IN")} lecture${n === 1 ? "" : "s"}`;
