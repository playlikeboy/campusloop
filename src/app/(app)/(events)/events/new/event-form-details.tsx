"use client";

import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownEditor } from "@/components/common/markdown-editor";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AUDIENCE_OPTIONS,
  DESCRIPTION_TEMPLATE,
  type FormSectionProps,
  PARTICIPATION_TYPES,
  SUGGESTED_PERKS,
  toLocalInput,
  VISIBILITY_OPTIONS,
} from "./event-form-options";
import { FormSection, OptionTiles } from "./form-parts";

const DATE_PRESETS = [
  { label: "In 3 days, all day", days: 3, hour: 10, hours: 8 },
  { label: "Next week, 36 hours", days: 7, hour: 9, hours: 36 },
  { label: "In 2 weeks, 4 hours", days: 14, hour: 14, hours: 4 },
];

export function WhenSection({ form, set }: FormSectionProps) {
  function applyPreset(days: number, hour: number, hours: number) {
    const start = new Date();
    start.setDate(start.getDate() + days);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + hours);
    set("startDate", toLocalInput(start));
    set("endDate", toLocalInput(end));
  }

  return (
    <FormSection title="When" hint="Times are in your local time.">
      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((p) => (
          <Chip key={p.label} onClick={() => applyPreset(p.days, p.hour, p.hours)}>
            {p.label}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Starts" required>
          <Input
            type="datetime-local"
            required
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </FormField>
        <FormField label="Ends" required>
          <Input
            type="datetime-local"
            required
            min={form.startDate || undefined}
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
          />
        </FormField>
      </div>
      <FormField label="Sign-ups close" hint="Leave empty to keep sign-ups open until it starts.">
        <Input
          type="datetime-local"
          max={form.startDate || undefined}
          value={form.registrationDeadline}
          onChange={(e) => set("registrationDeadline", e.target.value)}
        />
      </FormField>
    </FormSection>
  );
}

export function WhoSection({ form, set, isExternal }: FormSectionProps) {
  const isTeam = form.participationType === "TEAM" || form.participationType === "BOTH";
  return (
    <FormSection title="Who can join">
      <OptionTiles
        name="participationType"
        legend="Join as"
        options={PARTICIPATION_TYPES}
        value={form.participationType}
        onChange={(v) => set("participationType", v)}
      />
      {isTeam && (
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Smallest team">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={form.minTeamSize}
              onChange={(e) => set("minTeamSize", e.target.value)}
            />
          </FormField>
          <FormField label="Biggest team">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={form.maxTeamSize}
              onChange={(e) => set("maxTeamSize", e.target.value)}
            />
          </FormField>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Spots" hint="Leave empty for no limit.">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={form.maxParticipants}
            onChange={(e) => set("maxParticipants", e.target.value)}
          />
        </FormField>
        <FormField label="Loop Points for attendees" hint="Up to 200.">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={form.loopPointsReward}
            onChange={(e) => set("loopPointsReward", e.target.value)}
          />
        </FormField>
      </div>
      <div className="space-y-3">
        <FormField
          label="Charge an entry fee"
          className="min-h-11 flex-row items-center justify-between gap-3"
        >
          <Switch checked={form.isPaid} onCheckedChange={(checked) => set("isPaid", checked)} />
        </FormField>
        {form.isPaid && (
          <FormField label="Fee">
            <Input
              placeholder="e.g. ₹150 per team"
              value={form.entryFee}
              onChange={(e) => set("entryFee", e.target.value)}
            />
          </FormField>
        )}
      </div>
      {!isExternal && (
        <OptionTiles
          name="audience"
          legend="Open to"
          options={AUDIENCE_OPTIONS}
          value={form.isAllColleges ? "ALL" : "MINE"}
          onChange={(v) => set("isAllColleges", v === "ALL")}
          columns="sm:grid-cols-2"
        />
      )}
      <OptionTiles
        name="visibility"
        legend="Who can see it"
        options={VISIBILITY_OPTIONS}
        value={form.visibility}
        onChange={(v) => set("visibility", v)}
      />
    </FormSection>
  );
}

export function PrizesSection({ form, set }: FormSectionProps) {
  const [custom, setCustom] = useState("");
  const togglePerk = (perk: string) =>
    set("perks", form.perks.includes(perk) ? form.perks.filter((p) => p !== perk) : [...form.perks, perk]);
  const customPerks = form.perks.filter((p) => !SUGGESTED_PERKS.some((s) => s.label === p));

  function addCustom() {
    const clean = custom.trim();
    if (clean && !form.perks.includes(clean)) set("perks", [...form.perks, clean]);
    setCustom("");
  }

  return (
    <FormSection title="Prizes and perks">
      <FormField label="Prizes">
        <Input
          placeholder="e.g. Certificates for all, prizes for the top 3"
          value={form.prizesDescription}
          onChange={(e) => set("prizesDescription", e.target.value)}
        />
      </FormField>
      <fieldset>
        <legend className="text-sm font-semibold text-fg">What everyone gets</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_PERKS.map(({ label, icon: Icon }) => (
            <Chip
              key={label}
              icon={<Icon aria-hidden="true" />}
              selected={form.perks.includes(label)}
              onClick={() => togglePerk(label)}
            >
              {label}
            </Chip>
          ))}
          {customPerks.map((perk) => (
            <Chip key={perk} selected onClick={() => togglePerk(perk)}>
              {perk}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className="flex items-end gap-2">
        <FormField label="Add your own" className="flex-1">
          <Input
            placeholder="e.g. Goodies for finalists"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
        </FormField>
        <Button type="button" variant="secondary" onClick={addCustom}>
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>
    </FormSection>
  );
}

export function DetailsSection({ form, set }: FormSectionProps) {
  return (
    <FormSection
      title="Details"
      hint="Schedule, rules, what to bring, how winners are picked."
      action={
        !form.description.trim() && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              set("description", DESCRIPTION_TEMPLATE);
              toast.success("Template added. Edit it to fit your event.");
            }}
          >
            <FileText aria-hidden="true" />
            Use a template
          </Button>
        )
      }
    >
      <MarkdownEditor
        value={form.description}
        onChange={(v) => set("description", v)}
        required
        rows={14}
        stickyTopClass="top-16"
        placeholder="Write the details here."
      />
    </FormSection>
  );
}
