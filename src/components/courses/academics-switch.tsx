"use client";

import { BookOpen, PlayCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/academics",
    match: ["/academics", "/academics/study-material"],
    label: "Study material",
    icon: BookOpen,
  },
  { href: "/courses", match: ["/courses"], label: "Courses", icon: PlayCircle },
];

/** Switch between Study material and Courses, shown on their home pages. */
export function AcademicsSwitch() {
  const pathname = usePathname() || "";
  const visible = ["/academics", "/academics/study-material", "/courses", "/courses/my"].includes(pathname);
  if (!visible) return null;
  return (
    <nav
      aria-label="Study sections"
      className="mx-auto mb-4 flex w-fit gap-1 rounded-full bg-surface-muted p-1"
    >
      {TABS.map((t) => {
        const active = t.match.some(
          (m) => pathname === m || (m === "/courses" && pathname.startsWith("/courses"))
        );
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
