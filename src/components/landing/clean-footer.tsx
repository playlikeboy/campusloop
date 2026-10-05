import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Academics", href: "/academics" },
      { label: "Communities", href: "/communities" },
      { label: "Events", href: "/events" },
      { label: "Colleges", href: "/colleges" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Safety", href: "/safety" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help & FAQs", href: "/help" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Visual Sitemap", href: "/sitemap" },
    ],
  },
] as const;

export function CleanFooter() {
  return (
    <footer className="border-t border-border/40 bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          {/* Brand info */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="size-8 rounded-xl bg-gradient-to-tr from-primary via-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-black">
                CL
              </div>
              <span className="text-base font-extrabold tracking-tight text-foreground">
                Campus<span className="text-primary">Loop</span>
              </span>
            </Link>

            <p className="mt-3.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              The verified digital campus network connecting students, lecture notes, clubs, and events across universities.
            </p>

            {/* Social channels */}
            <div className="mt-6 flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <a
                href="https://www.instagram.com/campusloop.space/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="Instagram @campusloop.space"
              >
                Instagram
              </a>
              <span>•</span>
              <a
                href="https://www.linkedin.com/company/mycampusloop/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="LinkedIn CampusLoop"
              >
                LinkedIn
              </a>
              <span>•</span>
              <a
                href="https://x.com/mycampusloop"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="X @mycampusloop"
              >
                X
              </a>
            </div>
          </div>

          {/* Grouped Link Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {group.title}
                </p>
                <ul className="mt-3.5 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="size-3 opacity-0 -translate-x-1 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
          <p>© {new Date().getFullYear()} CampusLoop Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/sitemap" className="hover:text-foreground transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
