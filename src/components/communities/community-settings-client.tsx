"use client";

import { Sliders, Webhook } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { updateCommunitySettings } from "@/app/(app)/(main)/communities/actions";
import {
  type CommunityRule,
  CommunityRulesEditor,
  MAX_COMMUNITY_RULES,
} from "@/components/communities/community-rules-editor";
import { CommunityWebhooksManager } from "@/components/communities/community-webhooks-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioOption } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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

type Privacy = "PUBLIC" | "PRIVATE" | "UNLISTED";

const PRIVACY_OPTIONS: Array<{ value: Privacy; label: string; description: string }> = [
  { value: "PUBLIC", label: "Public", description: "Anyone can see posts and join." },
  {
    value: "PRIVATE",
    label: "Private",
    description: "Only approved members can see posts. Others ask to join.",
  },
  {
    value: "UNLISTED",
    label: "Hidden",
    description: "Not shown in search or lists. People join with your invite link.",
  },
];

interface CommunitySettingsClientProps {
  community: {
    id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    category?: string;
    privacy?: Privacy | string;
    allowAnonymousPosts?: boolean;
    rules?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
  };
}

function parseRules(raw?: string | null): CommunityRule[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CommunityRule[];
  } catch {
    return [];
  }
}

export function CommunitySettingsClient({ community }: CommunitySettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || "");
  const [category, setCategory] = useState(community.category || "General");
  const [privacy, setPrivacy] = useState<Privacy>((community.privacy as Privacy) || "PUBLIC");
  const [allowAnonymousPosts, setAllowAnonymousPosts] = useState(community.allowAnonymousPosts ?? true);
  const [avatarUrl, setAvatarUrl] = useState(community.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(community.bannerUrl || "");
  const [rules, setRules] = useState<CommunityRule[]>(() => {
    const initial = parseRules(community.rules);
    return initial.length > 0
      ? initial
      : [{ title: "Be respectful", description: "No hate speech or harassment." }];
  });

  const snapshot = () =>
    JSON.stringify({
      name,
      description,
      category,
      privacy,
      allowAnonymousPosts,
      rules,
      avatarUrl,
      bannerUrl,
    });
  const initialSnapshot = useRef<string | null>(null);
  if (initialSnapshot.current === null) initialSnapshot.current = snapshot();
  const isDirty = snapshot() !== initialSnapshot.current;

  function handleAddRule() {
    if (rules.length >= MAX_COMMUNITY_RULES) {
      toast.error(`You can have up to ${MAX_COMMUNITY_RULES} rules. Remove one to add another.`);
      return;
    }
    setRules([...rules, { title: "", description: "" }]);
  }

  function handleRuleChange(index: number, field: keyof CommunityRule, value: string) {
    setRules(rules.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Add a community name before saving.");
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
        avatarUrl: avatarUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
      });
      toast.success("Settings saved");
      router.push(`/communities/${community.slug || community.id}`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Couldn't save settings. Try again.");
      setLoading(false);
    }
  }

  return (
    <Tabs defaultValue="general" className="gap-4">
      <TabsList variant="line" className="w-full">
        <TabsTrigger value="general">
          <Sliders />
          General
        </TabsTrigger>
        <TabsTrigger value="webhooks">
          <Webhook />
          Webhooks
        </TabsTrigger>
      </TabsList>

      <TabsContent value="webhooks">
        <CommunityWebhooksManager community={community} />
      </TabsContent>

      <TabsContent value="general">
        <form onSubmit={handleSave} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Name" required>
                <Input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-semibold text-fg">Category</legend>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Chip key={cat} selected={category === cat} onSelectedChange={() => setCategory(cat)}>
                      {cat}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <FormField label="About" hint={`${description.length}/300`}>
                <Textarea
                  rows={3}
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this community for?"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Picture link">
                  <Input
                    type="url"
                    inputMode="url"
                    placeholder="https://…/avatar.png"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </FormField>
                <FormField label="Banner link">
                  <Input
                    type="url"
                    inputMode="url"
                    placeholder="https://…/banner.jpg"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Who can see it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <RadioGroup
                value={privacy}
                onValueChange={(v) => setPrivacy(v as Privacy)}
                aria-label="Who can see it"
              >
                {PRIVACY_OPTIONS.map((opt) => (
                  <RadioOption key={opt.value} value={opt.value} description={opt.description}>
                    {opt.label}
                  </RadioOption>
                ))}
              </RadioGroup>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-anon">Allow anonymous posts</Label>
                  <p className="text-sm text-fg-muted">Members can post without showing their name.</p>
                </div>
                <Switch
                  id="allow-anon"
                  aria-label="Allow anonymous posts"
                  checked={allowAnonymousPosts}
                  onCheckedChange={(checked) => setAllowAnonymousPosts(checked)}
                />
              </div>
            </CardContent>
          </Card>

          <CommunityRulesEditor
            rules={rules}
            onAdd={handleAddRule}
            onRemove={(idx) => setRules(rules.filter((_, i) => i !== idx))}
            onChange={handleRuleChange}
          />

          <div
            className={cn(
              "sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 transition-ui md:bottom-4",
              isDirty ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            aria-hidden={!isDirty}
          >
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-2.5 shadow-lg">
              <p className="hidden px-2 text-sm text-fg-muted sm:block">You have unsaved changes</p>
              <Button
                type="submit"
                loading={loading}
                disabled={!name.trim() || !isDirty}
                className="flex-1 sm:flex-none"
                tabIndex={isDirty ? undefined : -1}
              >
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}
