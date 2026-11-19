"use client";

import { SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";
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
import { Switch } from "@/components/ui/switch";

export interface FilterGroup {
  key: string;
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
}

export interface FilterToggle {
  key: string;
  label: string;
  checked: boolean;
}

interface FilterSheetProps {
  title: string;
  groups: FilterGroup[];
  toggle?: FilterToggle;
  onChange: (key: string, value: string) => void;
  onToggle?: (key: string, checked: boolean) => void;
  onClear: () => void;
}

/** "Filters" button that opens a bottom sheet of chip groups. Changes apply right away. */
export function FilterSheet({ title, groups, toggle, onChange, onToggle, onClear }: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const toggleId = useId();
  const activeCount = groups.filter((g) => g.value !== g.options[0]?.id).length + (toggle?.checked ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="shrink-0"
        aria-label={activeCount ? `Filters, ${activeCount} on` : "Filters"}
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        Filters
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-fg tabular-nums">
            {activeCount}
          </span>
        )}
      </Button>
      <SheetContent className="max-h-[85vh] sm:mx-auto sm:max-w-lg sm:rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Results update as you pick.</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-5">
          {groups.map((group) => (
            <fieldset key={group.key} className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-fg">{group.label}</legend>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => (
                  <Chip
                    key={option.id}
                    size="sm"
                    selected={group.value === option.id}
                    onClick={() => onChange(group.key, option.id)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ))}
          {toggle && onToggle && (
            <div className="flex min-h-11 items-center justify-between gap-3">
              <label htmlFor={toggleId} className="text-sm font-semibold text-fg">
                {toggle.label}
              </label>
              <Switch
                id={toggleId}
                checked={toggle.checked}
                onCheckedChange={(checked) => onToggle(toggle.key, checked)}
              />
            </div>
          )}
        </SheetBody>
        <SheetFooter>
          {activeCount > 0 && (
            <Button type="button" variant="ghost" onClick={onClear}>
              Clear filters
            </Button>
          )}
          <Button type="button" onClick={() => setOpen(false)}>
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
