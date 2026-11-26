"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BrandLogoIcon } from "@/components/ui/brand-logo";
import { cn } from "@/lib/utils";

/** Section anchors on the landing page, in page order. Each id must exist in a landing component. */
const SECTION_LINKS = [
  { id: "video", label: "Video" },
  { id: "features", label: "Features" },
  { id: "learn", label: "Learn" },
  { id: "events", label: "Events" },
  { id: "safety", label: "Safety" },
] as const;

const ANDROID_LINK = { href: "/download", label: "Android app" };

type SectionId = (typeof SECTION_LINKS)[number]["id"];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Which section is in the reading band near the top of the viewport. */
function useActiveSection(): SectionId | null {
  const [active, setActive] = useState<SectionId | null>(null);
  useEffect(() => {
    const els = SECTION_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // Last section in page order that crosses the band wins.
        const hit = [...SECTION_LINKS].reverse().find((l) => visible.has(l.id));
        setActive(hit ? hit.id : null);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);
  return active;
}

/**
 * Landing header. Sits on the violet story field at the top of the page, then
 * turns into a solid paper bar with a hairline once the page scrolls. Fixed
 * 64px height in both states, so nothing below it moves.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Sheet open: lock scroll, trap focus inside the header, close on Escape or outside click.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== "Tab" || !headerRef.current) return;
      const items = [...headerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !headerRef.current.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !headerRef.current.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) close(false);
    };
    const onWide = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) close(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", onWide);
    return () => {
      root.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", onWide);
    };
  }, [open, close]);

  // On the field only while at the very top with the sheet closed.
  const onField = !scrolled && !open;

  const ring = onField
    ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-story-field-fg focus-visible:ring-offset-2 focus-visible:ring-offset-story-field"
    : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  return (
    <header
      ref={headerRef}
      data-state={onField ? "field" : "solid"}
      className={cn(
        "sticky top-0 z-[var(--z-sticky-nav)] border-b transition-ui",
        onField ? "border-transparent bg-story-field text-story-field-fg" : "border-border bg-surface text-fg"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[var(--container-marketing)] items-center gap-3 px-[var(--gutter)]">
        <Link
          href="/"
          aria-label="CampusLoop home"
          className={cn("-ml-1.5 flex h-11 shrink-0 items-center gap-2.5 rounded-full pr-2 pl-1.5", ring)}
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-md transition-ui",
              onField ? "bg-sticker shadow-sticker" : "bg-transparent"
            )}
          >
            <BrandLogoIcon size="md" className="size-7" />
          </span>
          <span className="font-display text-lg leading-none font-extrabold tracking-tight">CampusLoop</span>
        </Link>

        <nav aria-label="Page sections" className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {SECTION_LINKS.map((l) => {
              const isActive = active === l.id;
              return (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "flex h-10 items-center rounded-full px-3.5 text-[0.9375rem] font-medium transition-ui",
                      ring,
                      onField
                        ? isActive
                          ? "bg-sticker text-brand-text"
                          : "text-story-field-muted hover:bg-story-field-fg/12 hover:text-story-field-fg"
                        : isActive
                          ? "bg-brand-subtle font-semibold text-brand-text"
                          : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                    )}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
            <li>
              <Link
                href={ANDROID_LINK.href}
                className={cn(
                  "flex h-10 items-center rounded-full px-3.5 text-[0.9375rem] font-medium transition-ui",
                  ring,
                  onField
                    ? "text-story-field-muted hover:bg-story-field-fg/12 hover:text-story-field-fg"
                    : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                )}
              >
                {ANDROID_LINK.label}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
          <Link
            href="/sign-in"
            className={cn(
              "hidden h-11 items-center rounded-full px-4 text-sm font-semibold transition-ui md:inline-flex",
              ring,
              onField
                ? "text-story-field-fg hover:bg-story-field-fg/12"
                : "text-fg hover:bg-surface-muted"
            )}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={cn(
              "inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-ui active:scale-[0.97]",
              ring,
              onField
                ? "bg-sticker text-brand-text shadow-sticker hover:bg-brand-subtle"
                : "bg-brand text-brand-fg hover:bg-brand-hover"
            )}
          >
            <span className="md:hidden">Join</span>
            <span className="hidden md:inline">Join free</span>
          </Link>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={sheetId}
            className={cn(
              "flex size-11 items-center justify-center rounded-full transition-ui lg:hidden",
              ring,
              onField ? "text-story-field-fg hover:bg-story-field-fg/12" : "text-fg hover:bg-surface-muted"
            )}
          >
            {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div
            aria-hidden="true"
            onPointerDown={() => close(false)}
            className="fixed inset-x-0 top-16 bottom-0 bg-overlay lg:hidden"
          />
          <div
            id={sheetId}
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain rounded-b-xl bg-surface px-[var(--gutter)] pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lg lg:hidden"
          >
            <nav aria-label="Page sections">
              <ul className="flex flex-col">
                {SECTION_LINKS.map((l) => (
                  <li key={l.id}>
                    <a
                      href={`#${l.id}`}
                      onClick={() => close(false)}
                      aria-current={active === l.id ? "location" : undefined}
                      className={cn(
                        "flex min-h-13 items-center rounded-full px-4 font-display text-2xl font-extrabold tracking-tight transition-ui hover:bg-surface-muted",
                        ring,
                        active === l.id ? "bg-brand-subtle text-brand-text" : "text-fg"
                      )}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    href={ANDROID_LINK.href}
                    onClick={() => close(false)}
                    className={cn(
                      "flex min-h-13 items-center rounded-full px-4 font-display text-2xl font-extrabold tracking-tight text-fg transition-ui hover:bg-surface-muted",
                      ring
                    )}
                  >
                    {ANDROID_LINK.label}
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
              <Link
                href="/sign-up"
                onClick={() => close(false)}
                className={cn(
                  "flex h-13 items-center justify-center rounded-full bg-brand px-5 text-base font-semibold text-brand-fg transition-ui hover:bg-brand-hover",
                  ring
                )}
              >
                Join free
              </Link>
              <Link
                href="/sign-in"
                onClick={() => close(false)}
                className={cn(
                  "flex h-13 items-center justify-center rounded-full bg-surface-muted px-5 text-base font-semibold text-fg transition-ui hover:bg-surface-sunken",
                  ring
                )}
              >
                Sign in
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
