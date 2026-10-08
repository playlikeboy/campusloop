import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

const FOOTER_GROUPS = [
  {
    title: "Platform",
    links: [
      { label: "Campus Feed", href: "/feeds" },
      { label: "Academic Vault", href: "/academics" },
      { label: "Campus Match", href: "/dating" },
      { label: "1,350+ Colleges", href: "/colleges" },
      { label: "Clubs & Hubs", href: "/communities" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Student Safety", href: "/safety" },
      { label: "Contact Us", href: "/contact" },
      { label: "Pitch Deck", href: "/pitch" },
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
    <footer className="border-t border-border/40 bg-background text-foreground select-none">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          {/* Brand info */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative size-8 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 drop-shadow-sm">
                <Image
                  src="/campusloop/marketing/voxel/logo.webp"
                  alt="CampusLoop"
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <span className="text-base font-black tracking-tight text-foreground">
                Campus<span className="text-primary">Loop</span>
              </span>
            </Link>

            <p className="mt-3.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              The verified student-only campus network. Unfiltered confessions, 45,000+ peer notes &amp; PYQs, campus crush radar, and club hubs across 1,350+ Indian colleges.
            </p>

            <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>100% Gated by Institutional Student Email &amp; ID</span>
            </div>

            {/* Social channels with official priorities */}
            <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-muted-foreground">
              <a
                href="https://www.instagram.com/campusloop.space/"
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-primary transition-colors font-semibold"
                aria-label="Instagram @campusloop.space"
              >
                Instagram
              </a>
              <span>•</span>
              <a
                href="https://www.linkedin.com/company/mycampusloop/?viewAsMember=true"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="LinkedIn CampusLoop"
              >
                LinkedIn
              </a>
              <span>•</span>
              <a
                href="https://x.com/company/mycampusloop/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="X @mycampusloop"
              >
                X (Twitter)
              </a>
            </div>
          </div>

          {/* Grouped Link Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-black uppercase tracking-wider text-foreground">
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
          <p>© {new Date().getFullYear()} CampusLoop. Founded at BIT Mesra. All rights reserved.</p>
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
