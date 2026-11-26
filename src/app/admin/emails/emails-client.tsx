"use client";

import {
  AlertTriangle,
  Loader2,
  Monitor,
  Save,
  Search,
  Send,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fieldClassName, Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EMAIL_PRESETS, type EmailPreset } from "@/lib/email-campaigns/presets";
import {
  type CampaignContent,
  type CampaignVariables,
  renderCampaignEmail,
  unknownVariables,
  VARIABLE_FALLBACKS,
} from "@/lib/email-campaigns/render";
import { DEFAULT_SEGMENT, type SegmentSpec } from "@/lib/email-campaigns/segment-spec";
import { cn } from "@/lib/utils";
import {
  countEmailSegment,
  createEmailCampaign,
  deleteEmailTemplate,
  saveEmailTemplate,
  sendTestEmail,
} from "./actions";
import { CampaignStatusBadge, ProgressBar } from "./campaign-ui";

export interface SavedTemplate extends CampaignContent {
  id: string;
  name: string;
  presetKey: string | null;
  updatedAt: string;
}

export interface CampaignListItem {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  createdAt: string;
}

interface EmailsClientProps {
  templates: SavedTemplate[];
  campaigns: CampaignListItem[];
  colleges: { id: string; name: string; students: number }[];
  branches: { value: string; students: number }[];
  adminEmail: string;
  migrationMissing: boolean;
}

function presetContent(p: EmailPreset): CampaignContent {
  return {
    subject: p.subject,
    preheader: p.preheader,
    heading: p.heading,
    body: p.body,
    buttonLabel: p.buttonLabel ?? "",
    buttonUrl: p.buttonUrl ?? "",
  };
}

const SAMPLE_FALLBACK: CampaignVariables = { first_name: "Aarav", college: "IIT Delhi", username: "aarav_k" };

const labelCls = "text-sm font-semibold text-fg";
const hintCls = "text-xs text-fg-muted";
const cardCls = "rounded-lg border border-border bg-surface p-4 sm:p-5 space-y-4";

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className={cardCls} aria-labelledby={`email-step-${n}`}>
      <div className="space-y-0.5">
        <h2 id={`email-step-${n}`} className="text-lg text-fg">
          <span className="text-fg-muted">{n}.</span> {title}
        </h2>
        {hint && <p className={hintCls}>{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  );
}

