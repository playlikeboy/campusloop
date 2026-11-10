"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { sounds } from "@/lib/sounds";

export type ProductAddon = { id?: string; name: string; price: number };

const SUGGESTED: ProductAddon[] = [
  { name: "Extra cheese", price: 20 },
  { name: "Extra egg", price: 15 },
  { name: "Peri-peri", price: 10 },
  { name: "Schezwan dip", price: 15 },
  { name: "Butter", price: 15 },
];

/** Extras a student can add to an item, like "Extra cheese +₹20". */
export function AddonEditor({
  addons,
  onChange,
}: {
  addons: ProductAddon[];
  onChange: (a: ProductAddon[]) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  function add(addon: ProductAddon) {
    if (!addon.name.trim() || Number.isNaN(addon.price) || addon.price < 0) {
      toast.error("Add a name and a price (0 or more).");
      return;
    }
    if (addons.some((a) => a.name.toLowerCase() === addon.name.trim().toLowerCase())) {
      toast.error("That extra is already added.");
      return;
    }
    sounds.tap();
    onChange([...addons, { name: addon.name.trim(), price: addon.price }]);
  }

  return (
    <div className="space-y-3">
      {addons.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {addons.map((a, i) => (
            <li
              key={`${a.name}-${i}`}
              className="flex items-center justify-between gap-3 py-1 pr-1 pl-3 text-sm"
            >
              <span className="text-fg">{a.name}</span>
              <span className="flex items-center gap-1">
                <span className="tabular-nums text-fg-muted">+₹{a.price}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${a.name}`}
                  onClick={() => onChange(addons.filter((_, j) => j !== i))}
                >
                  <X />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          aria-label="Extra name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Extra, e.g. Extra mayo"
          className="flex-1"
        />
        <Input
          aria-label="Extra price in rupees"
          type="number"
          inputMode="numeric"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="₹"
          className="w-20"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            add({ name, price: Number.parseInt(price, 10) });
            if (name.trim() && price) {
              setName("");
              setPrice("");
            }
          }}
        >
          <Plus />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED.filter((s) => !addons.some((a) => a.name.toLowerCase() === s.name.toLowerCase())).map(
          (s) => (
            <Chip key={s.name} onClick={() => add(s)} icon={<Plus />}>
              {s.name} ₹{s.price}
            </Chip>
          )
        )}
      </div>
    </div>
  );
}
