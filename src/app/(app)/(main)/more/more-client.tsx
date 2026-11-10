"use client";

import { ChevronRight, ExternalLink, Shield } from "lucide-react";
import Link from "next/link";
import { NavBadge } from "@/components/shells/nav-badge";
import { InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/social-icons";
import { MORE_HUB_SECTIONS, type NavItem } from "@/constants/navigation";
import { SOCIAL_LINKS } from "@/constants/socials";
import { useProfile } from "@/hooks/use-profile";

interface MoreClientProps {
  isAdmin?: boolean;
}

const ROW =
  "group flex min-h-14 items-center gap-3 px-4 py-2.5 transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

function MoreRow({ item }: { item: NavItem }) {
  const Icon = item.icon;
  const external = item.external || item.href.startsWith("http");
  const badge = item.badge ?? (item.beta ? "Beta" : undefined);

  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface-muted text-fg">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-base font-semibold text-fg">
          <span className="truncate">{item.label}</span>
          {badge && <NavBadge tone={item.badgeTone ?? "neutral"}>{badge}</NavBadge>}
        </span>
        {item.desc && <span className="block truncate text-sm text-fg-muted">{item.desc}</span>}
      </span>
      {external ? (
        <ExternalLink className="size-4 shrink-0 text-fg-subtle group-hover:text-fg" aria-hidden="true" />
      ) : (
        <ChevronRight className="size-4 shrink-0 text-fg-subtle group-hover:text-fg" aria-hidden="true" />
      )}
    </>
  );

  return (
    <li>
      {external ? (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={ROW}>
          {body}
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <Link href={item.href} className={ROW}>
          {body}
        </Link>
      )}
    </li>
  );
}

const SOCIALS = [
  { key: "instagram", label: "Instagram", icon: InstagramIcon, link: SOCIAL_LINKS.instagram },
  { key: "linkedin", label: "LinkedIn", icon: LinkedinIcon, link: SOCIAL_LINKS.linkedin },
  { key: "x", label: "X", icon: XIcon, link: SOCIAL_LINKS.x },
] as const;

/** Every place in the app, grouped the same way as the menu. */
export function MoreClient({ isAdmin: propIsAdmin }: MoreClientProps) {
  const { profile } = useProfile();
  const isAdmin = propIsAdmin ?? profile?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 pt-6 pb-24">
      <header className="space-y-1">
        <h1 className="text-3xl text-fg">More</h1>
        <p className="text-sm text-fg-muted">Everything on CampusLoop in one list.</p>
      </header>

      {MORE_HUB_SECTIONS.map((section) => {
        const headingId = `more-${section.id ?? section.group}`;
        return (
          <section key={section.group} aria-labelledby={headingId} className="space-y-2">
            <h2 id={headingId} className="px-1 text-lg text-fg">
              {section.group}
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
              {section.items.map((item) => (
                <MoreRow key={item.href} item={item} />
              ))}
            </ul>
          </section>
        );
      })}

      {isAdmin && (
        <section aria-labelledby="more-admin" className="space-y-2">
          <h2 id="more-admin" className="px-1 text-lg text-fg">
            Admin
          </h2>
          <ul className="overflow-hidden rounded-lg border border-border bg-surface">
            <MoreRow
              item={{
                icon: Shield,
                href: "/admin",
                label: "Admin console",
                desc: "Reports, moderation and users",
              }}
            />
          </ul>
        </section>
      )}

      <section aria-labelledby="more-follow" className="space-y-2">
        <h2 id="more-follow" className="px-1 text-lg text-fg">
          Follow CampusLoop
        </h2>
        <ul className="flex flex-wrap gap-2">
          {SOCIALS.map(({ key, label, icon: Icon, link }) => (
            <li key={key}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label}, ${link.handle} (opens in a new tab)`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-muted px-4 text-sm font-semibold text-fg transition-ui outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-4" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
