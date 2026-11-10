"use client";

import { Calendar, Check, Circle, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EVENT_TYPES, type EventFormState, MODES } from "./event-form-options";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export function EventPreview({ form }: { form: EventFormState }) {
  const type = EVENT_TYPES.find((t) => t.value === form.eventType) ?? EVENT_TYPES[0];
  const mode = MODES.find((m) => m.value === form.mode);
  const TypeIcon = type.icon;
  const showVenue = form.mode !== "ONLINE";

  return (
    <section aria-labelledby="preview-title" className="space-y-3">
      <h2 id="preview-title" className="text-lg font-bold text-fg">
        Preview
      </h2>
      <article className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex aspect-video w-full items-center justify-center bg-surface-muted">
          {form.bannerUrl ? (
            <img src={form.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <TypeIcon aria-hidden="true" className="size-10 text-fg-subtle" />
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="neutral">{type.label}</Badge>
            {mode && <Badge variant="neutral">{mode.label}</Badge>}
            <Badge variant="outline">{form.isPaid ? form.entryFee.trim() || "Paid" : "Free"}</Badge>
          </div>
          <div>
            <p className="text-sm text-fg-muted">{form.clubName.trim() || "Your club"}</p>
            <h3 className="line-clamp-2 text-lg font-bold text-fg">{form.title.trim() || "Event name"}</h3>
            {form.tagline.trim() && <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{form.tagline}</p>}
          </div>
          <ul className="space-y-1.5 text-sm text-fg-muted">
            <li className="flex items-center gap-2">
              <Calendar aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">
                {form.startDate
                  ? new Date(form.startDate).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Date not set"}
              </span>
            </li>
            {showVenue && (
              <li className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{form.venue.trim() || "Venue not set"}</span>
              </li>
            )}
            {form.prizesDescription.trim() && (
              <li className="flex items-center gap-2">
                <Trophy aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{form.prizesDescription}</span>
              </li>
            )}
          </ul>
          {form.perks.length > 0 && (
            <p className="text-sm text-fg-muted">
              {form.perks.slice(0, 3).join(", ")}
              {form.perks.length > 3 && ` and ${form.perks.length - 3} more`}
            </p>
          )}
        </div>
      </article>
    </section>
  );
}

export function ReadinessList({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.done).length;
  return (
    <section aria-labelledby="readiness-title" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="readiness-title" className="text-lg font-bold text-fg">
          Before you publish
        </h2>
        <span className="text-sm text-fg-muted tabular-nums">
          {done} of {items.length} done
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <Check aria-hidden="true" className="size-4 text-verified-text" />
            ) : (
              <Circle aria-hidden="true" className="size-4 text-fg-subtle" />
            )}
            <span className={cn(item.done ? "text-fg" : "text-fg-muted")}>{item.label}</span>
            <span className="sr-only">{item.done ? "(done)" : "(not done)"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
