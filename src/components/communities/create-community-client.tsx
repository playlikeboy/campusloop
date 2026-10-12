"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Code,
  Compass,
  EyeOff,
  Flame,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Lock,
  Music,
  Palette,
  Plus,
  Sparkles,
  Swords,
  Trash2,
  Trophy,
  Users2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createCommunity } from "@/app/(app)/(main)/communities/actions";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "Tech & Coding", label: "Tech & Coding", icon: Code, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "Cultural & Arts", label: "Cultural & Arts", icon: Music, color: "text-pink-500", bg: "bg-pink-500/10" },
  { id: "Gaming & Anime", label: "Gaming & Anime", icon: Swords, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "Sports & Fitness", label: "Sports & Fitness", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: "Academics & Placements", label: "Academics & Careers", icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "General", label: "General Campus", icon: Compass, color: "text-indigo-500", bg: "bg-indigo-500/10" },
] as const;

const AVATAR_PRESETS = [
  { id: "preset-indigo", label: "Indigo", style: "linear-gradient(135deg, #6366f1, #4f46e5)" },
  { id: "preset-violet", label: "Violet", style: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
  { id: "preset-emerald", label: "Emerald", style: "linear-gradient(135deg, #10b981, #059669)" },
  { id: "preset-rose", label: "Rose", style: "linear-gradient(135deg, #f43f5e, #e11d48)" },
  { id: "preset-amber", label: "Amber", style: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { id: "preset-cyan", label: "Cyan", style: "linear-gradient(135deg, #06b6d4, #0891b2)" },
];

const BANNER_PRESETS = [
  { id: "preset-tech", label: "Cosmic", style: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)" },
  { id: "preset-aurora", label: "Aurora", style: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%)" },
  { id: "preset-sunset", label: "Sunset", style: "linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #9333ea 100%)" },
  { id: "preset-midnight", label: "Midnight", style: "linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #312e81 100%)" },
  { id: "preset-ocean", label: "Ocean", style: "linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateCommunityClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">("PUBLIC");
  const [allowAnonymousPosts, setAllowAnonymousPosts] = useState(true);

  // Avatar & Banner customization
  const [selectedAvatarPreset, setSelectedAvatarPreset] = useState(AVATAR_PRESETS[0].id);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [avatarMode, setAvatarMode] = useState<"preset" | "custom">("preset");

  const [selectedBannerPreset, setSelectedBannerPreset] = useState(BANNER_PRESETS[0].id);
  const [customBannerUrl, setCustomBannerUrl] = useState("");
  const [bannerMode, setBannerMode] = useState<"preset" | "custom">("preset");

  // Rules list
  const [rules, setRules] = useState<Array<{ title: string; description: string }>>([
    { title: "Be respectful to peers", description: "No hate speech, harassment, or personal attacks." },
    { title: "Stay relevant", description: "Keep discussions and media focused on this community's theme." },
  ]);

  const activeAvatarStyle = useMemo(() => {
    if (avatarMode === "custom" && customAvatarUrl.trim()) return null;
    return AVATAR_PRESETS.find((p) => p.id === selectedAvatarPreset)?.style || AVATAR_PRESETS[0].style;
  }, [avatarMode, customAvatarUrl, selectedAvatarPreset]);

  const activeBannerStyle = useMemo(() => {
    if (bannerMode === "custom" && customBannerUrl.trim()) return null;
    return BANNER_PRESETS.find((p) => p.id === selectedBannerPreset)?.style || BANNER_PRESETS[0].style;
  }, [bannerMode, customBannerUrl, selectedBannerPreset]);

  const derivedSlug = useMemo(() => {
    if (customSlug.trim()) {
      return slugify(customSlug);
    }
    return slugify(name);
  }, [customSlug, name]);

  // Validation checklist
  const isNameValid = name.trim().length >= 2;
  const isCategoryValid = Boolean(category);
  const isDescriptionValid = description.trim().length >= 10;
  const isRulesValid = rules.some((r) => r.title.trim().length > 0);

  const checklistScore = [isNameValid, isCategoryValid, isDescriptionValid, isRulesValid].filter(Boolean).length;
  const checklistPercent = (checklistScore / 4) * 100;

  function handleAddRule() {
    if (rules.length >= 6) {
      toast.error("Maximum 6 rules allowed");
      return;
    }
    sounds.tap();
    haptics.light();
    setRules([...rules, { title: "", description: "" }]);
  }

  function handleRemoveRule(index: number) {
    sounds.tap();
    haptics.light();
    setRules(rules.filter((_, i) => i !== index));
  }

  function handleRuleChange(index: number, field: "title" | "description", value: string) {
    const updated = [...rules];
    updated[index][field] = value;
    setRules(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a community name");
      return;
    }

    setLoading(true);
    sounds.tap();
    haptics.light();

    try {
      const validRules = rules.filter((r) => r.title.trim().length > 0);
      const effectiveAvatarUrl = avatarMode === "custom" && customAvatarUrl.trim() ? customAvatarUrl.trim() : undefined;
      const effectiveBannerUrl = bannerMode === "custom" && customBannerUrl.trim() ? customBannerUrl.trim() : undefined;

      const newComm = await createCommunity({
        name: name.trim(),
        slug: derivedSlug || undefined,
        description: description.trim() || undefined,
        category,
        privacy,
        allowAnonymousPosts,
        rules: validRules.length > 0 ? JSON.stringify(validRules) : undefined,
        avatarUrl: effectiveAvatarUrl,
        bannerUrl: effectiveBannerUrl,
      });

      sounds.pop();
      haptics.success();
      toast.success(`c/${newComm.name} created! +100 LP Clout awarded`);
      router.push(`/communities/${newComm.slug || newComm.id}`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to create community");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-3 sm:px-5 lg:px-8 pb-32 pt-3 select-none animate-in fade-in">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-border/30">
        <Link
          href="/communities"
          className="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Communities</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Zap className="size-3" />
            +100 LP Founder Bonus
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form Controls (7 cols) */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
          {/* Hero Header Card */}
          <div className="rounded-3xl border border-border/40 bg-card/60 p-5 sm:p-6 shadow-2xs backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                <Users2 className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Create a Campus Community
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Launch a verified student club, study cohort, or campus discussion group.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                <Trophy className="size-4 text-amber-500 shrink-0" />
                <span>Founder Privileges: +100 LP Clout</span>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">
                Instant Admin
              </span>
            </div>
          </div>

          {/* 1. Identity & Name */}
          <section className="space-y-4 rounded-3xl border border-border/40 bg-card/60 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
                1
              </span>
              <h2 className="text-sm font-black tracking-tight text-foreground uppercase">
                Community Identity
              </h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Community Name *</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">
                  c/
                </span>
                <input
                  type="text"
                  required
                  maxLength={40}
                  placeholder="e.g. bit-coders, ai-club, indie-filmmakers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-border/50 bg-muted/20 pl-8 pr-4 text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-card transition-all"
                />
              </div>
              <p className="text-[11px] text-muted-foreground pl-1">
                Unique identifier across CampusLoop. Keep it memorable and punchy.
              </p>
            </div>

            {/* Custom Slug Input */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Custom URL Slug (Optional)</label>
                <span className="text-[10px] text-muted-foreground font-medium">Auto-normalized</span>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  campusloop.space/communities/
                </span>
                <input
                  type="text"
                  maxLength={30}
                  placeholder={derivedSlug || "your-hub"}
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-border/50 bg-muted/20 pl-[210px] pr-4 text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-card transition-all"
                />
              </div>
            </div>

            {/* Category Cards */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-foreground">Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        sounds.tap();
                        haptics.light();
                        setCategory(cat.id);
                      }}
                      className={cn(
                        "p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 active:scale-97",
                        isSelected
                          ? "bg-foreground text-background border-foreground shadow-2xs font-black"
                          : "bg-muted/20 text-muted-foreground border-border/40 hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={cn(
                            "size-7 rounded-xl flex items-center justify-center",
                            isSelected ? "bg-background text-foreground" : cat.bg
                          )}
                        >
                          <Icon className={cn("size-3.5", isSelected ? "text-foreground" : cat.color)} />
                        </div>
                        {isSelected && <Check className="size-3.5 text-background" />}
                      </div>
                      <span className="text-xs font-bold truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purpose & Description */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-foreground">About &amp; Purpose</label>
              <textarea
                rows={3}
                maxLength={300}
                placeholder="What is this community about? What events, discussions, projects, or meetups will take place here?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-border/50 bg-muted/20 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-card transition-all resize-none"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground px-1">
                <span>Helps students discover and join your hub</span>
                <span>{description.length} / 300</span>
              </div>
            </div>
          </section>

          {/* 2. Visual Branding (Avatar & Banner) */}
          <section className="space-y-4 rounded-3xl border border-border/40 bg-card/60 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
                2
              </span>
              <h2 className="text-sm font-black tracking-tight text-foreground uppercase">
                Visual Branding
              </h2>
            </div>

            {/* Avatar Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Palette className="size-3.5 text-primary" />
                  Community Avatar Badge
                </label>
                <div className="flex rounded-full bg-muted/40 p-0.5 border border-border/40 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAvatarMode("preset")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full font-bold transition-all",
                      avatarMode === "preset" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
                    )}
                  >
                    Gradients
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode("custom")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full font-bold transition-all",
                      avatarMode === "custom" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
                    )}
                  >
                    Custom URL
                  </button>
                </div>
              </div>

              {avatarMode === "preset" ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedAvatarPreset === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => {
                          sounds.tap();
                          haptics.light();
                          setSelectedAvatarPreset(preset.id);
                        }}
                        style={{ background: preset.style }}
                        className={cn(
                          "size-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-xs transition-transform active:scale-95 cursor-pointer",
                          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" : "opacity-85 hover:opacity-100"
                        )}
                      >
                        {isSelected ? <Check className="size-4" /> : (name[0] || "C").toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-border/50 bg-muted/20 px-3.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-card transition-all"
                />
              )}
            </div>

            {/* Banner Selection */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-primary" />
                  Hero Header Banner
                </label>
                <div className="flex rounded-full bg-muted/40 p-0.5 border border-border/40 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setBannerMode("preset")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full font-bold transition-all",
                      bannerMode === "preset" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
                    )}
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerMode("custom")}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full font-bold transition-all",
                      bannerMode === "custom" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
                    )}
                  >
                    Custom URL
                  </button>
                </div>
              </div>

              {bannerMode === "preset" ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {BANNER_PRESETS.map((preset) => {
                    const isSelected = selectedBannerPreset === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => {
                          sounds.tap();
                          haptics.light();
                          setSelectedBannerPreset(preset.id);
                        }}
                        style={{ background: preset.style }}
                        className={cn(
                          "h-12 w-full rounded-xl flex items-center justify-center text-white text-[10px] font-bold shadow-xs transition-transform active:scale-95 cursor-pointer relative overflow-hidden",
                          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-102" : "opacity-85 hover:opacity-100"
                        )}
                      >
                        {isSelected && <Check className="size-3.5 stroke-[3]" />}
                        <span className="sr-only">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={customBannerUrl}
                  onChange={(e) => setCustomBannerUrl(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-border/50 bg-muted/20 px-3.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:bg-card transition-all"
                />
              )}
            </div>
          </section>

          {/* 3. Privacy & Access Settings */}
          <section className="space-y-4 rounded-3xl border border-border/40 bg-card/60 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
                3
              </span>
              <h2 className="text-sm font-black tracking-tight text-foreground uppercase">
                Privacy &amp; Access Controls
              </h2>
            </div>

            <div className="grid gap-2.5">
              {/* Public */}
              <div
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setPrivacy("PUBLIC");
                }}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3",
                  privacy === "PUBLIC"
                    ? "bg-primary/5 border-primary shadow-2xs"
                    : "bg-muted/10 border-border/50 hover:bg-muted/20"
                )}
              >
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Globe className="size-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-foreground">Public Hub</h3>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Anyone on CampusLoop can browse discussions and join freely with one tap.
                  </p>
                </div>
              </div>

              {/* Private */}
              <div
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setPrivacy("PRIVATE");
                }}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3",
                  privacy === "PRIVATE"
                    ? "bg-primary/5 border-primary shadow-2xs"
                    : "bg-muted/10 border-border/50 hover:bg-muted/20"
                )}
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                  <Lock className="size-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-xs font-bold text-foreground">Private Hub</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Non-members must submit a join request. Only approved members can view posts.
                  </p>
                </div>
              </div>

              {/* Unlisted */}
              <div
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setPrivacy("UNLISTED");
                }}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3",
                  privacy === "UNLISTED"
                    ? "bg-primary/5 border-primary shadow-2xs"
                    : "bg-muted/10 border-border/50 hover:bg-muted/20"
                )}
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
                  <EyeOff className="size-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-xs font-bold text-foreground">Secret / Unlisted Hub</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Hidden from discovery and directories. Only accessible via direct invite link.
                  </p>
                </div>
              </div>
            </div>

            {/* Anonymous Posting Option */}
            <div className="pt-3 flex items-center justify-between gap-3 border-t border-border/30">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">Allow Anonymous Posts</h4>
                <p className="text-[11px] text-muted-foreground">
                  Permit members to share anonymous confessions and sensitive queries.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setAllowAnonymousPosts(!allowAnonymousPosts);
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  allowAnonymousPosts ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    allowAnonymousPosts ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </section>

          {/* 4. Guidelines & Rules */}
          <section className="space-y-4 rounded-3xl border border-border/40 bg-card/60 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
                  4
                </span>
                <h2 className="text-sm font-black tracking-tight text-foreground uppercase">
                  Community Rules &amp; Guidelines
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddRule}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3.5" /> Add Rule
              </button>
            </div>

            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-muted/20 border border-border/50 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Rule #{idx + 1}
                    </span>
                    {rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remove Rule"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Rule Title (e.g. No unsolicited promo)"
                    value={rule.title}
                    onChange={(e) => handleRuleChange(idx, "title", e.target.value)}
                    className="w-full h-8 px-3 rounded-xl border border-border/40 bg-card text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
                  />

                  <input
                    type="text"
                    placeholder="Short description (optional details)"
                    value={rule.description}
                    onChange={(e) => handleRuleChange(idx, "description", e.target.value)}
                    className="w-full h-8 px-3 rounded-xl border border-border/40 bg-card text-[11px] font-normal text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-xs font-black shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Founding Community...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Launch Community &amp; Claim +100 LP</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column: Sticky Live Preview & Readiness Checklist (5 cols) */}
        <aside className="space-y-6 lg:col-span-5">
          <div className="sticky top-20 space-y-6">
            {/* Readiness Checklist Card */}
            <div className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-2xs backdrop-blur-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Launch Readiness
                </h3>
                <span className="text-xs font-black text-primary">{Math.round(checklistPercent)}%</span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={cn("size-4", isNameValid ? "text-emerald-500" : "text-muted-foreground/40")} />
                  <span className={cn(isNameValid ? "text-foreground font-semibold" : "text-muted-foreground")}>
                    Community name specified
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={cn("size-4", isCategoryValid ? "text-emerald-500" : "text-muted-foreground/40")} />
                  <span className={cn(isCategoryValid ? "text-foreground font-semibold" : "text-muted-foreground")}>
                    Category selected ({category})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={cn("size-4", isDescriptionValid ? "text-emerald-500" : "text-muted-foreground/40")} />
                  <span className={cn(isDescriptionValid ? "text-foreground font-semibold" : "text-muted-foreground")}>
                    About &amp; purpose defined
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={cn("size-4", isRulesValid ? "text-emerald-500" : "text-muted-foreground/40")} />
                  <span className={cn(isRulesValid ? "text-foreground font-semibold" : "text-muted-foreground")}>
                    Guidelines configured ({rules.filter((r) => r.title.trim()).length} rules)
                  </span>
                </div>
              </div>
            </div>

            {/* Live Exploration Card Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Live Card Preview
                </span>
                <span className="text-[10px] font-semibold text-primary">Explore Directory</span>
              </div>

              <div className="group relative flex min-h-[260px] flex-col rounded-3xl border border-border/40 bg-card p-5 shadow-2xs overflow-hidden">
                {/* Subtle top banner accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-16 opacity-30"
                  style={
                    bannerMode === "custom" && customBannerUrl
                      ? { backgroundImage: `url(${customBannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: activeBannerStyle || undefined }
                  }
                />

                {/* Top Header */}
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="size-11 shrink-0 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-xs border border-white/20"
                      style={
                        avatarMode === "custom" && customAvatarUrl
                          ? { backgroundImage: `url(${customAvatarUrl})`, backgroundSize: "cover" }
                          : { background: activeAvatarStyle || undefined }
                      }
                    >
                      {(!customAvatarUrl || avatarMode === "preset") && (name[0] || "C").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-primary truncate">
                        {category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        {privacy === "PRIVATE" ? (
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <Lock className="size-3" /> Private
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Globe className="size-3" /> Public
                          </span>
                        )}
                        <span>·</span>
                        <span>1 member</span>
                      </div>
                    </div>
                  </div>

                  <span className="h-8 shrink-0 text-xs px-3 rounded-full bg-primary/10 text-primary font-bold flex items-center">
                    Joined
                  </span>
                </div>

                {/* Title */}
                <div className="relative z-10 mt-3.5">
                  <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-foreground">
                    c/{name.trim() || "your-community-name"}
                  </h3>
                </div>

                {/* Description */}
                <p className="relative z-10 mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground min-h-[48px]">
                  {description.trim() ||
                    "A student-led community for sharing ideas, questions, updates, and campus life."}
                </p>

                {/* Footer */}
                <div className="relative z-10 mt-auto pt-4 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Zap className="size-3" /> 100 LP Clout
                  </span>
                  <span>@you (Founder)</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
