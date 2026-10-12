"use client";

import { BadgeCheck, Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCloutTier } from "@/lib/gamification";
import { cn } from "@/lib/utils";

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

export function CollegeLeaderboardPodium({ students, collegeName }: CollegeLeaderboardPodiumProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");

  // Sort students descending by points
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [students]);

  // Extract top 3 for the podium
  const top1 = sortedStudents[0];
  const top2 = sortedStudents[1];
  const top3 = sortedStudents[2];

  // Distinct branches
  const branches = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.branch) set.add(s.branch.trim());
    });
    return Array.from(set);
  }, [students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return sortedStudents.filter((student) => {
      const matchesQuery =
        !searchQuery.trim() ||
        student.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.headline?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBranch =
        selectedBranch === "ALL" ||
        (student.branch && student.branch.toLowerCase() === selectedBranch.toLowerCase());

      const matchesYear = selectedYear === "ALL" || student.year === selectedYear;

      return matchesQuery && matchesBranch && matchesYear;
    });
  }, [sortedStudents, searchQuery, selectedBranch, selectedYear]);

  return (
    <div className="space-y-4 select-none animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[var(--border)]">
        <div>
          <h2 className="font-heading font-bold text-xl text-[var(--text)]">
            Verified Students Directory
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Connect with verified peers and seniors across departments in {collegeName.split(",")[0]}.
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--border)] self-start sm:self-auto">
          {students.length} verified students
        </span>
      </div>

      {/* ─── Search & Department Filtering Controls ─── */}
      <div className="space-y-2.5">
        {/* Search Box */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${students.length} verified students in ${collegeName.split(",")[0]}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-full border border-border/50 bg-card text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Branch & Year Filter Pills */}
        <div className="space-y-1.5">
          {branches.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedBranch("ALL")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
                  selectedBranch === "ALL"
                    ? "bg-foreground text-background font-black"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                All Departments ({students.length})
              </button>
              {branches.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBranch(b)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
                    selectedBranch === b
                      ? "bg-foreground text-background font-black"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Batch:</span>
            {(["ALL", 1, 2, 3, 4] as const).map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs",
                  selectedYear === yr
                    ? "bg-foreground text-background font-black"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {yr === "ALL" ? "All Years" : `Year ${yr}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Student Leaderboard Table / Cards ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Showing {filteredStudents.length} Students
          </span>
          <span className="text-[11px] font-bold text-muted-foreground">Ranked by Loop Points (LP)</span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {filteredStudents.map((student, index) => {
            const tier = getCloutTier(student.points || 0);
            return (
              <Link key={student.id} href={`/@${student.username}`}>
                <div className="group rounded-2xl bg-card p-3.5 hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-black text-muted-foreground/60 w-5 text-center shrink-0">
                      #{index + 1}
                    </span>

                    <Avatar className="size-10 group-hover:scale-105 transition-transform shrink-0">
                      <AvatarImage src={student.avatarUrl || ""} />
                      <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                        {student.displayName[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-extrabold text-foreground truncate flex items-center gap-1">
                        <span>{student.displayName}</span>
                        {(student.points || 0) >= 150 && (
                          <span title="Verified Student" className="inline-flex shrink-0">
                            <BadgeCheck className="size-3 text-brand" />
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        @{student.username} {student.branch ? `• ${student.branch}` : ""}{" "}
                        {student.year ? `(Yr ${student.year})` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-primary">{student.points || 0} LP</span>
                    <p className="text-[9px] font-bold text-muted-foreground">
                      {tier.tierName.split(" ")[0]}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-border rounded-2xl bg-card text-muted-foreground text-xs space-y-2">
              <Users className="size-6 mx-auto text-muted-foreground/50" />
              <p className="font-bold">No students match &ldquo;{searchQuery}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedBranch("ALL");
                }}
                className="text-primary hover:underline font-bold text-xs"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
