"use client";

import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Bell,
  Building2,
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
  Users,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { CollegeCombobox } from "@/components/common/college-combobox";
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
      label: "General Info",
      badge: "CAMPUS INFO",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      accent: "bg-blue-500",
      icon: Info,
    },
    ANNOUNCEMENT: {
      label: "Official",
      badge: "OFFICIAL ANNOUNCEMENT",
      border: "border-primary/30",
      bg: "bg-primary/10",
      text: "text-primary",
      accent: "bg-primary",
      icon: Megaphone,
    },
    WARNING: {
      label: "Advisory",
      badge: "CAMPUS ADVISORY",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      accent: "bg-amber-500",
      icon: AlertTriangle,
    },
    URGENT: {
      label: "Urgent Alert",
      badge: "URGENT NOTICE",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
      text: "text-rose-500",
      accent: "bg-rose-500",
      icon: ShieldAlert,
    },
  };

  const activeConfig = priorityConfig[priority];
  const ActiveIcon = activeConfig.icon;

  async function handlePublish() {
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both a headline and announcement message.");
      return;
    }

    if (actionLabel.trim() && !actionUrl.trim()) {
      toast.error("Please provide a destination URL for your Call to Action button.");
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

      toast.success(data.message || "Broadcast published successfully!");

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

      toast.success(data.message || "Broadcast updated!");
      setBroadcastsList((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, status: nextStatus } : b))
      );
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
    toast.success("Broadcast post URL copied to clipboard!");
  }

  return (
    <div className="space-y-10">
      {/* ─── Top Stats Bar ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Indexed Campuses</span>
            <Building2 className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">1,350+</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">All-India active college hubs</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Total Broadcasts</span>
            <Radio className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{broadcastsList.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Dispatched timeline alerts</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Active Feed Pinned</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            {broadcastsList.filter((b) => (b.status || "PUBLISHED") === "PUBLISHED").length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Live on student feeds</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Target Reach</span>
            <Users className="size-4 text-violet-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            {scope === "INDIA" ? "Pan-India" : "Campus Wide"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {scope === "INDIA" ? "All verified students" : selectedInstitutionName}
          </p>
        </div>
      </div>

      {/* ─── Creator & Live Interactive Simulator Split ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Broadcast Studio Composer (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-card border border-border/50 shadow-xs space-y-6">
          <div className="border-b border-border/40 pb-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              Campus Broadcast Dispatch Studio
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Draft, style, and broadcast high-priority announcements directly to university timelines.
            </p>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Globe className="size-3.5 text-primary" />
              <span>Broadcast Target Scope</span>
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
                  "p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1",
                  scope === "INDIA"
                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                    : "border-border/40 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    All Campuses (India)
                  </span>
                  {scope === "INDIA" && <Check className="size-3.5 text-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Universal timeline banner visible to students across all 1,350+ institutions
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
                  "p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1",
                  scope === "CAMPUS"
                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                    : "border-border/40 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5" />
                    Specific College Hub
                  </span>
                  {scope === "CAMPUS" && <Check className="size-3.5 text-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Targeted strictly to students enrolled in a single university or college hub
                </p>
              </button>
            </div>
          </div>

          {/* Searchable College Picker if Scope is CAMPUS */}
          {scope === "CAMPUS" && (
            <div className="space-y-1.5 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Search className="size-3 text-primary" />
                  <span>Target University / College Hub (Search all 1,350+)</span>
                </label>
                <span className="text-[10px] font-semibold text-primary">Live Database Search</span>
              </div>
              <CollegeCombobox
                value={selectedInstitutionId}
                initialInstitutionName={selectedInstitutionName}
                initialInstitutions={institutions}
                onChange={(id, name) => {
                  setSelectedInstitutionId(id);
                  if (name) setSelectedInstitutionName(name);
                }}
                placeholder="Search by college name, city, state, or NIRF rank..."
              />
              {selectedInstitutionName && (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span>
                    Selected: <strong className="text-foreground">{selectedInstitutionName}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Priority & Style Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Announcement Priority &amp; Style Theme</span>
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
                      "px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 text-center",
                      isSelected
                        ? `${conf.bg} ${conf.border} ${conf.text} shadow-xs ring-1 ring-primary/20`
                        : "border-border/30 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
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
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Headline / Announcement Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. End Semester Exams Schedule Announced (Fall 2026)"
              className="w-full h-11 px-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs font-bold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-background transition-all"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Detailed Announcement Body
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the full announcement body. Markdown links and bullet points are supported..."
              className="w-full p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-background transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Call to Action (CTA) Optional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Action Button Label</span>
                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
              </label>
              <input
                type="text"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                placeholder="e.g. View Exam Circular"
                className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border/50 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-background transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Action Destination URL</span>
                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <input
                  type="url"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="https://... or /colleges/..."
                  className="w-full h-10 pl-8 pr-3 rounded-xl bg-muted/30 border border-border/50 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-background transition-all"
                />
              </div>
            </div>
          </div>

          {/* Optional Banner Image URL */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="size-3 text-primary" />
                Banner Media Image URL
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
            </label>
            <input
              type="url"
              value={bannerImageUrl}
              onChange={(e) => setBannerImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or uploaded image URL"
              className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border/50 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-background transition-all"
            />
          </div>

          {/* Multi-Channel Distribution Options */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Delivery Channels
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="size-4 rounded accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Bell className="size-3.5 text-primary" />
                  <span>Send in-app notification alerts to student inboxes</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pinToTop}
                  onChange={(e) => setPinToTop(e.target.checked)}
                  className="size-4 rounded accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Radio className="size-3.5 text-amber-500" />
                  <span>Pin to top banner of the target campus feed</span>
                </div>
              </label>
            </div>
          </div>

          {/* Dispatch Button */}
          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublish}
            className="w-full h-12 rounded-2xl bg-foreground text-background text-xs font-black flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <Send className={cn("size-4", isPublishing && "animate-spin")} />
            <span>{isPublishing ? "Dispatching Broadcast to Students..." : "Publish Broadcast Now"}</span>
          </button>
        </div>

        {/* Live Multi-Surface Interactive Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-card border border-border/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Multi-Surface Live Simulator
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Real-time preview across student devices
                </p>
              </div>

              {/* Surface Switcher Pills */}
              <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1 border border-border/40">
                <button
                  type="button"
                  title="Desktop Feed Preview"
                  onClick={() => setPreviewSurface("DESKTOP_FEED")}
                  className={cn(
                    "p-1.5 rounded-lg transition-all cursor-pointer",
                    previewSurface === "DESKTOP_FEED"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Monitor className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Mobile Feed Card Preview"
                  onClick={() => setPreviewSurface("MOBILE_CARD")}
                  className={cn(
                    "p-1.5 rounded-lg transition-all cursor-pointer",
                    previewSurface === "MOBILE_CARD"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Smartphone className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Push Notification Preview"
                  onClick={() => setPreviewSurface("PUSH_NOTIFICATION")}
                  className={cn(
                    "p-1.5 rounded-lg transition-all cursor-pointer",
                    previewSurface === "PUSH_NOTIFICATION"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Bell className="size-3.5" />
                </button>
              </div>
            </div>

            {/* ─── Simulator Surface 1: Desktop Feed Banner ─── */}
            {previewSurface === "DESKTOP_FEED" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground px-1">
                  <span>DESKTOP FEED TOP PIN</span>
                  <span>100% Student Visibility</span>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-2xl border transition-all space-y-3 shadow-xs",
                    activeConfig.border,
                    activeConfig.bg
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1",
                        activeConfig.text,
                        "bg-background/80 border border-border/40"
                      )}
                    >
                      <ActiveIcon className="size-2.5" />
                      {activeConfig.badge}
                    </span>

                    <span className="text-[10px] font-semibold text-muted-foreground truncate">
                      {scope === "CAMPUS" ? selectedInstitutionName : "All India"}
                    </span>
                  </div>

                  {bannerImageUrl.trim() && (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-muted/40 border border-border/40">
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

                  <h4 className="text-sm font-black text-foreground leading-snug">
                    {title.trim() || "End Semester Exams Schedule Announced (Fall 2026)"}
                  </h4>

                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {message.trim() ||
                      "The official examination circular has been published by the academic board. Please review the timetable and report any timetable collisions by Friday."}
                  </p>

                  {actionLabel.trim() && (
                    <div className="pt-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground text-background text-xs font-bold shadow-2xs">
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
              <div className="mx-auto max-w-[280px] p-3 rounded-[32px] bg-neutral-950 border-4 border-neutral-800 shadow-2xl space-y-3">
                {/* Phone Notch */}
                <div className="w-20 h-3.5 bg-neutral-800 rounded-full mx-auto" />

                <div
                  className={cn(
                    "p-3 rounded-2xl border transition-all space-y-2 shadow-xs",
                    activeConfig.border,
                    activeConfig.bg
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-1",
                        activeConfig.text,
                        "bg-background/80"
                      )}
                    >
                      <ActiveIcon className="size-2" />
                      {activeConfig.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                      {scope === "CAMPUS" ? selectedInstitutionName.split(",")[0] : "All India"}
                    </span>
                  </div>

                  {bannerImageUrl.trim() && (
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-muted/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bannerImageUrl}
                        alt="Mobile Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h5 className="text-xs font-black text-foreground leading-snug">
                    {title.trim() || "Announcement Headline"}
                  </h5>

                  <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                    {message.trim() ||
                      "Broadcast content displayed natively in the mobile campus timeline feed."}
                  </p>

                  {actionLabel.trim() && (
                    <div className="pt-0.5">
                      <div className="w-full py-1.5 rounded-lg bg-foreground text-background text-[10px] font-bold text-center flex items-center justify-center gap-1">
                        <span>{actionLabel.trim()}</span>
                        <ArrowRight className="size-2.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Feed Items below */}
                <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1 opacity-60">
                  <div className="h-2 w-20 bg-neutral-700 rounded-full" />
                  <div className="h-2 w-32 bg-neutral-800 rounded-full" />
                </div>
              </div>
            )}

            {/* ─── Simulator Surface 3: Push Notification ─── */}
            {previewSurface === "PUSH_NOTIFICATION" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground px-1">
                  <span>MOBILE LOCKSCREEN PUSH ALERT</span>
                  <span>Direct to Handset</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="size-5 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Radio className="size-3 text-primary" />
                      </div>
                      <span className="text-[11px] font-black uppercase text-foreground">
                        CampusLoop
                      </span>
                      <span className="text-[10px] text-muted-foreground">· now</span>
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                        activeConfig.bg,
                        activeConfig.text
                      )}
                    >
                      {activeConfig.label}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-foreground leading-snug">
                    {title.trim() || "Announcement Title"}
                  </p>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {message.trim() || "Tap to view circular details on CampusLoop."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Active Broadcast Management & Telemetry Matrix ─── */}
      <section className="p-6 rounded-3xl bg-card border border-border/50 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              Active Broadcast Telemetry &amp; Archive Log
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor impressions, toggle active timeline banners, or retract broadcasts across campus hubs.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dispatched broadcasts..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-muted/30 border border-border/50 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
              Scope:
            </span>
            {(["ALL", "INDIA", "CAMPUS"] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setScopeFilter(sc)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer",
                  scopeFilter === sc
                    ? "bg-foreground text-background shadow-2xs"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                {sc === "ALL" ? "All Scopes" : sc === "INDIA" ? "Pan-India" : "Campus Specific"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
              Status:
            </span>
            {(["ALL", "PUBLISHED", "ARCHIVED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer",
                  statusFilter === st
                    ? "bg-foreground text-background shadow-2xs"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                {st === "ALL" ? "All Statuses" : st === "PUBLISHED" ? "Active" : "Archived"}
              </button>
            ))}
          </div>
        </div>

        {/* Broadcast Table / Cards */}
        {filteredBroadcasts.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-muted/10 border border-border/30 space-y-2">
            <Megaphone className="size-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-bold text-foreground">No broadcasts match the selected filters.</p>
            <p className="text-[11px] text-muted-foreground">
              Try adjusting your search query or scope filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30 rounded-2xl border border-border/40 overflow-hidden bg-card/60">
            {filteredBroadcasts.map((item) => {
              const isArchived = item.status === "ARCHIVED";
              const isRetracting = isRetractingId === item.id;
              const isDeleting = isDeletingId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 transition-colors hover:bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4",
                    isArchived && "opacity-60 bg-muted/10"
                  )}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                          isArchived
                            ? "bg-muted text-muted-foreground"
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                        )}
                      >
                        {isArchived ? "Archived / Retracted" : "Live Pinned"}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {item.scope === "INDIA" ? "Pan-India" : "Campus Specific"}
                      </span>

                      <span className="text-[11px] font-semibold text-muted-foreground truncate">
                        {item.institutionName || "All Campuses"}
                      </span>

                      {item.createdAt && (
                        <span className="text-[10px] text-muted-foreground">
                          · {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-foreground truncate">
                      {item.title || "Untitled Announcement"}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.body.replace(/\*\*|!\[\]\(.*?\)|👉.*$/g, "").trim()}
                    </p>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopyShareLink(item.id)}
                      className="p-2 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Copy Share Link"
                    >
                      <Copy className="size-3.5" />
                    </button>

                    <a
                      href={`/post/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Open Broadcast Post"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>

                    <button
                      type="button"
                      disabled={isRetracting}
                      onClick={() => handleToggleStatus(item)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border",
                        isArchived
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                      )}
                    >
                      {isRetracting ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <Archive className="size-3.5" />
                      )}
                      <span>{isArchived ? "Republish" : "Retract"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-colors cursor-pointer"
                      title="Delete Broadcast"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
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
