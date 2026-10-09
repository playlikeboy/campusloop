"use client";

import { Check, GraduationCap, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const BRANCH_OPTIONS = [
  "Computer Science",
  "Information Technology",
  "ECE",
  "Electrical",
  "Mechanical",
  "Civil",
  "Chemical",
  "BioTech",
  "Basic Sciences",
];

const SUGGESTED_COURSES = [
  "DBMS",
  "DAA",
  "DSA",
  "Operating Systems",
  "Computer Networks",
  "Compiler Design",
  "Theory of Computation",
  "Machine Learning",
  "Discrete Mathematics",
  "Digital Electronics",
  "Analog Circuits",
  "Signal Processing",
];

interface AcademicCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: { branch: string; semester: number; courses: string[]; bio: string }) => void;
}

export function AcademicCourseModal({
  isOpen,
  onClose,
  onSaved,
}: AcademicCourseModalProps) {
  const { profile, mutate: mutateProfile } = useProfile();

  const [branch, setBranch] = useState("Computer Science");
  const [semester, setSemester] = useState(5);
  const [courseInput, setCourseInput] = useState("");
  const [courses, setCourses] = useState<string[]>(["DBMS", "DAA"]);
  const [academicBio, setAcademicBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial values from profile or localStorage
  useEffect(() => {
    if (profile) {
      if (profile.branch) setBranch(profile.branch);
      if (profile.year) setSemester(Math.min(8, Math.max(1, profile.year * 2 - 1)));
      if (Array.isArray(profile.interests) && profile.interests.length > 0) {
        setCourses(profile.interests);
      } else if (profile.course) {
        setCourses(
          profile.course
            .split(/[,;]+/)
            .map((c) => c.trim())
            .filter(Boolean)
        );
      }
      if (profile.bio) setAcademicBio(profile.bio);
    } else if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("campusloop_academic_focus");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.branch) setBranch(parsed.branch);
          if (parsed.semester) setSemester(parsed.semester);
          if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
          if (parsed.bio) setAcademicBio(parsed.bio);
        }
      } catch {}
    }
  }, [profile]);

  if (!isOpen) return null;

  function handleAddCourse(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (courses.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
    sounds.tap();
    haptics.light();
    setCourses([...courses, trimmed]);
    setCourseInput("");
  }

  function handleRemoveCourse(tagToRemove: string) {
    sounds.tap();
    haptics.light();
    setCourses(courses.filter((c) => c !== tagToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    sounds.tap();
    haptics.medium();

    const updatedData = {
      branch,
      semester,
      courses,
      bio: academicBio,
    };

    // 1. Cache to local storage immediately
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("campusloop_academic_focus", JSON.stringify(updatedData));
      } catch {}
    }

    // 2. Persist to DB if user has session
    try {
      if (profile?.id) {
        const res = await fetch("/api/profile/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch,
            year: Math.ceil(semester / 2),
            course: courses.join(", "),
            interests: courses,
            bio: academicBio.slice(0, 300),
          }),
        });

        if (!res.ok) {
          throw new Error("Could not update profile on server");
        }
        await mutateProfile();
      }

      toast.success("Academic focus saved! Notes & feeds prioritized for your courses.");
      haptics.success();
      onSaved?.(updatedData);
      onClose();
    } catch {
      toast.info("Saved locally. Sign in anytime to sync across all your devices!");
      onSaved?.(updatedData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md select-none animate-in fade-in-50 duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">My Academic Focus</h2>
              <p className="text-xs text-muted-foreground">
                Prioritize notes, PYQs, and feed recommendations for your enrolled courses
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Branch & Semester Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Engineering Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-9 rounded-xl border border-border/50 bg-muted/30 px-3 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Current Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(parseInt(e.target.value, 10))}
                className="w-full h-9 rounded-xl border border-border/50 bg-muted/30 px-3 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Enrolled Courses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Enrolled Courses &amp; Subjects
              </label>
              <span className="text-[11px] text-muted-foreground">e.g. DBMS, DAA, OS</span>
            </div>

            {/* Selected Courses Chips */}
            <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2 rounded-xl border border-border/50 bg-muted/20">
              {courses.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30 shrink-0"
                >
                  <span>{c}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCourse(c)}
                    className="size-3.5 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="size-2.5" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                placeholder={courses.length === 0 ? "Type course name (e.g. DBMS) and press Enter" : "Add more..."}
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddCourse(courseInput);
                  }
                }}
                className="flex-1 min-w-[120px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none px-1"
              />
            </div>

            {/* Quick add suggested courses */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] text-muted-foreground">Suggested quick add:</span>
              <div className="flex flex-wrap items-center gap-1">
                {SUGGESTED_COURSES.map((sc) => {
                  const isAdded = courses.some((c) => c.toLowerCase() === sc.toLowerCase());
                  return (
                    <button
                      key={sc}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddCourse(sc)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border",
                        isAdded
                          ? "opacity-40 border-transparent bg-muted text-muted-foreground cursor-default"
                          : "border-border/50 bg-card hover:bg-muted text-foreground hover:border-primary"
                      )}
                    >
                      +{sc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Academic Goal / Focus Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Academic Goal / Description (Helps recommendation engine)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              placeholder="e.g. Preparing for 5th semester end-term exams in DBMS and DAA. Need handwritten formulas and solved papers."
              value={academicBio}
              onChange={(e) => setAcademicBio(e.target.value)}
              className="w-full rounded-xl border border-border/50 bg-muted/20 p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors resize-none"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Used by similarity search to rank relevant study packs</span>
              <span>{academicBio.length}/300</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Check className="size-3.5" />
              <span>{isSubmitting ? "Saving..." : "Save Academic Focus"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
