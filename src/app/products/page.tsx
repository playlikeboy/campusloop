import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/marketing/page-hero";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PRODUCTS } from "@/constants/products";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata = buildMetadata({
  title: "Products",
  description:
    "What the CampusLoop team makes: the CampusLoop app for college students, and the open-source Digital Observatory.",
  path: "/products",
});

export default function ProductsPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Products", path: "/products" }])} />
      <div className="mx-auto w-full max-w-5xl px-[var(--gutter)] py-12 sm:py-16">
        <PageIntro title="What we make" lede="Two products from one small team." />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PRODUCTS.map((product) => {
            const cta = (
              <>
                Open {product.name}
                <ArrowRight aria-hidden="true" />
              </>
            );
            return (
              <article
                key={product.id}
                className="flex flex-col rounded-lg border border-border bg-surface p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl text-fg">{product.name}</h2>
                  {product.badge && <Badge variant="neutral">{product.badge}</Badge>}
                </div>
                <p className="mt-1 font-medium text-fg">{product.tagline}</p>
                <p className="mt-3 text-fg-muted">{product.description}</p>

                <dl className="mt-4 grid gap-1.5 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-fg-subtle">Price</dt>
                    <dd className="text-fg">{product.price}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-16 shrink-0 text-fg-subtle">For</dt>
                    <dd className="text-fg">{product.audience}</dd>
                  </div>
                </dl>

                <ul className="mt-4 space-y-2">
                  {product.highlights.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-fg-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  {product.external ? (
                    <a
                      href={product.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants()}
                    >
                      {cta}
                    </a>
                  ) : (
                    <Link href={product.href} className={buttonVariants()}>
                      {cta}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </MarketingShell>
  );
}
