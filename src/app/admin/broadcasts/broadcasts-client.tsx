"use client";

import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Megaphone,
  Monitor,
  Radio,
  RefreshCw,
  School,
  Search,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CollegeCombobox } from "@/components/common/college-combobox";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fieldClassName } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface BroadcastItem {
  id: string;
  title: string | null;
  body: string;
  scope: string;
  status?: string;
  createdAt: string | Date | null;
  institutionName?: string | null;
  institutionLocation?: string | null;
}

interface BroadcastsClientProps {
  institutions: Array<{
    id: string;
    name: string;
    state?: string | null;
    district?: string | null;
    nirfRank?: number | null;
  }>;
  recentBroadcasts: BroadcastItem[];
}

export function BroadcastsClient({ institutions, recentBroadcasts }: BroadcastsClientProps) {
  // Form State
  const [scope, setScope] = useState<"INDIA" | "CAMPUS">("INDIA");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(institutions[0]?.id || "");
  const [selectedInstitutionName, setSelectedInstitutionName] = useState(
    institutions[0]?.name || "Target Campus"
  );
  const [priority, setPriority] = useState<"INFO" | "ANNOUNCEMENT" | "WARNING" | "URGENT">("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [pinToTop, setPinToTop] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  // Simulator View State
  const [previewSurface, setPreviewSurface] = useState<"DESKTOP_FEED" | "MOBILE_CARD" | "PUSH_NOTIFICATION">(
    "DESKTOP_FEED"
  );

  // Management Matrix State
  const [broadcastsList, setBroadcastsList] = useState<BroadcastItem[]>(recentBroadcasts);
  const [tableSearch, setTableSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "INDIA" | "CAMPUS">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "ARCHIVED">("ALL");
  const [isRetractingId, setIsRetractingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Filtered Management List
  const filteredBroadcasts = useMemo(() => {
    return broadcastsList.filter((item) => {
      const matchesSearch =
        !tableSearch.trim() ||
        item.title?.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.body.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.institutionName?.toLowerCase().includes(tableSearch.toLowerCase());

      const matchesScope = scopeFilter === "ALL" || item.scope === scopeFilter;
      const itemStatus = item.status || "PUBLISHED";
      const matchesStatus = statusFilter === "ALL" || itemStatus === statusFilter;

      return matchesSearch && matchesScope && matchesStatus;
    });
  }, [broadcastsList, tableSearch, scopeFilter, statusFilter]);

  // Priority Styles Config
  const priorityConfig = {
    INFO: {
      label: "Info",
      badge: "Info",
      border: "border-brand/30",
      bg: "bg-brand-subtle",
      text: "text-brand-text",
      accent: "bg-brand",
      icon: Info,
    },
    ANNOUNCEMENT: {
      label: "Announcement",
      badge: "Announcement",
      border: "border-brand-subtle-border",
      bg: "bg-brand-subtle",
      text: "text-brand-text",
      accent: "bg-brand",
      icon: Megaphone,
    },
    WARNING: {
      label: "Advisory",
      badge: "Advisory",
      border: "border-warning/30",
      bg: "bg-warning-subtle",
      text: "text-warning",
      accent: "bg-warning",
      icon: AlertTriangle,
    },
    URGENT: {
      label: "Urgent",
      badge: "Urgent",
      border: "border-danger/30",
      bg: "bg-danger-subtle",
      text: "text-danger",
      accent: "bg-danger",
      icon: ShieldAlert,
    },
  };

  const activeConfig = priorityConfig[priority];
  const ActiveIcon = activeConfig.icon;

  async function handlePublish() {
    if (!title.trim() || !message.trim()) {
      toast.error("Add a headline and a message first.");
      return;
    }

    if (actionLabel.trim() && !actionUrl.trim()) {
      toast.error("Add a link for the button, or clear the button label.");
      return;
    }

    sounds.pop();
    haptics.heavy();
    setIsPublishing(true);

    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          scope,
          institutionId: scope === "CAMPUS" ? selectedInstitutionId : undefined,
          priority,
          sendNotification,
          actionLabel: actionLabel.trim() || undefined,
          actionUrl: actionUrl.trim() || undefined,
          bannerImageUrl: bannerImageUrl.trim() || undefined,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to publish broadcast");

      toast.success(data.message || "Broadcast published");

      if (data.broadcastPost) {
        const newPost: BroadcastItem = {
          id: data.broadcastPost.id,
          title: data.broadcastPost.title,
          body: data.broadcastPost.body,
          scope: data.broadcastPost.scope,
          status: "PUBLISHED",
          createdAt: new Date().toISOString(),
          institutionName: scope === "CAMPUS" ? selectedInstitutionName : "All Campuses",
        };
        setBroadcastsList((prev) => [newPost, ...prev]);
      }

      // Reset form
      setTitle("");
      setMessage("");
      setActionLabel("");
      setActionUrl("");
      setBannerImageUrl("");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish broadcast");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleToggleStatus(item: BroadcastItem) {
    const isCurrentlyArchived = item.status === "ARCHIVED";
    const nextStatus = isCurrentlyArchived ? "PUBLISHED" : "ARCHIVED";

    setIsRetractingId(item.id);
    sounds.tap();
    haptics.medium();

    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to update broadcast status");

      toast.success(data.message || "Broadcast updated");
      setBroadcastsList((prev) => prev.map((b) => (b.id === item.id ? { ...b, status: nextStatus } : b)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update broadcast");
    } finally {
      setIsRetractingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this broadcast?")) return;

    setIsDeletingId(id);
    sounds.tap();
    haptics.heavy();

    try {
      const res = await fetch(`/api/admin/broadcasts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to delete broadcast");

      toast.success(data.message || "Broadcast deleted permanently.");
      setBroadcastsList((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete broadcast");
    } finally {
      setIsDeletingId(null);
    }
  }

  function handleCopyShareLink(id: string) {
    const url = `${window.location.origin}/post/${id}`;
    navigator.clipboard.writeText(url);
    sounds.pop();
    toast.success("Link copied");
  }

  return (
    <div className="space-y-10">
      {/* Composer and preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Composer */}
        <div className="lg:col-span-7 p-6 rounded-lg bg-surface border border-border space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-brand-text" />
              New broadcast
            </h3>
            <p className="text-xs text-fg-muted mt-0.5">Write a notice and choose who sees it.</p>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-fg-muted flex items-center gap-1.5">
              <Globe className="size-3.5 text-brand-text" />
              <span>Who sees it</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setScope("INDIA");
                }}
                className={cn(
                  "p-3.5 rounded-lg border text-left transition-colors cursor-pointer space-y-1",
                  scope === "INDIA"
                    ? "border-brand bg-brand-subtle text-brand-text ring-1 ring-ring"
                    : "border-border bg-surface-muted text-fg-muted hover:text-fg hover:bg-surface-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Every college
                  </span>
                  {scope === "INDIA" && <Check className="size-3.5 text-brand-text" />}
                </div>
                <p className="text-xs text-fg-muted leading-normal">
                  Shown to students at every college on CampusLoop
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setScope("CAMPUS");
                }}
                className={cn(
                  "p-3.5 rounded-lg border text-left transition-colors cursor-pointer space-y-1",
                  scope === "CAMPUS"
                    ? "border-brand bg-brand-subtle text-brand-text ring-1 ring-ring"
                    : "border-border bg-surface-muted text-fg-muted hover:text-fg hover:bg-surface-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5" />
                    One college
                  </span>
                  {scope === "CAMPUS" && <Check className="size-3.5 text-brand-text" />}
                </div>
                <p className="text-xs text-fg-muted leading-normal">Only students at the college you pick</p>
              </button>
            </div>
          </div>

          {/* Searchable College Picker if Scope is CAMPUS */}
          {scope === "CAMPUS" && (
            <div className="space-y-1.5 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-fg-muted flex items-center gap-1.5">
                  <Search className="size-3 text-brand-text" />
                  <span>College</span>
                </label>
              </div>
              <CollegeCombobox
                value={selectedInstitutionId}
                initialInstitutionName={selectedInstitutionName}
                initialInstitutions={institutions}
                onChange={(id, name) => {
                  setSelectedInstitutionId(id);
                  if (name) setSelectedInstitutionName(name);
                }}
                placeholder="Search by college name, city or state"
              />
              {selectedInstitutionName && (
                <div className="flex items-center gap-2 pt-1 text-xs text-fg-muted">
                  <CheckCircle2 className="size-3 text-success" />
                  <span>
                    Selected: <strong className="text-fg">{selectedInstitutionName}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Priority & Style Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-fg-muted flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-warning" />
              <span>Type</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(priorityConfig) as Array<keyof typeof priorityConfig>).map((key) => {
                const conf = priorityConfig[key];
                const ItemIcon = conf.icon;
                const isSelected = priority === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setPriority(key);
                    }}
                    className={cn(
                      "px-3 py-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex flex-col items-center gap-1 text-center",
                      isSelected
                        ? `${conf.bg} ${conf.border} ${conf.text} ring-1 ring-ring`
                        : "border-border bg-surface-muted text-fg-muted hover:text-fg hover:bg-surface-muted"
                    )}
                  >
                    <ItemIcon className="size-3.5" />
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <label htmlFor="broadcasts-c-headline" className="text-xs font-bold text-fg-muted">
              Headline
            </label>
            <input
              id="broadcasts-c-headline"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. End-sem exam dates are out"
              className={cn(fieldClassName, "w-full h-11")}
            />
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label htmlFor="broadcasts-c-message" className="text-xs font-bold text-fg-muted">
              Message
            </label>
            <textarea
              id="broadcasts-c-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the notice. Links and bullet points work."
              className={cn(fieldClassName, "w-full resize-none py-2.5")}
            />
          </div>

          {/* Call to Action (CTA) Optional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label
                htmlFor="broadcasts-c-button-label-optional-op"
                className="text-xs font-bold text-fg-muted flex items-center justify-between"
              >
                <span>Button label (optional)</span>
                <span className="text-xs text-fg-muted font-normal">Optional</span>
              </label>
              <input
                id="broadcasts-c-button-label-optional-op"
                type="text"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                placeholder="e.g. See the timetable"
                className={cn(fieldClassName, "w-full h-11")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-fg-muted flex items-center justify-between">
                <span>Button link</span>
                <span className="text-xs text-fg-muted font-normal">Optional</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-fg-muted" />
                <input
                  aria-label="Button link"
                  type="url"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="https://... or /colleges/"
                  className={cn(fieldClassName, "w-full pl-8 pr-3 h-11")}
                />
              </div>
            </div>
          </div>

          {/* Optional Banner Image URL */}
          <div className="space-y-1.5">
            <label
              htmlFor="broadcasts-c-image-link-optional-opti"
              className="text-xs font-bold text-fg-muted flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <ImageIcon className="size-3 text-brand-text" />
                Image link (optional)
              </span>
              <span className="text-xs text-fg-muted font-normal">Optional</span>
            </label>
            <input
              id="broadcasts-c-image-link-optional-opti"
              type="url"
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              placeholder="https://"
              className={cn(fieldClassName, "w-full h-11")}
            />
          </div>

          {/* Multi-Channel Distribution Options */}
          <div className="p-4 rounded-lg bg-surface-muted border border-border space-y-3">
            <p className="text-xs font-bold text-fg-muted">Also</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="size-4 rounded accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-2 text-xs font-semibold text-fg">
                  <Bell className="size-3.5 text-brand-text" />
                  <span>Send a notification to each student</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pinToTop}
                  onChange={(e) => setPinToTop(e.target.checked)}
                  className="size-4 rounded accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-2 text-xs font-semibold text-fg">
                  <Radio className="size-3.5 text-warning" />
                  <span>Pin to the top of the feed</span>
                </div>
              </label>
            </div>
          </div>

          {/* Dispatch Button */}
          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublish}
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
          >
            <Send className={cn("size-4", isPublishing && "animate-spin")} />
            <span>{isPublishing ? "Sending" : "Send broadcast"}</span>
          </button>
        </div>

        {/* Live Multi-Surface Interactive Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-lg bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                  <Eye className="h-4 w-4 text-brand-text" />
                  Preview
                </h3>
                <p className="text-xs text-fg-muted mt-0.5">How students will see it</p>
              </div>

              {/* Surface Switcher Pills */}
              <div className="flex items-center gap-1 rounded-lg bg-surface-muted p-1 border border-border">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Desktop preview"
                  aria-label="Desktop preview"
                  aria-pressed={previewSurface === "DESKTOP_FEED"}
                  onClick={() => setPreviewSurface("DESKTOP_FEED")}
                  className={cn(previewSurface === "DESKTOP_FEED" && "bg-surface text-fg")}
                >
                  <Monitor aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Phone preview"
                  aria-label="Phone preview"
                  aria-pressed={previewSurface === "MOBILE_CARD"}
                  onClick={() => setPreviewSurface("MOBILE_CARD")}
                  className={cn(previewSurface === "MOBILE_CARD" && "bg-surface text-fg")}
                >
                  <Smartphone aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Notification preview"
                  aria-label="Notification preview"
                  aria-pressed={previewSurface === "PUSH_NOTIFICATION"}
                  onClick={() => setPreviewSurface("PUSH_NOTIFICATION")}
                  className={cn(previewSurface === "PUSH_NOTIFICATION" && "bg-surface text-fg")}
                >
                  <Bell aria-hidden />
                </Button>
              </div>
            </div>

            {/* ─── Simulator Surface 1: Desktop Feed Banner ─── */}
            {previewSurface === "DESKTOP_FEED" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-fg-muted px-1">
                  <span>Pinned on desktop feed</span>
                  <span>100% Student Visibility</span>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-lg border transition-colors space-y-3",
                    activeConfig.border,
                    activeConfig.bg
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                        activeConfig.text,
                        "bg-bg border border-border"
                      )}
                    >
                      <ActiveIcon className="size-2.5" />
                      {activeConfig.badge}
                    </span>

                    <span className="text-xs font-semibold text-fg-muted truncate">
                      {scope === "CAMPUS" ? selectedInstitutionName : "All India"}
                    </span>
                  </div>

                  {bannerImageUrl.trim() && (
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-surface-muted border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bannerImageUrl}
                        alt="Broadcast Banner Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <h4 className="text-sm font-bold text-fg leading-snug">
                    {title.trim() || "End Semester Exams Schedule Announced (Fall 2026)"}
                  </h4>

                  <p className="text-xs text-fg-muted leading-relaxed whitespace-pre-wrap">
                    {message.trim() ||
                      "The official examination circular has been published by the academic board. Please review the timetable and report any timetable collisions by Friday."}
                  </p>

                  {actionLabel.trim() && (
                    <div className="pt-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-brand-fg text-xs font-bold ">
                        <span>{actionLabel.trim()}</span>
                        <ArrowRight className="size-3" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Simulator Surface 2: Mobile Phone Feed Card ─── */}
            {previewSurface === "MOBILE_CARD" && (
              <div className="mx-auto max-w-[280px] p-3 rounded-xl bg-surface border-4 border-border shadow-lg space-y-3">
                {/* Phone Notch */}
                <div className="w-20 h-3.5 bg-surface-muted rounded-full mx-auto" />

                <div
                  className={cn(
                    "p-3 rounded-lg border transition-colors space-y-2",
                    activeConfig.border,
                    activeConfig.bg
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1",
                        activeConfig.text,
                        "bg-bg"
                      )}
                    >
                      <ActiveIcon className="size-2" />
                      {activeConfig.label}
                    </span>
                    <span className="text-xs text-fg-muted truncate max-w-[120px]">
                      {scope === "CAMPUS" ? selectedInstitutionName.split(",")[0] : "All India"}
                    </span>
                  </div>

                  {bannerImageUrl.trim() && (
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bannerImageUrl}
                        alt="Mobile Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h5 className="text-xs font-bold text-fg leading-snug">
                    {title.trim() || "Announcement Headline"}
                  </h5>

                  <p className="text-xs text-fg-muted line-clamp-3 leading-relaxed">
                    {message.trim() ||
                      "Broadcast content displayed natively in the mobile campus timeline feed."}
                  </p>

                  {actionLabel.trim() && (
                    <div className="pt-0.5">
                      <div className="w-full py-1.5 rounded-lg bg-brand text-brand-fg text-xs font-bold text-center flex items-center justify-center gap-1">
                        <span>{actionLabel.trim()}</span>
                        <ArrowRight className="size-2.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Feed Items below */}
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1 opacity-60">
                  <div className="h-2 w-20 bg-surface-muted rounded-full" />
                  <div className="h-2 w-32 bg-surface-muted rounded-full" />
                </div>
              </div>
            )}

            {/* ─── Simulator Surface 3: Push Notification ─── */}
            {previewSurface === "PUSH_NOTIFICATION" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-fg-muted px-1">
                  <span>Phone notification</span>
                  <span>now</span>
                </div>
                <div className="p-3.5 rounded-lg bg-surface border border-border shadow-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="size-5 rounded-lg bg-brand-subtle flex items-center justify-center">
                        <Radio className="size-3 text-brand-text" />
                      </div>
                      <span className="text-xs font-bold text-fg">CampusLoop</span>
                      <span className="text-xs text-fg-muted">· now</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold px-1.5 py-0.5 rounded",
                        activeConfig.bg,
                        activeConfig.text
                      )}
                    >
                      {activeConfig.label}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-fg leading-snug">
                    {title.trim() || "Announcement Title"}
                  </p>

                  <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
                    {message.trim() || "Tap to view circular details on CampusLoop."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sent broadcasts */}
      <section className="p-6 rounded-lg bg-surface border border-border space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <Radio className="h-4 w-4 text-brand-text" />
              Sent broadcasts
            </h3>
            <p className="text-xs text-fg-muted mt-0.5">
              Archive a broadcast to take it off the feed, or delete it.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-fg-muted" />
            <input
              aria-label="Search broadcasts"
              type="text"
              placeholder="Search broadcasts"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className={cn(fieldClassName, "w-full pl-8 pr-3 h-11")}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-fg-muted mr-1">Scope:</span>
            {(["ALL", "INDIA", "CAMPUS"] as const).map((sc) => (
              <Chip size="sm" selected={scopeFilter === sc} key={sc} onClick={() => setScopeFilter(sc)}>
                {sc === "ALL" ? "All" : sc === "INDIA" ? "Every college" : "One college"}
              </Chip>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-fg-muted mr-1">Status:</span>
            {(["ALL", "PUBLISHED", "ARCHIVED"] as const).map((st) => (
              <Chip size="sm" selected={statusFilter === st} key={st} onClick={() => setStatusFilter(st)}>
                {st === "ALL" ? "All" : st === "PUBLISHED" ? "Active" : "Archived"}
              </Chip>
            ))}
          </div>
        </div>

        {/* Broadcast Table / Cards */}
        {filteredBroadcasts.length === 0 ? (
          <div className="py-12 text-center rounded-lg bg-surface-muted border border-border space-y-2">
            <Megaphone className="size-8 text-fg-subtle mx-auto" />
            <p className="text-xs font-bold text-fg">No broadcasts match.</p>
            <p className="text-xs text-fg-muted">Try another search or filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden bg-surface">
            {filteredBroadcasts.map((item) => {
              const isArchived = item.status === "ARCHIVED";
              const isRetracting = isRetractingId === item.id;
              const isDeleting = isDeletingId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 transition-colors hover:bg-surface-muted flex flex-col md:flex-row md:items-center justify-between gap-4",
                    isArchived && "opacity-60 bg-surface-muted"
                  )}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-bold",
                          isArchived
                            ? "bg-surface-muted text-fg-muted"
                            : "bg-success-subtle text-success border border-success/30"
                        )}
                      >
                        {isArchived ? "Archived / Retracted" : "Live Pinned"}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-subtle text-brand-text border border-brand-subtle-border">
                        {item.scope === "INDIA" ? "Every college" : "One college"}
                      </span>

                      <span className="text-xs font-semibold text-fg-muted truncate">
                        {item.institutionName || "All Campuses"}
                      </span>

                      {item.createdAt && (
                        <span className="text-xs text-fg-muted">
                          · {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-fg truncate">
                      {item.title || "Untitled Announcement"}
                    </h4>

                    <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
                      {item.body.replace(/\*\*|!\[\]\(.*?\)|\u{1F449}.*$/gu, "").trim()}
                    </p>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopyShareLink(item.id)}
                      title="Copy link"
                      aria-label="Copy link"
                    >
                      <Copy aria-hidden />
                    </Button>

                    <a
                      href={`/post/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      title="Open post"
                      aria-label="Open post in a new tab"
                    >
                      <ExternalLink aria-hidden />
                    </a>

                    <button
                      type="button"
                      disabled={isRetracting}
                      onClick={() => handleToggleStatus(item)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border",
                        isArchived
                          ? "border-success/30 bg-success-subtle text-success hover:bg-success-subtle"
                          : "border-warning/30 bg-warning-subtle text-warning hover:bg-warning-subtle"
                      )}
                    >
                      {isRetracting ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <Archive className="size-3.5" />
                      )}
                      <span>{isArchived ? "Republish" : "Retract"}</span>
                    </button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isDeleting}
                      onClick={() => handleDelete(item.id)}
                      title="Delete broadcast"
                      aria-label="Delete broadcast"
                      className="text-danger hover:bg-danger-subtle"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
