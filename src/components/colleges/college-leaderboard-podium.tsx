"use client";

import { Search, Users, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

interface StudentItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  points?: number | null;
  course?: string | null;
  branch?: string | null;
  year?: number | null;
  headline?: string | null;
}

interface CollegeLeaderboardPodiumProps {
  students: StudentItem[];
  collegeName: string;
}

const YEARS = ["ALL", 1, 2, 3, 4] as const;

/** Students who joined from this college, ranked by Loop Points, with search and branch/year filters. */
export function CollegeLeaderboardPodium({ students, collegeName }: CollegeLeaderboardPodiumProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState<(typeof YEARS)[number]>("ALL");
  const shortName = collegeName.split(",")[0];

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => (b.points || 0) - (a.points || 0)),
    [students]
  );

  const branches = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) if (s.branch) set.add(s.branch.trim());
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sortedStudents.filter((student) => {
      const matchesQuery =
        !q ||
        student.displayName.toLowerCase().includes(q) ||
        student.username.toLowerCase().includes(q) ||
        student.branch?.toLowerCase().includes(q) ||
        student.headline?.toLowerCase().includes(q);
      const matchesBranch =
        selectedBranch === "ALL" || student.branch?.toLowerCase() === selectedBranch.toLowerCase();
      const matchesYear = selectedYear === "ALL" || student.year === selectedYear;
      return matchesQuery && matchesBranch && matchesYear;
    });
  }, [sortedStudents, searchQuery, selectedBranch, selectedYear]);

  if (students.length === 0) {
    return (
      <EmptyState
        icon={Users}
        bordered
        title={`No one from ${shortName} has joined yet`}
        description="Join with your college email and invite your friends."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-fg">Students</h2>
        <span className="text-sm text-fg-muted tabular-nums">{students.length} joined</span>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Search students"
          placeholder="Name, username or branch"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-11 pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            onClick={() => setSearchQuery("")}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <X />
          </Button>
        )}
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {YEARS.map((yr) => (
          <Chip key={yr} size="sm" selected={selectedYear === yr} onClick={() => setSelectedYear(yr)}>
            {yr === "ALL" ? "All years" : `Year ${yr}`}
          </Chip>
        ))}
        {branches.length > 1 &&
          ["ALL", ...branches].map((b) => (
            <Chip key={b} size="sm" selected={selectedBranch === b} onClick={() => setSelectedBranch(b)}>
              {b === "ALL" ? "All branches" : b}
            </Chip>
          ))}
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState
          size="compact"
          bordered
          icon={Search}
          title="No students match that"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedBranch("ALL");
                setSelectedYear("ALL");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {filteredStudents.map((student, index) => (
            <li key={student.id}>
              <Link
                href={`/@${student.username}`}
                className="flex min-h-16 items-center gap-3 px-4 py-3 transition-ui hover:bg-surface-muted"
              >
                <span className="w-6 shrink-0 text-center text-sm font-semibold text-fg-subtle tabular-nums">
                  {index + 1}
                </span>
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={student.avatarUrl || ""} alt="" />
                  <AvatarFallback>{student.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{student.displayName}</p>
                  <p className="truncate text-sm text-fg-muted">
                    @{student.username}
                    {student.branch ? ` · ${student.branch}` : ""}
                    {student.year ? ` · Year ${student.year}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-reward-text tabular-nums">
                  {(student.points || 0).toLocaleString("en-IN")} LP
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
