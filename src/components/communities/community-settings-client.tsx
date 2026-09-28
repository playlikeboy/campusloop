"use client";

import { CheckCircle2, EyeOff, Globe, Loader2, Lock, Plus, Sliders, Trash2, Webhook } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { updateCommunitySettings } from "@/app/(app)/(main)/communities/actions";
import { CommunityWebhooksManager } from "@/components/communities/community-webhooks-manager";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Tech & Coding",
  "Music & Arts",
  "Gaming & Anime",
  "Sports & Fitness",
  "Academics & Placements",
  "Memes & Culture",
  "General",
];

interface CommunitySettingsClientProps {
  community: {
    id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    category?: string;
    privacy?: "PUBLIC" | "PRIVATE" | "UNLISTED" | string;
    allowAnonymousPosts?: boolean;
    rules?: string | null;
  };
}

export function CommunitySettingsClient({ community }: CommunitySettingsClientProps) {
  const router = useRouter();
  const [settingsTab, setSettingsTab] = useState<"general" | "webhooks">("general");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || "");
  const [category, setCategory] = useState(community.category || "General");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">(
    (community.privacy as "PUBLIC" | "PRIVATE" | "UNLISTED") || "PUBLIC"
  );
  const [allowAnonymousPosts, setAllowAnonymousPosts] = useState(community.allowAnonymousPosts ?? true);

  const initialRules = (() => {
    if (!community.rules) return [];
    try {
      return JSON.parse(community.rules) as Array<{ title: string; description: string }>;
    } catch {
      return [];
    }
  })();

  const [rules, setRules] = useState(
    initialRules.length > 0
      ? initialRules
      : [{ title: "Be respectful to peers", description: "No hate speech or harassment." }]
  );

  const initialSnapshot = useRef(
    JSON.stringify({
      name: community.name,
      description: community.description || "",
      category: community.category || "General",
      privacy: (community.privacy as "PUBLIC" | "PRIVATE" | "UNLISTED") || "PUBLIC",
      allowAnonymousPosts: community.allowAnonymousPosts ?? true,
      rules,
    })
  );

  const isDirty =
    JSON.stringify({
      name,
      description,
      category,
      privacy,
      allowAnonymousPosts,
      rules,
    }) !== initialSnapshot.current;

  function handleAddRule() {
    if (rules.length >= 6) {
      toast.error("Maximum 6 rules allowed");
      return;
    }
    setRules([...rules, { title: "", description: "" }]);
  }

  function handleRemoveRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  function handleRuleChange(index: number, field: "title" | "description", value: string) {
    const updated = [...rules];
    updated[index][field] = value;
    setRules(updated);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Community name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const validRules = rules.filter((r) => r.title.trim().length > 0);
      await updateCommunitySettings({
        id: community.id,
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        privacy,
        allowAnonymousPosts,
        rules: validRules.length > 0 ? JSON.stringify(validRules) : undefined,
      });

      toast.success("Community settings updated successfully!");
      router.push(`/app/communities/${community.slug || community.id}`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update settings");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 select-none animate-in fade-in">
      {/* Settings Sub-Navigation Switcher */}
      <div className="flex items-center border-b border-border/40">
        <button
          type="button"
          onClick={() => setSettingsTab("general")}
          className={cn(
            "cl-interactive flex-1 border-b-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5",
            settingsTab === "general"
              ? "border-primary text-foreground font-black"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Sliders className="size-3.5" />
          <span>General</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsTab("webhooks")}
          className={cn(
            "cl-interactive flex-1 border-b-2 px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5",
            settingsTab === "webhooks"
              ? "border-primary text-foreground font-black"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Webhook className="size-3.5" />
          <span>Automation</span>
        </button>
      </div>

      {settingsTab === "webhooks" ? (
        <CommunityWebhooksManager community={community} />
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {/* Identity */}
          <div className="overflow-hidden rounded-xl border border-border/55 bg-card p-4 shadow-2xs sm:p-5 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground">1. General Details</h2>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Community Name *</label>
          <input
            type="text"
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Category *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left flex items-center justify-between border",
                  category === cat
                    ? "bg-foreground text-background border-foreground font-black shadow-2xs"
                    : "bg-muted/20 text-muted-foreground border-border/50 hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <span className="truncate">{cat}</span>
                {category === cat && <CheckCircle2 className="size-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">About & Purpose</label>
          <textarea
            rows={3}
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-border/60 p-3 bg-muted/20 text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all resize-none"
          />
        </div>
      </div>

      {/* Privacy & Permissions */}
      <div className="overflow-hidden rounded-xl border border-border/55 bg-card p-4 shadow-2xs sm:p-5 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
          2. Privacy &amp; Anonymity
        </h2>

        <div className="grid gap-2.5">
          {/* Public */}
          <div
            onClick={() => setPrivacy("PUBLIC")}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
              privacy === "PUBLIC"
                ? "bg-primary/5 border-primary shadow-2xs"
                : "bg-muted/10 border-border/60 hover:bg-muted/20"
            )}
          >
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Globe className="size-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-xs font-bold text-foreground">Public Hub</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Anyone on CampusLoop can view posts and join this sub-hub freely.
              </p>
            </div>
          </div>

          {/* Private */}
          <div
            onClick={() => setPrivacy("PRIVATE")}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
              privacy === "PRIVATE"
                ? "bg-primary/5 border-primary shadow-2xs"
                : "bg-muted/10 border-border/60 hover:bg-muted/20"
            )}
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Lock className="size-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-xs font-bold text-foreground">Private Hub</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Only approved members can view posts and participate. Non-members must submit a join request.
              </p>
            </div>
          </div>

          {/* Unlisted */}
          <div
            onClick={() => setPrivacy("UNLISTED")}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
              privacy === "UNLISTED"
                ? "bg-primary/5 border-primary shadow-2xs"
                : "bg-muted/10 border-border/60 hover:bg-muted/20"
            )}
          >
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
              <EyeOff className="size-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-xs font-bold text-foreground">Secret / Unlisted Hub</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Hidden from search and directory. Accessible only via private invite link.
              </p>
            </div>
          </div>
        </div>

        {/* Anonymous Posting Option */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/40">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground">Allow Anonymous Posts</h4>
            <p className="text-[11px] text-muted-foreground">
              Permit members to post confessions &amp; questions with masked identities.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAllowAnonymousPosts(!allowAnonymousPosts)}
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
      </div>

      {/* Community Rules */}
      <div className="overflow-hidden rounded-xl border border-border/55 bg-card p-4 shadow-2xs sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
            3. Guidelines &amp; Rules
          </h2>
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
            <div key={idx} className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-2 relative">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-muted-foreground">Rule #{idx + 1}</span>
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
                placeholder="Rule Title (e.g. No Spamming)"
                value={rule.title}
                onChange={(e) => handleRuleChange(idx, "title", e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-border/50 bg-card text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none"
              />

              <input
                type="text"
                placeholder="Short Description (Optional explanation)"
                value={rule.description}
                onChange={(e) => handleRuleChange(idx, "description", e.target.value)}
                className="w-full h-8 px-3 rounded-xl border border-border/50 bg-card text-[11px] font-normal text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

          {/* Submit Button */}
          <div
            className={cn(
              "sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-4 z-20 transition-all",
              isDirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            )}
          >
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/94 p-2.5 shadow-lg backdrop-blur-xl">
              <p className="hidden px-2 text-xs font-semibold text-muted-foreground sm:block">
                Unsaved changes
              </p>
              <button
                type="submit"
                disabled={loading || !name.trim() || !isDirty}
                className="cl-interactive flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <span>Save changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
