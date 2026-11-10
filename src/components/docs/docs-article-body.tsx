import { Check } from "lucide-react";
import type { DocsFeature } from "@/lib/docs-features";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl text-fg sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

const prose = "space-y-3 whitespace-pre-line text-base leading-[1.75] text-fg-muted sm:text-lg";

/** The body of one "how it works" page: problem, approach, steps, promises and FAQ. */
export function DocsArticleBody({ feature }: { feature: DocsFeature }) {
  return (
    <article className="max-w-[70ch] space-y-12 text-fg">
      <div className={prose}>{feature.hook}</div>

      {feature.takeaways.length > 0 && (
        <section aria-label="In short" className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-lg text-fg">In short</h2>
          <ul className="mt-3 space-y-2">
            {feature.takeaways.map((t) => (
              <li key={t} className="flex gap-2.5 text-sm text-fg-muted sm:text-base">
                <Check aria-hidden className="mt-1 size-4 shrink-0 text-fg-subtle" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Section title="The problem">
        <div className={prose}>{feature.problem}</div>
      </Section>

      <Section title="What we do differently">
        <div className={prose}>{feature.shift}</div>
      </Section>

      <Section title="How it works">
        <ol className="space-y-4">
          {feature.howItWorks.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-sm font-semibold text-brand-text tabular-nums"
              >
                {i + 1}
              </span>
              <p className="pt-0.5 text-base text-fg">{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What stays true">
        <ul className="space-y-2.5">
          {feature.proofPoints.map((p) => (
            <li key={p} className="flex gap-2.5 text-base text-fg-muted">
              <Check aria-hidden className="mt-1 size-4 shrink-0 text-verified-text" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Section>

      <blockquote className="border-y border-border py-6 font-display text-2xl leading-snug font-bold text-fg text-balance">
        &ldquo;{feature.viralQuote}&rdquo;
      </blockquote>

      <Section title="Questions">
        <div className="divide-y divide-border border-y border-border">
          {feature.faq.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex min-h-12 cursor-pointer items-center py-3 text-base font-semibold text-fg transition-ui group-open:text-brand-text">
                {f.q}
              </summary>
              <p className="pb-4 text-base text-fg-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </article>
  );
}
