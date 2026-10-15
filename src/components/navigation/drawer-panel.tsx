"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Left slide-over shell shared by the app and admin mobile drawers.
 * Owns the behaviour so both stay consistent: Escape and backdrop close,
 * body scroll lock, focus moved in on open and restored on close, and
 * safe-area padding for notched phones.
 */
export function DrawerPanel({
  open,
  onClose,
  label,
  header,
  footer,
  children,
  className,
  hideFrom = "lg:hidden",
}: {
  /** Breakpoint class that hides the drawer where a persistent sidebar takes over. */
  hideFrom?: "lg:hidden" | "md:hidden";
  open: boolean;
  onClose: () => void;
  label: string;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 50);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      restoreFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className={cn("fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]", hideFrom)}
            aria-hidden="true"
          />
          <motion.aside
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[340px] flex-col bg-background shadow-2xl",
              hideFrom,
              "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
              className
            )}
          >
            <div className="flex items-start gap-2 px-4 pt-4 pb-3">
              <div className="min-w-0 flex-1">{header}</div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4" aria-label={label}>
              {children}
            </nav>
            {footer && <div className="px-3 pt-2 pb-3 shadow-[0_-1px_0_0_var(--border)]">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/** One row in a drawer section. 44px tap target, tonal active state with a leading bar. */
export function DrawerLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
  onNavigate,
  tone = "default",
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  badge?: ReactNode;
  onNavigate?: () => void;
  tone?: "default" | "primary" | "danger";
}) {
  return (
    <Link
      href={href}
      prefetch
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : tone === "primary"
            ? "text-primary hover:bg-primary/10"
            : tone === "danger"
              ? "text-destructive hover:bg-destructive/10"
              : "text-foreground hover:bg-muted/70"
      )}
    >
      {active && <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-primary" aria-hidden />}
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          active || tone !== "default" ? "" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge}
    </Link>
  );
}

export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-1">
      <h3 className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}
