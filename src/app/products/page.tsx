import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/marketing/page-hero";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  PRODUCT_GROUPS,
  PRODUCTS,
  type ProductInfo,
  productBadge,
} from "@/constants/products";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Apps",
  description:
    "Every app from the CampusLoop team: CampusLoop, Atlas, DSALoop, Opportunities, Fillim, Daksha, Sketchflow, IndexFast and more.",
  path: "/products",
});

const FLAGSHIP = PRODUCTS.find((p) => p.id === "app");

function ProductCard({ product }: { product: ProductInfo }) {
  const Icon = product.icon;
  const badge = productBadge(product);
  const linkClass = cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto");
  const label = (
    <>
      Open {product.name}
      {product.external ? <ArrowUpRight aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
    </>
  );

  return (
    <article className="flex flex-col rounded-lg border border-border bg-surface p-5 transition-ui hover:border-border-strong">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-muted text-fg">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl text-fg">{product.name}</h3>
            {badge && <Badge variant={product.status === "beta" ? "warning" : "neutral"}>{badge}</Badge>}
          </div>
          {product.host && <p className="truncate text-sm text-fg-subtle">{product.host}</p>}
        </div>
      </div>

      <p className="mt-4 font-medium text-fg">{product.tagline}</p>
      <p className="mt-1.5 text-sm text-fg-muted">{product.description}</p>

      <ul className="mt-4 space-y-1.5">
        {product.highlights.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-fg-muted">
            <Check className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-fg-subtle">Price</dt>
          <dd className="text-fg">{product.price}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">For</dt>
          <dd className="text-fg">{product.audience}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        {product.external ? (
          <a href={product.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {label}
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <Link href={product.href} className={linkClass}>
            {label}
          </Link>
        )}
      </div>
    </article>
  );
}

export default function ProductsPage() {
  const others = PRODUCTS.filter((p) => p.id !== "app");

  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Apps", path: "/products" }])} />
      <div className="mx-auto w-full max-w-5xl px-[var(--gutter)] py-12 sm:py-16">
        <PageIntro
          title="Our apps"
          lede={`${PRODUCTS.length} apps from one small team. Start with CampusLoop, then pick what helps you build, study or ship.`}
        />

        {FLAGSHIP && (
          <section
            aria-labelledby="flagship"
            className="mt-10 flex flex-col gap-6 rounded-lg border border-border bg-surface p-6 sm:flex-row sm:items-center sm:p-8"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-fg">
              <FLAGSHIP.icon className="size-7" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="flagship" className="text-2xl text-fg sm:text-3xl">
                {FLAGSHIP.name}
              </h2>
              <p className="mt-1 font-medium text-fg">{FLAGSHIP.tagline}</p>
              <p className="mt-2 text-fg-muted">{FLAGSHIP.description}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <Link href={FLAGSHIP.href} className={buttonVariants()}>
                Open CampusLoop
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/download" className={buttonVariants({ variant: "ghost" })}>
                Get the Android app
              </Link>
            </div>
          </section>
        )}

        {PRODUCT_GROUPS.map((group) => {
          const items = others.filter((p) => p.group === group.id);
          if (items.length === 0) return null;
          return (
            <section key={group.id} aria-labelledby={`group-${group.id}`} className="mt-14">
              <h2 id={`group-${group.id}`} className="text-2xl text-fg">
                {group.title}
              </h2>
              <p className="mt-1 text-fg-muted">{group.lede}</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </MarketingShell>
  );
}
