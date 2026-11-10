"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type EventFilters = {
  scope: "ALL" | "MY_CAMPUS";
  mode: string;
  fee: string;
  participation: string;
  hasPrizes: boolean;
  sort: string;
};

export const DEFAULT_EVENT_FILTERS: EventFilters = {
  scope: "ALL",
  mode: "ALL",
  fee: "ALL",
  participation: "ALL",
  hasPrizes: false,
  sort: "trending",
};

const GROUPS: {
  key: Exclude<keyof EventFilters, "hasPrizes">;
  label: string;
  options: [string, string][];
}[] = [
  {
    key: "scope",
    label: "Where",
    options: [
      ["ALL", "All colleges"],
      ["MY_CAMPUS", "My college"],
    ],
  },
  {
    key: "mode",
    label: "Format",
    options: [
      ["ALL", "Any"],
      ["OFFLINE", "On campus"],
      ["ONLINE", "Online"],
      ["HYBRID", "Both"],
    ],
  },
  {
    key: "fee",
    label: "Price",
    options: [
      ["ALL", "Any"],
      ["FREE", "Free"],
      ["PAID", "Paid"],
    ],
  },
  {
    key: "participation",
    label: "Join as",
    options: [
      ["ALL", "Solo or team"],
      ["SOLO", "Solo"],
      ["TEAM", "Team"],
    ],
  },
  {
    key: "sort",
    label: "Sort by",
    options: [
      ["trending", "Popular"],
      ["upcoming", "Starting soon"],
      ["closing_soon", "Closing soon"],
      ["latest", "Newest"],
    ],
  },
];

export function countActiveFilters(filters: EventFilters) {
  return (Object.keys(DEFAULT_EVENT_FILTERS) as (keyof EventFilters)[]).filter(
    (key) => filters[key] !== DEFAULT_EVENT_FILTERS[key]
  ).length;
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-fg">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function EventFiltersSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EventFilters;
  onChange: (next: EventFilters) => void;
  onReset: () => void;
}) {
  const active = countActiveFilters(filters);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-display text-xl font-bold">Filters</SheetTitle>
          <SheetDescription className="text-sm text-fg-muted">
            {active ? `${active} on` : "Showing everything"}
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-5 overflow-y-auto">
          {GROUPS.map((group) => (
            <Group key={group.key} label={group.label}>
              {group.options.map(([value, label]) => (
                <Chip
                  key={value}
                  size="sm"
                  selected={filters[group.key] === value}
                  onClick={() => onChange({ ...filters, [group.key]: value })}
                >
                  {label}
                </Chip>
              ))}
            </Group>
          ))}
          <Group label="Prizes">
            <Chip
              size="sm"
              selected={filters.hasPrizes}
              onClick={() => onChange({ ...filters, hasPrizes: !filters.hasPrizes })}
            >
              Has prizes
            </Chip>
          </Group>
        </SheetBody>
        <SheetFooter className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onReset} disabled={active === 0}>
            Clear all
          </Button>
          <Button onClick={() => onOpenChange(false)}>Show events</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
