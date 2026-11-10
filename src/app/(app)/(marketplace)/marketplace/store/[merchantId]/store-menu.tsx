"use client";

import { Leaf, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { VegMark } from "@/components/marketplace/product-row";
import { SearchInput } from "@/components/marketplace/search-input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { sounds } from "@/lib/sounds";

interface StoreMenuProps {
  products: any[];
  storeOpen: boolean;
  onPick: (product: any) => void;
}

/** Menu search, category chips and the grouped item list. */
export function StoreMenu({ products, storeOpen, onPick }: StoreMenuProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [vegOnly, setVegOnly] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoryName).filter(Boolean))) as string[],
    [products]
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = products.filter((p) => {
      if (category !== "all" && p.categoryName !== category) return false;
      if (vegOnly && !p.isVeg) return false;
      if (q) return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      return true;
    });
    if (category !== "all" || q)
      return shown.length ? [{ category: category === "all" ? "Results" : category, items: shown }] : [];
    const map: Record<string, any[]> = {};
    for (const p of shown) {
      const key = p.categoryName || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return Object.entries(map).map(([c, items]) => ({ category: c, items }));
  }, [products, category, vegOnly, query]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search the menu"
          placeholder="Search the menu"
        />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip
            size="sm"
            selected={vegOnly}
            icon={<Leaf />}
            onClick={() => {
              sounds.tap();
              setVegOnly((v) => !v);
            }}
          >
            Veg only
          </Chip>
          {["all", ...categories].map((c) => (
            <Chip
              key={c}
              size="sm"
              selected={category === c}
              onClick={() => {
                sounds.tap();
                setCategory(c);
              }}
            >
              {c === "all" ? "All" : c}
            </Chip>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          size="compact"
          icon={UtensilsCrossed}
          title={products.length ? "Nothing matches" : "No menu yet"}
          description={
            products.length ? "Try another word or category." : "This store hasn't added items yet."
          }
        />
      ) : (
        groups.map((g) => (
          <section key={g.category} aria-label={g.category}>
            <h3 className="font-sans text-sm font-semibold text-fg-muted">
              {g.category} <span className="font-normal tabular-nums">{g.items.length}</span>
            </h3>
            <ul className="divide-y divide-border">
              {g.items.map((p) => {
                const available = storeOpen && p.isAvailable !== false;
                return (
                  <li key={p.id} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {p.isVeg != null && <VegMark isVeg={!!p.isVeg} />}
                        <h4 className="font-sans text-sm font-semibold text-fg">{p.name}</h4>
                      </div>
                      <p className="flex items-baseline gap-1.5 text-sm tabular-nums">
                        <span className="font-semibold text-fg">₹{p.price}</span>
                        {p.originalPrice && p.originalPrice > p.price ? (
                          <span className="text-xs text-fg-subtle line-through">₹{p.originalPrice}</span>
                        ) : null}
                      </p>
                      {p.description && <p className="line-clamp-2 text-sm text-fg-muted">{p.description}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-2">
                      {p.imageUrl && (
                        <div className="size-20 overflow-hidden rounded-md bg-surface-muted">
                          <img src={p.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!available}
                        onClick={() => onPick(p)}
                        aria-label={
                          available
                            ? `Add ${p.name}`
                            : p.isAvailable === false
                              ? `${p.name} is sold out`
                              : `Can't add ${p.name}, the store is closed`
                        }
                        className="min-h-11"
                      >
                        {p.isAvailable === false ? "Sold out" : "Add"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
