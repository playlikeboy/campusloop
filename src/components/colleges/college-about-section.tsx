import Link from "next/link";
import { type CollegeFactsInput, collegeFacts, collegeFaqs, collegeShortName, collegeSummary } from "./college-facts";

interface NearbyLink {
  id: string;
  name: string;
  slug: string;
}

interface EventLink {
  id: string;
  slug: string | null;
  title: string;
  startDate: Date | string;
}

interface NoteLink {
  id: string;
  title: string;
  subjectName?: string | null;
}

interface CollegeAboutSectionProps {
  facts: CollegeFactsInput;
  description?: string | null;
  state?: string | null;
  nearby: NearbyLink[];
  /** Public events hosted at this college, newest first. */
  events?: EventLink[];
  /** Top study material from this college. */
  notes?: NoteLink[];
}

const linkCard =
  "block rounded-md border border-border bg-surface px-3 py-2.5 text-sm transition-ui hover:bg-surface-muted";

/**
 * Always-rendered facts, description, FAQ and nearby colleges for a college
 * page. A server component, so the text is in the HTML whichever tab is open.
 */
export function CollegeAboutSection({
  facts,
  description,
  state,
  nearby,
  events = [],
  notes = [],
}: CollegeAboutSectionProps) {
  const short = collegeShortName(facts.name);
  const rows = collegeFacts(facts);
  const faqs = collegeFaqs(facts);

  return (
    <div className="space-y-8 border-t border-border pt-6">
      <section aria-labelledby="about-college" className="space-y-3">
        <h2 id="about-college" className="text-xl font-bold text-fg">
          About {short}
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-fg-muted">
          {description?.trim() || collegeSummary(facts)}
        </p>
        {rows.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-6 rounded-lg border border-border bg-surface px-4 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
                <dt className="shrink-0 text-sm text-fg-muted">{row.label}</dt>
                <dd className="min-w-0 text-right text-sm font-semibold break-words text-fg">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section aria-labelledby="college-faq" className="space-y-3">
        <h2 id="college-faq" className="text-xl font-bold text-fg">
          Questions about {short} on CampusLoop
        </h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {faqs.map((faq) => (
            <details key={faq.q} className="group px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-fg marker:hidden">
                {faq.q}
              </summary>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-fg-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {events.length > 0 && (
        <nav aria-label={`Events at ${short}`} className="space-y-3">
          <h2 className="text-xl font-bold text-fg">Events at {short}</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {events.map((ev) => (
              <li key={ev.id}>
                <Link href={`/e/${ev.slug || ev.id}`} className={linkCard}>
                  <span className="block truncate font-semibold text-fg">{ev.title}</span>
                  <span className="block text-fg-muted tabular-nums">
                    {new Date(ev.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/events"
                className="block rounded-md px-3 py-2.5 text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
              >
                See all events
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {notes.length > 0 && (
        <nav aria-label={`Notes and PYQs from ${short}`} className="space-y-3">
          <h2 className="text-xl font-bold text-fg">Notes and PYQs from {short}</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {notes.map((note) => (
              <li key={note.id}>
                <Link href={`/academics/study-material/${note.id}`} className={linkCard}>
                  <span className="block truncate font-semibold text-fg">{note.title}</span>
                  {note.subjectName && <span className="block truncate text-fg-muted">{note.subjectName}</span>}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/academics"
                className="block rounded-md px-3 py-2.5 text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
              >
                Browse all study material
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {nearby.length > 0 && (
        <nav aria-label={`More colleges in ${state ?? "this state"}`} className="space-y-3">
          <h2 className="text-xl font-bold text-fg">More colleges in {state ?? "this state"}</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {nearby.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/college/${c.slug || c.id}`}
                  className="block truncate rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-fg transition-ui hover:bg-surface-muted"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/colleges"
                className="block rounded-md px-3 py-2.5 text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
              >
                See all colleges
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
