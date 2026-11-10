"use client";

import type { DedicatedHubType } from "@/components/communities/hub-types";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  CONDITION_OPTIONS,
  GAME_OPTIONS,
  GAMING_MODE_OPTIONS,
  HUB_BRANCH_OPTIONS,
  HUB_SEMESTER_OPTIONS,
  type HubFormValues,
  RESOURCE_TYPES,
  type ResourceType,
  type SetHubValue,
} from "./hub-create-options";

interface FieldsProps {
  values: HubFormValues;
  set: SetHubValue;
}

function ComboField({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ChipGroup({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-fg">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Chip key={opt.value} selected={value === opt.value} onSelectedChange={() => onChange(opt.value)}>
            {opt.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

function LostFoundFields({ values, set }: FieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-fg">What happened?</span>
        <SegmentedControl
          aria-label="What happened?"
          fullWidth
          value={values.lfType}
          onChange={(v) => set("lfType", v)}
          options={[
            { value: "LOST", label: "I lost it" },
            { value: "FOUND", label: "I found it" },
          ]}
        />
      </div>
      <FormField label="Where">
        <Input
          value={values.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Library, 2nd floor"
        />
      </FormField>
    </div>
  );
}

function MarketplaceFields({ values, set }: FieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <FormField label="Price (₹)" required>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          required
          value={values.price}
          onChange={(e) => set("price", e.target.value)}
          placeholder="1500"
        />
      </FormField>
      <ComboField id="hub-condition" label="Condition">
        <SearchableCombobox
          id="hub-condition"
          options={CONDITION_OPTIONS}
          value={values.condition}
          onChange={(v) => set("condition", v)}
          placeholder="Pick condition"
          clearable={false}
        />
      </ComboField>
      <FormField label="Pickup spot">
        <Input
          value={values.hostelLocation}
          onChange={(e) => set("hostelLocation", e.target.value)}
          placeholder="Hostel 5 common room"
        />
      </FormField>
    </div>
  );
}

function GamingFields({ values, set }: FieldsProps) {
  return (
    <div className="space-y-4">
      <ChipGroup
        legend="Type of match"
        value={values.mode}
        onChange={(v) => set("mode", v)}
        options={GAMING_MODE_OPTIONS}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ComboField id="hub-game" label="Game">
          <SearchableCombobox
            id="hub-game"
            options={GAME_OPTIONS}
            value={values.gameName}
            onChange={(v) => set("gameName", v)}
            placeholder="Pick a game"
            searchPlaceholder="Search games"
            clearable={false}
          />
        </ComboField>
        <FormField label="Team size" hint="Count yourself too." required>
          <Input
            type="number"
            inputMode="numeric"
            required
            min={2}
            max={20}
            value={values.slotsTotal}
            onChange={(e) => set("slotsTotal", e.target.value)}
          />
        </FormField>
        <FormField label="Your in-game ID">
          <Input
            value={values.gamerTag}
            onChange={(e) => set("gamerTag", e.target.value)}
            placeholder="RiotName#TAG"
            autoComplete="off"
          />
        </FormField>
        <FormField label="When">
          <Input
            value={values.scheduledAt}
            onChange={(e) => set("scheduledAt", e.target.value)}
            placeholder="Tonight 10:30 PM"
          />
        </FormField>
      </div>
    </div>
  );
}

function RideshareFields({ values, set }: FieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="From" required>
        <Input
          required
          value={values.origin}
          onChange={(e) => set("origin", e.target.value)}
          placeholder="Main gate"
        />
      </FormField>
      <FormField label="To" required>
        <Input
          required
          value={values.destination}
          onChange={(e) => set("destination", e.target.value)}
          placeholder="Railway station"
        />
      </FormField>
      <FormField label="Leaving at" required>
        <Input
          required
          value={values.departureTime}
          onChange={(e) => set("departureTime", e.target.value)}
          placeholder="Tomorrow 6:30 AM"
        />
      </FormField>
      <FormField label="Cost per person (₹)" required>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          required
          value={values.pricePerSeat}
          onChange={(e) => set("pricePerSeat", e.target.value)}
          placeholder="75"
        />
      </FormField>
    </div>
  );
}

function HousingFields({ values, set }: FieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Rent per month (₹)" required>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          required
          value={values.rentPerMonth}
          onChange={(e) => set("rentPerMonth", e.target.value)}
          placeholder="4500"
        />
      </FormField>
      <FormField label="Distance from campus">
        <Input
          value={values.distanceFromCampus}
          onChange={(e) => set("distanceFromCampus", e.target.value)}
          placeholder="5 min walk from Gate 2"
        />
      </FormField>
    </div>
  );
}

function AcademicsFields({ values, set }: FieldsProps) {
  return (
    <div className="space-y-4">
      <ChipGroup
        legend="Type"
        value={values.resourceType}
        onChange={(v) => set("resourceType", v as ResourceType)}
        options={RESOURCE_TYPES}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Subject code" required>
          <Input
            required
            value={values.subjectCode}
            onChange={(e) => set("subjectCode", e.target.value.toUpperCase())}
            placeholder="CS201"
            autoCapitalize="characters"
          />
        </FormField>
        <FormField label="Subject name" required>
          <Input
            required
            value={values.subjectName}
            onChange={(e) => set("subjectName", e.target.value)}
            placeholder="Data Structures"
          />
        </FormField>
        <ComboField id="hub-branch" label="Branch">
          <SearchableCombobox
            id="hub-branch"
            options={HUB_BRANCH_OPTIONS}
            value={values.branch}
            onChange={(v) => set("branch", v)}
            placeholder="Pick branch"
            searchPlaceholder="Search branch"
            clearable={false}
          />
        </ComboField>
        <ComboField id="hub-semester" label="Semester">
          <SearchableCombobox
            id="hub-semester"
            options={HUB_SEMESTER_OPTIONS}
            value={values.semester}
            onChange={(v) => set("semester", v)}
            placeholder="Pick semester"
            clearable={false}
          />
        </ComboField>
      </div>
      <FormField label="Google Drive or PDF link" hint="Make sure anyone with the link can open it.">
        <Input
          type="url"
          inputMode="url"
          value={values.driveUrl}
          onChange={(e) => set("driveUrl", e.target.value)}
          placeholder="https://drive.google.com/…"
        />
      </FormField>
    </div>
  );
}

export function HubTypeFields({ hubType, ...props }: FieldsProps & { hubType: DedicatedHubType }) {
  switch (hubType) {
    case "lost_found":
      return <LostFoundFields {...props} />;
    case "marketplace":
      return <MarketplaceFields {...props} />;
    case "gaming":
      return <GamingFields {...props} />;
    case "rideshare":
      return <RideshareFields {...props} />;
    case "housing":
      return <HousingFields {...props} />;
    case "academics":
      return <AcademicsFields {...props} />;
    default:
      return null;
  }
}
