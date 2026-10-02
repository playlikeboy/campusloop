"use client";

import { Building2, School } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { type ComboboxOption, SearchableCombobox } from "@/components/ui/searchable-combobox";

interface CollegeComboboxProps {
  value: string;
  onChange: (institutionId: string, institutionName?: string) => void;
  initialInstitutions?: Array<{ id: string; name: string; state?: string | null; district?: string | null; nirfRank?: number | null }>;
  initialInstitutionName?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CollegeCombobox({
  value,
  onChange,
  initialInstitutions = [],
  initialInstitutionName,
  placeholder = "Select target university or college hub...",
  className,
  disabled = false,
}: CollegeComboboxProps) {
  const [cachedOptions, setCachedOptions] = useState<ComboboxOption[]>(() => {
    const list: ComboboxOption[] = initialInstitutions.map((inst) => ({
      value: inst.id,
      label: inst.name,
      subtitle: [inst.district, inst.state].filter(Boolean).join(", "),
      badge: inst.nirfRank ? `NIRF #${inst.nirfRank}` : inst.state || undefined,
      icon: <School className="size-3.5 text-primary shrink-0" />,
    }));
    if (value && initialInstitutionName && !list.some((o) => o.value === value)) {
      list.unshift({
        value,
        label: initialInstitutionName,
        icon: <School className="size-3.5 text-primary shrink-0" />,
      });
    }
    return list;
  });

  // If initialInstitutions or initialInstitutionName change, sync cachedOptions
  useEffect(() => {
    setCachedOptions((prev) => {
      const map = new Map<string, ComboboxOption>();
      if (value && initialInstitutionName) {
        map.set(value, {
          value,
          label: initialInstitutionName,
          icon: <School className="size-3.5 text-primary shrink-0" />,
        });
      }
      for (const inst of initialInstitutions) {
        if (!map.has(inst.id)) {
          map.set(inst.id, {
            value: inst.id,
            label: inst.name,
            subtitle: [inst.district, inst.state].filter(Boolean).join(", "),
            badge: inst.nirfRank ? `NIRF #${inst.nirfRank}` : inst.state || undefined,
            icon: <School className="size-3.5 text-primary shrink-0" />,
          });
        }
      }
      for (const opt of prev) {
        if (!map.has(opt.value)) {
          map.set(opt.value, opt);
        }
      }
      return Array.from(map.values());
    });
  }, [initialInstitutions, value, initialInstitutionName]);

  // Async search handler for all 1,350+ institutions
  const handleSearchAsync = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    try {
      const res = await fetch(`/api/colleges?q=${encodeURIComponent(query)}&limit=25`);
      if (!res.ok) return [];

      const data = (await res.json()) as {
        colleges?: Array<{
          id: string;
          name: string;
          state?: string | null;
          district?: string | null;
          nirfRank?: number | null;
        }>;
      };

      const colleges = data.colleges || [];
      return colleges.map((c) => ({
        value: c.id,
        label: c.name,
        subtitle: [c.district, c.state].filter(Boolean).join(", "),
        badge: c.nirfRank ? `NIRF #${c.nirfRank}` : c.state || undefined,
        icon: <Building2 className="size-3.5 text-primary shrink-0" />,
      }));
    } catch (err) {
      console.error("College search failed:", err);
      return [];
    }
  }, []);

  return (
    <SearchableCombobox
      options={cachedOptions}
      value={value}
      onChange={(id) => {
        const selected = cachedOptions.find((o) => o.value === id);
        onChange(id, selected?.label);
      }}
      onSearchAsync={handleSearchAsync}
      placeholder={placeholder}
      searchPlaceholder="Type college name, state, or city (e.g. BIT, IIT, Bangalore)..."
      emptyText="No colleges matching this search. Try city or abbreviation."
      className={className}
      disabled={disabled}
    />
  );
}
