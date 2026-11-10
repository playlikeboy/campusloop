import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { PRODUCTS } from "@/constants/products";

export const metadata: Metadata = {
  title: "Products · CampusLoop",
  description:
    "The CampusLoop app for verified students at Indian colleges, and the open-source Digital Observatory research publication.",
  alternates: { canonical: "https://campusloop.space/products" },
  openGraph: {
    title: "Products · CampusLoop",
    description: "The CampusLoop app and the open-source Digital Observatory.",
    url: "https://campusloop.space/products",
    siteName: "CampusLoop",
    locale: "en_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function ProductsPage() {
  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-fg">What we build</h1>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            Two products from the same small team: a verified campus network for students, and an
            open-source research publication.
          </p>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PRODUCTS.map((product) => (
            <article key={product.id} className="flex flex-col rounded-lg border border-border bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-fg">{product.name}</h2>
                {product.badge && (
                  <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand-text">
                    {product.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-fg-muted">{product.tagline}</p>
              <p className="mt-4 text-sm leading-relaxed text-fg-muted">{product.description}</p>

              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-fg-subtle">Price</dt>
                  <dd className="text-fg">{product.price}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-fg-subtle">For</dt>
                  <dd className="text-fg">{product.audience}</dd>
                </div>
              </dl>

              <ul className="mt-4 space-y-2">
                {product.highlights.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-fg-muted">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-text" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-2">
                {product.external ? (
                  <a
                    href={product.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-1.5 rounded-md bg-brand px-5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
                  >
                    Open {product.name} <ArrowRight className="size-4" aria-hidden />
                  </a>
                ) : (
                  <Link
                    href={product.href}
                    className="inline-flex h-11 items-center gap-1.5 rounded-md bg-brand px-5 text-sm font-semibold text-brand-fg hover:bg-brand-hover"
                  >
                    Open {product.name} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
    </MarketingShell>
  );
}
