"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Search field with a leading icon and a screen-reader label. */
export function SearchInput({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-subtle"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-11"
      />
    </label>
  );
}
