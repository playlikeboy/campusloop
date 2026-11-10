"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MarketingMobileMenuProps {
  links: { href: string; label: string }[];
  isAuthenticated?: boolean;
}

const primaryButton =
  "flex h-12 items-center justify-center rounded-full bg-brand px-4 text-base font-semibold text-brand-fg transition-ui hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Small client island: the only interactive part of the marketing nav. */
export function MarketingMobileMenu({ links, isAuthenticated = false }: MarketingMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="marketing-mobile-menu"
        className="flex size-11 items-center justify-center rounded-full text-fg transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div
          id="marketing-mobile-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-[var(--z-sticky-nav)] overflow-y-auto border-t border-border bg-surface px-[var(--gutter)] pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
        >
          <nav aria-label="Site" className="flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center rounded-full px-4 font-display text-xl font-bold transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-brand-subtle text-brand-text" : "text-fg"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link href="/feeds" className={primaryButton}>
                Open app
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className={primaryButton}>
                  Join with college email
                </Link>
                <Link
                  href="/sign-in"
                  className="flex h-12 items-center justify-center rounded-full bg-surface-muted px-4 text-base font-medium text-fg transition-ui hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
