"use client";

import { fieldClassName, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COURSE_CATEGORIES, LEVEL_LABEL } from "@/lib/courses/format";
import type { CourseInput } from "@/lib/courses/validate";

type Basics = Pick<
  CourseInput,
  "title" | "subtitle" | "category" | "level" | "instructorName" | "thumbnailUrl" | "description"
>;

const label = "block text-sm font-semibold text-fg";
export const builderCard = "space-y-4 rounded-lg border border-border bg-surface p-5";

/** Title, subtitle, topic, level, teacher, cover and description fields. */
export function BasicsSection({
  value: s,
  set,
}: {
  value: Basics;
  set: <K extends keyof Basics>(k: K, v: Basics[K]) => void;
}) {
  return (
    <section className={builderCard} aria-labelledby="basics">
      <h2 id="basics" className="text-lg text-fg">
        Basics
      </h2>
      <label className={label}>
        Title
        <Input
          value={s.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={120}
          placeholder="e.g. DSA in 8 weeks for placements"
          className="mt-1.5"
        />
      </label>
      <label className={label}>
        Subtitle
        <Input
          value={s.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          maxLength={200}
          placeholder="Who it's for and what they'll learn"
          className="mt-1.5"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={label}>
          Topic
          <select
            value={s.category}
            onChange={(e) => set("category", e.target.value)}
            className={`${fieldClassName} mt-1.5 h-11`}
          >
            {COURSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Level
          <select
            value={s.level}
            onChange={(e) => set("level", e.target.value)}
            className={`${fieldClassName} mt-1.5 h-11`}
          >
            {Object.entries(LEVEL_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Teacher name
          <Input
            value={s.instructorName}
            onChange={(e) => set("instructorName", e.target.value)}
            placeholder="Your name if empty"
            className="mt-1.5"
          />
        </label>
      </div>
      <label className={label}>
        Cover image link{" "}
        <span className="font-normal text-fg-muted">(optional, uses the first video if empty)</span>
        <Input
          type="url"
          value={s.thumbnailUrl}
          onChange={(e) => set("thumbnailUrl", e.target.value)}
          placeholder="https://..."
          className="mt-1.5"
        />
      </label>
      <label className={label}>
        Description
        <Textarea
          value={s.description}
          onChange={(e) => set("description", e.target.value)}
          rows={6}
          placeholder="What the course covers and how it's laid out. Markdown works."
          className="mt-1.5 resize-y"
        />
      </label>
    </section>
  );
}
