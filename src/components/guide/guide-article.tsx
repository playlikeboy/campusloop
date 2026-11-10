import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import type { GuideEntry } from "@/lib/guide/types";

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-12 scroll-mt-24">
      <h2 id={`${id}-title`} className="text-2xl text-fg">
        {title}
      </h2>
      <div className="mt-3 text-base">{children}</div>
    </section>
  );
}

const linkRow =
  "block rounded-lg border border-border bg-surface p-4 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const pagerLink =
  "rounded-md p-2 transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** One guide, task first: steps, then why, examples, privacy, questions. */
export function GuideArticle({
  guide: g,
  prev,
  next,
  related,
}: {
  guide: GuideEntry;
  prev?: GuideEntry;
  next?: GuideEntry;
  related: GuideEntry[];
}) {
  const appRoutes = g.routes.filter((r) => !r.path.includes("["));

  return (
    <article>
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/guide"
              className="inline-flex min-h-11 items-center gap-1 rounded-sm hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" /> Guide
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>{g.category}</li>
        </ol>
      </nav>

      <header className="mt-4">
        <h1 className="text-balance text-4xl text-fg sm:text-5xl">{g.title}</h1>
        <p className="mt-3 text-pretty text-lg text-fg-muted">{g.summary}</p>
        <p className="mt-3 text-sm text-fg-subtle">
          For {g.audiences.join(", ").toLowerCase()} · Updated{" "}
          <time dateTime={g.updated}>{formatDate(g.updated)}</time>
        </p>
        {appRoutes.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {appRoutes.slice(0, 3).map((r, i) => (
              <Link
                key={r.path}
                href={r.path}
                className={buttonVariants({ variant: i === 0 ? "primary" : "outline" })}
              >
                Open {r.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <Block id="how" title="How to use it">
        <ol className="space-y-4">
          {g.howToUse.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold tabular-nums text-fg"
              >
                {i + 1}
              </span>
              <span className="pt-1 text-fg">{step}</span>
            </li>
          ))}
        </ol>
        {g.tips && g.tips.length > 0 && (
          <div className="mt-6 rounded-lg bg-surface-muted p-4">
            <h3 className="font-sans text-sm font-semibold text-fg">Tips</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-fg-muted">
              {g.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </Block>

      <Block id="why" title="Why use it">
        <p className="text-fg-muted">{g.purpose}</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-fg marker:text-fg-subtle">
          {g.whyUse.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </Block>

      <Block id="cases" title="Who uses it">
        <dl className="divide-y divide-border border-y border-border">
          {g.useCases.map((u) => (
            <div key={u.scenario} className="py-3">
              <dt className="font-semibold text-fg">{u.who}</dt>
              <dd className="mt-0.5 text-fg-muted">{u.scenario}</dd>
            </div>
          ))}
        </dl>
      </Block>

      {g.privacy && g.privacy.length > 0 && (
        <Block id="privacy" title="Privacy">
          <ul className="list-disc space-y-1.5 pl-5 text-fg-muted">
            {g.privacy.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Block>
      )}

      <Block id="faq" title="Questions">
        <dl className="space-y-5">
          {g.faq.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-fg">{f.q}</dt>
              <dd className="mt-1 text-fg-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block id="value" title="For investors">
        <p className="text-fg-muted">{g.investorAngle}</p>
      </Block>

      {(related.length > 0 || g.essaySlug) && (
        <Block id="related" title="Related guides">
          <ul className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/guide/${r.slug}`} className={linkRow}>
                  <span className="block font-semibold text-fg">{r.title}</span>
                  <span className="mt-0.5 block text-sm text-fg-muted">{r.summary}</span>
                </Link>
              </li>
            ))}
            {g.essaySlug && (
              <li>
                <Link href={`/docs/${g.essaySlug}`} className={linkRow}>
                  <span className="block font-semibold text-fg">How it's built</span>
                  <span className="mt-0.5 block text-sm text-fg-muted">
                    The engineering write-up for {g.title}.
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </Block>
      )}

      <nav
        aria-label="More guides"
        className="mt-14 grid grid-cols-2 gap-3 border-t border-border pt-6 text-sm"
      >
        {prev ? (
          <Link href={`/guide/${prev.slug}`} className={pagerLink}>
            <span className="flex items-center gap-1 text-fg-muted">
              <ArrowLeft className="size-3.5" aria-hidden="true" /> Previous
            </span>
            <span className="font-semibold text-fg">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/guide/${next.slug}`} className={`${pagerLink} text-right`}>
            <span className="flex items-center justify-end gap-1 text-fg-muted">
              Next <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
            <span className="font-semibold text-fg">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