export function EmailsClient({ templates, campaigns, colleges, branches, adminEmail, migrationMissing }: EmailsClientProps) {
  const router = useRouter();

  // ── Content ──
  const [content, setContent] = useState<CampaignContent>(() => presetContent(EMAIL_PRESETS[0]));
  const [presetKey, setPresetKey] = useState<string | null>(EMAIL_PRESETS[0].key);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState(EMAIL_PRESETS[0].name);
  const [saving, setSaving] = useState(false);

  // ── Audience ──
  const [segment, setSegment] = useState<SegmentSpec>(() => ({ ...DEFAULT_SEGMENT, ...EMAIL_PRESETS[0].suggestedSegment }));
  const [count, setCount] = useState<number | null>(null);
  const [capped, setCapped] = useState(false);
  const [summary, setSummary] = useState("All students");
  const [counting, setCounting] = useState(false);
  const [sample, setSample] = useState<CampaignVariables | null>(null);
  const [collegeQuery, setCollegeQuery] = useState("");
  const countSeq = useRef(0);

  // ── Send ──
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [testTo, setTestTo] = useState(adminEmail);
  const [testing, setTesting] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (patch: Partial<CampaignContent>) => setContent((c) => ({ ...c, ...patch }));
  const setSeg = (patch: Partial<SegmentSpec>) => setSegment((s) => ({ ...s, ...patch }));

  function loadPreset(p: EmailPreset) {
    setContent(presetContent(p));
    setPresetKey(p.key);
    setTemplateId(null);
    setTemplateName(p.name);
    setSegment({ ...DEFAULT_SEGMENT, ...p.suggestedSegment });
  }

  function loadSaved(t: SavedTemplate) {
    setContent({
      subject: t.subject,
      preheader: t.preheader,
      heading: t.heading,
      body: t.body,
      buttonLabel: t.buttonLabel ?? "",
      buttonUrl: t.buttonUrl ?? "",
    });
    setPresetKey(t.presetKey);
    setTemplateId(t.id);
    setTemplateName(t.name);
    const preset = t.presetKey ? EMAIL_PRESETS.find((p) => p.key === t.presetKey) : undefined;
    if (preset?.suggestedSegment) setSegment({ ...DEFAULT_SEGMENT, ...preset.suggestedSegment });
  }

  // Live audience count, debounced. Stale answers are dropped.
  useEffect(() => {
    if (migrationMissing) return;
    const seq = ++countSeq.current;
    setCounting(true);
    const timer = setTimeout(async () => {
      const res = await countEmailSegment(segment).catch(() => ({ ok: false as const, error: "Could not count" }));
      if (seq !== countSeq.current) return;
      setCounting(false);
      if (res.ok) {
        setCount(res.count);
        setCapped(res.capped);
        setSample(res.sample);
        setSummary(res.summary);
      } else {
        setCount(null);
        toast.error(res.error);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [segment, migrationMissing]);

  const previewVars = sample ?? SAMPLE_FALLBACK;
  const rendered = useMemo(
    () => renderCampaignEmail(content, previewVars, { unsubscribeUrl: "https://campusloop.space/unsubscribe?t=preview" }),
    [content, previewVars]
  );
  const unknown = useMemo(
    () => unknownVariables(content.subject, content.preheader, content.heading, content.body, content.buttonLabel ?? ""),
    [content]
  );

  const filteredColleges = useMemo(() => {
    const q = collegeQuery.trim().toLowerCase();
    const list = q ? colleges.filter((c) => c.name.toLowerCase().includes(q)) : colleges;
    return list.slice(0, 40);
  }, [colleges, collegeQuery]);
  const collegeName = useMemo(() => new Map(colleges.map((c) => [c.id, c.name])), [colleges]);

  async function handleSaveTemplate(asNew: boolean) {
    setSaving(true);
    const res = await saveEmailTemplate({
      id: asNew ? null : templateId,
      name: templateName,
      presetKey,
      content,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setTemplateId(res.id);
    toast.success(asNew || !templateId ? "Template saved" : "Template updated");
    router.refresh();
  }

  async function handleDeleteTemplate(id: string) {
    const res = await deleteEmailTemplate(id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (templateId === id) setTemplateId(null);
    toast.success("Template deleted");
    router.refresh();
  }

  async function handleTest() {
    setTesting(true);
    const res = await sendTestEmail({ to: testTo, content, vars: previewVars });
    setTesting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Test sent to ${testTo}`);
  }

  async function handleSend() {
    if (count === null) return;
    setSending(true);
    const res = await createEmailCampaign({
      name: campaignName || content.subject,
      templateId,
      content,
      segment,
      expectedCount: count,
    });
    setSending(false);
    setConfirmOpen(false);
    if (!res.ok) {
      toast.error(res.error);
      // The audience may have moved: recount so the next confirmation shows the real number.
      setSegment((s) => ({ ...s }));
      return;
    }
    toast.success(`Queued for ${res.total.toLocaleString("en-IN")} people`);
    router.push(`/admin/emails/${res.id}`);
  }

  const canSend = !migrationMissing && count !== null && count > 0 && !capped && !counting && content.subject.trim().length > 0;
  const countLabel = count === null ? "…" : count.toLocaleString("en-IN");

  return (
    <div className="space-y-6">
      {migrationMissing && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-subtle p-4 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Email tables are not in the database yet. Apply <code className="font-mono">drizzle/manual/0017_email_campaigns.sql</code>, then
            reload. You can still try templates and the preview.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Step n={1} title="Pick a template" hint="Start from a ready one or one you saved. You can change everything.">
            <div className="flex flex-wrap gap-2">
              {EMAIL_PRESETS.map((p) => (
                <Chip key={p.key} size="sm" selected={!templateId && presetKey === p.key} onClick={() => loadPreset(p)} title={p.description}>
                  {p.name}
                </Chip>
              ))}
            </div>
            {templates.length > 0 && (
              <div className="space-y-2">
                <p className={labelCls}>Saved templates</p>
                <ul className="divide-y divide-border rounded-md border border-border">
                  {templates.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => loadSaved(t)}
                        className={cn(
                          "min-w-0 flex-1 truncate rounded-sm text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          templateId === t.id ? "font-semibold text-brand-text" : "text-fg"
                        )}
                      >
                        {t.name}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-row"
                        aria-label={`Delete template ${t.name}`}
                        onClick={() => handleDeleteTemplate(t.id)}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Step>

          <Step
            n={2}
            title="Write it"
            hint="Use {{first_name}}, {{college}} and {{username}}. Add a fallback like {{first_name|friend}}."
          >
            <Field id="email-subject" label="Subject">
              <Input id="email-subject" value={content.subject} maxLength={200} onChange={(e) => set({ subject: e.target.value })} />
            </Field>
            <Field id="email-preheader" label="Preheader" hint="The grey line next to the subject in the inbox.">
              <Input id="email-preheader" value={content.preheader} maxLength={200} onChange={(e) => set({ preheader: e.target.value })} />
            </Field>
            <Field id="email-heading" label="Heading">
              <Input id="email-heading" value={content.heading} maxLength={200} onChange={(e) => set({ heading: e.target.value })} />
            </Field>
            <Field
              id="email-body"
              label="Body"
              hint="Blank line = new paragraph. **bold**, *italic*, [link text](https://…), and lines starting with - for a list."
            >
              <textarea
                id="email-body"
                value={content.body}
                maxLength={20000}
                rows={10}
                onChange={(e) => set({ body: e.target.value })}
                className={cn(fieldClassName, "min-h-40 py-2.5 font-mono text-sm leading-6")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="email-button-label" label="Button text">
                <Input
                  id="email-button-label"
                  value={content.buttonLabel ?? ""}
                  maxLength={60}
                  onChange={(e) => set({ buttonLabel: e.target.value })}
                />
              </Field>
              <Field id="email-button-url" label="Button link" hint="https://… or a path like /play">
                <Input
                  id="email-button-url"
                  value={content.buttonUrl ?? ""}
                  maxLength={2000}
                  onChange={(e) => set({ buttonUrl: e.target.value })}
                />
              </Field>
            </div>
            {unknown.length > 0 && (
              <p className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                Unknown variables will be sent as typed: {unknown.map((u) => `{{${u}}}`).join(", ")}
              </p>
            )}
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field id="email-template-name" label="Template name">
                  <Input id="email-template-name" value={templateName} maxLength={120} onChange={(e) => setTemplateName(e.target.value)} />
                </Field>
              </div>
              <div className="flex gap-2">
                {templateId && (
                  <Button type="button" variant="secondary" loading={saving} onClick={() => handleSaveTemplate(false)}>
                    <Save /> Update
                  </Button>
                )}
                <Button type="button" variant="outline" loading={saving} disabled={migrationMissing} onClick={() => handleSaveTemplate(true)}>
                  <Save /> Save as new
                </Button>
              </div>
            </div>
          </Step>

          <Step n={3} title="Choose who gets it" hint="Filters combine with AND. Unsubscribed, suspended, banned, demo and no-email accounts are always left out.">
            <div className="space-y-2">
              <p className={labelCls}>College verification</p>
              <SegmentedControl
                size="sm"
                aria-label="College verification"
                value={segment.verification}
                onChange={(v) => setSeg({ verification: v })}
                options={[
                  { value: "all", label: "Everyone" },
                  { value: "verified", label: "Verified" },
                  { value: "unverified", label: "Not verified" },
                ]}
              />
            </div>

            <div className="space-y-2">
              <p className={labelCls}>Onboarding</p>
              <SegmentedControl
                size="sm"
                aria-label="Onboarding"
                value={segment.onboarding}
                onChange={(v) => setSeg({ onboarding: v })}
                options={[
                  { value: "any", label: "Any" },
                  { value: "finished", label: "Finished" },
                  { value: "not_finished", label: "Not finished" },
                ]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="seg-inactive" label="Inactive for at least (days)" hint="Not seen in the app for this long.">
                <Input
                  id="seg-inactive"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="Any"
                  value={segment.inactiveDays ?? ""}
                  onChange={(e) => setSeg({ inactiveDays: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
                />
              </Field>
              <Field id="seg-joined" label="Joined in the last (days)">
                <Input
                  id="seg-joined"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="Any"
                  value={segment.joinedWithinDays ?? ""}
                  onChange={(e) => setSeg({ joinedWithinDays: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className={labelCls}>Android app</p>
                <SegmentedControl
                  size="sm"
                  aria-label="Android app"
                  value={segment.androidApp}
                  onChange={(v) => setSeg({ androidApp: v })}
                  options={[
                    { value: "any", label: "Any" },
                    { value: "with", label: "Has it" },
                    { value: "without", label: "Does not" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <p className={labelCls}>Play</p>
                <SegmentedControl
                  size="sm"
                  aria-label="Play players"
                  value={segment.play}
                  onChange={(v) => setSeg({ play: v })}
                  options={[
                    { value: "any", label: "Any" },
                    { value: "players", label: "Played" },
                    { value: "non_players", label: "Never" },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className={labelCls}>Year</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((y) => (
                  <Chip
                    key={y}
                    size="sm"
                    selected={segment.years.includes(y)}
                    onSelectedChange={(on) =>
                      setSeg({ years: on ? [...segment.years, y].sort() : segment.years.filter((v) => v !== y) })
                    }
                  >
                    Year {y}
                  </Chip>
                ))}
              </div>
            </div>

            {branches.length > 0 && (
              <div className="space-y-2">
                <p className={labelCls}>Branch</p>
                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                  {branches.map((b) => (
                    <Chip
                      key={b.value}
                      size="sm"
                      count={b.students}
                      selected={segment.branches.includes(b.value)}
                      onSelectedChange={(on) =>
                        setSeg({
                          branches: on ? [...segment.branches, b.value] : segment.branches.filter((v) => v !== b.value),
                        })
                      }
                    >
                      {b.value}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className={labelCls}>Colleges</p>
              {segment.institutionIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {segment.institutionIds.map((id) => (
                    <Chip
                      key={id}
                      size="sm"
                      selected
                      onRemove={() => setSeg({ institutionIds: segment.institutionIds.filter((v) => v !== id) })}
                    >
                      {collegeName.get(id) ?? "College"}
                    </Chip>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
                <Input
                  aria-label="Search colleges"
                  placeholder="Search colleges with students"
                  value={collegeQuery}
                  onChange={(e) => setCollegeQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border">
                {filteredColleges.map((c) => {
                  const checked = segment.institutionIds.includes(c.id);
                  return (
                    <li key={c.id}>
                      <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-surface-muted">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(on) =>
                            setSeg({
                              institutionIds: on
                                ? [...segment.institutionIds, c.id]
                                : segment.institutionIds.filter((v) => v !== c.id),
                            })
                          }
                        />
                        <span className="min-w-0 flex-1 truncate text-fg">{c.name}</span>
                        <span className="shrink-0 text-xs text-fg-muted">{c.students.toLocaleString("en-IN")}</span>
                      </label>
                    </li>
                  );
                })}
                {filteredColleges.length === 0 && <li className="px-3 py-4 text-center text-sm text-fg-muted">No colleges match.</li>}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-muted p-3" aria-live="polite">
              <Users className="size-5 shrink-0 text-fg-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-fg">
                  {counting ? <Loader2 className="inline size-4 animate-spin" aria-label="Counting" /> : countLabel} people
                </p>
                <p className="truncate text-xs text-fg-muted">{summary}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSegment({ ...DEFAULT_SEGMENT })}>
                Clear filters
              </Button>
            </div>
            {capped && <p className="text-sm text-danger">Too many people for one campaign. Narrow it down, for example by college.</p>}
          </Step>
        </div>

        <div className="min-w-0 space-y-6 lg:sticky lg:top-4 lg:self-start">
          <Step n={4} title="Preview and send">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SegmentedControl
                size="sm"
                aria-label="Preview width"
                value={previewWidth}
                onChange={setPreviewWidth}
                options={[
                  { value: "desktop", label: "Desktop", icon: <Monitor /> },
                  { value: "mobile", label: "Mobile", icon: <Smartphone /> },
                ]}
              />
              <p className={hintCls}>
                As {previewVars.first_name || VARIABLE_FALLBACKS.first_name} · {previewVars.college || VARIABLE_FALLBACKS.college}
                {sample ? "" : " (sample)"}
              </p>
            </div>

            <div className="space-y-1 rounded-md border border-border bg-surface-muted p-3">
              <p className="truncate text-sm font-semibold text-fg">{rendered.subject}</p>
              <p className="truncate text-xs text-fg-muted">{rendered.preheader || "No preheader"}</p>
            </div>

            <div className="overflow-x-auto rounded-md border border-border bg-surface-sunken p-2">
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={rendered.html}
                className={cn(
                  "mx-auto block h-[560px] rounded-sm border-0 bg-surface",
                  previewWidth === "mobile" ? "w-[375px] max-w-full" : "w-full min-w-[600px]"
                )}
              />
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <label htmlFor="email-test-to" className={labelCls}>
                Send a test
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="email-test-to"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                />
                <Button type="button" variant="outline" loading={testing} disabled={!testTo.trim()} onClick={handleTest}>
                  <Send /> Send test
                </Button>
              </div>
              <p className={hintCls}>Uses the preview person&apos;s details. The subject starts with [Test].</p>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <Field id="email-campaign-name" label="Campaign name" hint="Only admins see this.">
                <Input
                  id="email-campaign-name"
                  placeholder={content.subject || "e.g. Play launch, November"}
                  value={campaignName}
                  maxLength={120}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </Field>
              <Button type="button" size="lg" className="w-full" disabled={!canSend} onClick={() => setConfirmOpen(true)}>
                <Send /> Send to {countLabel} people
              </Button>
              <p className={hintCls}>Sends in batches of 50 every few minutes. You can cancel while it runs.</p>
            </div>
          </Step>
        </div>
      </div>

      <section className={cardCls} aria-labelledby="email-campaigns-title">
        <h2 id="email-campaigns-title" className="text-lg text-fg">
          Campaigns
        </h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-fg-muted">No campaigns yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {campaigns.map((c) => {
              const done = c.sentCount + c.failedCount + c.skippedCount;
              return (
                <li key={c.id}>
                  <Link
                    href={`/admin/emails/${c.id}`}
                    className="flex flex-col gap-2 rounded-sm py-3 outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-4 sm:px-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{c.name}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {new Date(c.createdAt).toLocaleString("en-IN")} · {c.sentCount.toLocaleString("en-IN")} sent
                        {c.failedCount > 0 ? ` · ${c.failedCount} failed` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:w-64">
                      <ProgressBar value={done} max={c.totalCount} />
                      <CampaignStatusBadge status={c.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        isOpen={confirmOpen}
        variant="warning"
        title={`Send to ${countLabel} people?`}
        description={`"${rendered.subject}" will go to ${countLabel} people: ${summary}. This cannot be undone, but you can cancel before it finishes.`}
        confirmText={`Yes, send to ${countLabel} people`}
        isLoading={sending}
        onConfirm={handleSend}
        onClose={() => setConfirmOpen(false)}
      >
        <Badge variant="neutral">Batches of 50, a few minutes apart</Badge>
      </ConfirmDialog>
    </div>
  );
}
