"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fieldClassName, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const STORAGE_KEY = "campusloop_academic_focus";

interface AcademicCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: { branch: string; semester: number; courses: string[]; bio: string }) => void;
}

/** Lets a student set branch, semester and subjects so the feed shows the right material. */
export function AcademicCourseModal({ isOpen, onClose, onSaved }: AcademicCourseModalProps) {
  const { profile, mutate: mutateProfile } = useProfile();

  const [branch, setBranch] = useState("Computer Science");
  const [semester, setSemester] = useState(5);
  const [courseInput, setCourseInput] = useState("");
  const [courses, setCourses] = useState<string[]>(["DBMS", "DAA"]);
  // The profile bio is sent back unchanged so saving this form never wipes it.
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (profile.bio) setBio(profile.bio);
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.branch) setBranch(parsed.branch);
      if (parsed.semester) setSemester(parsed.semester);
      if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
      if (parsed.bio) setBio(parsed.bio);
    } catch {
      // Storage blocked or bad JSON: keep defaults.
    }
  }, [profile]);

  function addCourse(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || courses.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
    sounds.tap();
    haptics.light();
    setCourses([...courses, trimmed]);
    setCourseInput("");
  }

  function removeCourse(tag: string) {
    sounds.tap();
    haptics.light();
    setCourses(courses.filter((c) => c !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    sounds.tap();
    haptics.medium();

    const updated = { branch, semester, courses, bio };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage blocked: still save to the account below.
    }

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
            bio: bio.slice(0, 300),
          }),
        });
        if (!res.ok) throw new Error("save failed");
        await mutateProfile();
        toast.success("Saved. Your feed now shows these subjects first.");
      } else {
        toast.success("Saved on this phone. Sign in to keep it on every device.");
      }
      haptics.success();
      onSaved?.(updated);
      onClose();
    } catch {
      toast.error("Couldn't save to your account. Check your internet and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectClass = cn(fieldClassName, "h-11 cursor-pointer");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>My branch and subjects</DialogTitle>
          <DialogDescription>We show notes and PYQs for these first.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="focus-branch">Branch</Label>
              <select
                id="focus-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className={selectClass}
              >
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="focus-semester">Semester</Label>
              <select
                id="focus-semester"
                value={semester}
                onChange={(e) => setSemester(Number.parseInt(e.target.value, 10))}
                className={selectClass}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus-course">Subjects this semester</Label>
            {courses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {courses.map((c) => (
                  <Chip
                    key={c}
                    size="sm"
                    selected
                    onRemove={() => removeCourse(c)}
                    onClick={() => removeCourse(c)}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="focus-course"
                placeholder="Type a subject, like DBMS"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addCourse(courseInput);
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Add subject"
                disabled={!courseInput.trim()}
                onClick={() => addCourse(courseInput)}
              >
                <Plus />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTED_COURSES.filter(
                (sc) => !courses.some((c) => c.toLowerCase() === sc.toLowerCase())
              ).map((sc) => (
                <Chip key={sc} size="sm" icon={<Plus />} onClick={() => addCourse(sc)}>
                  {sc}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
