"use client";

import { Check } from "lucide-react";
import { QuantityStepper } from "@/components/marketplace/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Addon = { name: string; price: number };

interface ItemSheetProps {
  product: any | null;
  onClose: () => void;
  quantity: number;
  onQuantity: (delta: 1 | -1) => void;
  addons: Addon[];
  onToggleAddon: (addon: Addon) => void;
  total: number;
  onAdd: () => void;
}

/** Pick quantity and add-ons, then add to cart. */
export function ItemSheet({
  product,
  onClose,
  quantity,
  onQuantity,
  addons,
  onToggleAddon,
  total,
  onAdd,
}: ItemSheetProps) {
  const productAddons: Addon[] = Array.isArray(product?.addons) ? product.addons : [];
  return (
    <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        {product && (
          <>
            <SheetHeader>
              <SheetTitle>{product.name}</SheetTitle>
              <p className="text-sm text-fg-muted tabular-nums">₹{product.price}</p>
            </SheetHeader>
            <SheetBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-fg">How many?</span>
                <QuantityStepper
                  value={quantity}
                  label={product.name}
                  onChange={(d) => (d === -1 && quantity <= 1 ? undefined : onQuantity(d))}
                />
              </div>

              {productAddons.length > 0 && (
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-semibold text-fg">Add extra</legend>
                  {productAddons.map((addon) => {
                    const on = addons.some((a) => a.name === addon.name);
                    return (
                      <button
                        key={addon.name}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onToggleAddon(addon)}
                        className={cn(
                          "flex min-h-12 w-full items-center justify-between gap-3 rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          on
                            ? "border-brand bg-brand-subtle text-fg"
                            : "border-border text-fg hover:bg-surface-muted"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "flex size-5 items-center justify-center rounded-sm border-2",
                              on ? "border-brand bg-brand text-brand-fg" : "border-border-strong"
                            )}
                          >
                            {on && <Check className="size-3.5" />}
                          </span>
                          {addon.name}
                        </span>
                        <span className="text-fg-muted tabular-nums">+₹{addon.price}</span>
                      </button>
                    );
                  })}
                </fieldset>
              )}
            </SheetBody>
            <SheetFooter>
              <Button size="lg" className="w-full justify-between" onClick={onAdd}>
                <span>Add to cart</span>
                <span className="tabular-nums">₹{total.toLocaleString("en-IN")}</span>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
