"use client";

import { CalendarPlus, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type CalendarEvent, downloadAppleCalendarIcs, openGoogleCalendar } from "@/lib/calendar";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AddToCalendarDropdownProps {
  event: CalendarEvent;
  variant?: "button" | "pill" | "minimal";
  className?: string;
}

export function AddToCalendarDropdown({ event, variant = "button", className }: AddToCalendarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    sounds.tap();
    haptics.light();
    setIsOpen((prev) => !prev);
  }

  function handleGoogle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    openGoogleCalendar(event);
  }

  function handleApple(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    downloadAppleCalendarIcs(event);
  }

  return (
    <div ref={dropdownRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Add to calendar"
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full select-none transition-ui active:scale-[0.97]",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          variant === "button" &&
            "border border-border bg-surface px-3 text-sm font-semibold text-fg hover:bg-surface-muted",
          variant === "pill" &&
            "border border-border bg-surface px-4 text-sm font-semibold text-fg hover:bg-surface-muted",
          variant === "minimal" &&
            "size-11 border border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg"
        )}
      >
        <CalendarPlus className="size-4 shrink-0" aria-hidden />
        {variant !== "minimal" && (
          <>
            <span className="hidden sm:inline">Add to calendar</span>
            <ChevronDown
              className={cn("size-3.5 text-fg-muted transition-ui", isOpen && "rotate-180")}
              aria-hidden
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          className="absolute right-0 z-(--z-dropdown) mt-1.5 w-56 origin-top-right rounded-md bg-surface-raised p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleGoogle}
            className="flex min-h-11 w-full cursor-pointer flex-col justify-center rounded-sm px-3 py-2 text-left transition-ui hover:bg-surface-muted"
          >
            <span className="text-sm font-semibold text-fg">Google Calendar</span>
            <span className="text-xs text-fg-muted">Android and web</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleApple}
            className="flex min-h-11 w-full cursor-pointer flex-col justify-center rounded-sm px-3 py-2 text-left transition-ui hover:bg-surface-muted"
          >
            <span className="text-sm font-semibold text-fg">Apple Calendar</span>
            <span className="text-xs text-fg-muted">iPhone, Mac, or download .ics</span>
          </button>
        </div>
      )}
    </div>
  );
}
