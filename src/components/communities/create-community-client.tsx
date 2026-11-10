"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createCommunity } from "@/app/(app)/(main)/communities/actions";
import {
  type CommunityRule,
  CommunityRulesEditor,
  MAX_COMMUNITY_RULES,
} from "@/components/communities/community-rules-editor";
import { CreateCommunityPreview } from "@/components/communities/create-community-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioOption } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

const CATEGORIES = [
  { id: "Tech & Coding", label: "Tech & coding" },
  { id: "Cultural & Arts", label: "Culture & arts" },
  { id: "Gaming & Anime", label: "Gaming & anime" },
  { id: "Sports & Fitness", label: "Sports & fitness" },
  { id: "Academics & Placements", label: "Studies & careers" },
  { id: "General", label: "General" },
] as const;

type Privacy = "PUBLIC" | "PRIVATE" | "UNLISTED";

const PRIVACY_OPTIONS: Array<{ value: Privacy; label: string; description: string }> = [
  { value: "PUBLIC", label: "Public", description: "Anyone can see posts and join." },
  { value: "PRIVATE", label: "Private", description: "People ask to join. Only members see posts." },
  {
    value: "UNLISTED",
    label: "Hidden",
    description: "Not listed anywhere. Only people with the link can join.",
  },
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
  const [privacy, setPrivacy] = useState<Privacy>("PUBLIC");
  const [allowAnonymousPosts, setAllowAnonymousPosts] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [rules, setRules] = useState<CommunityRule[]>([
    { title: "Be respectful", description: "No hate speech, harassment or personal attacks." },
    { title: "Stay on topic", description: "Keep posts about what this community is for." },
  ]);

  const derivedSlug = useMemo(() => slugify(customSlug.trim() || name), [customSlug, name]);
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;

  function handleAddRule() {
    if (rules.length >= MAX_COMMUNITY_RULES) {
      toast.error(`You can have up to ${MAX_COMMUNITY_RULES} rules. Remove one to add another.`);
      return;
    }
    sounds.tap();
    haptics.light();
    setRules([...rules, { title: "", description: "" }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Add a name for your community.");
      return;
    }

    setLoading(true);
    sounds.tap();
    haptics.light();

    try {
      const validRules = rules.filter((r) => r.title.trim().length > 0);
      const newComm = await createCommunity({
        name: name.trim(),
        slug: derivedSlug || undefined,
        description: description.trim() || undefined,
        category,
        privacy,
        allowAnonymousPosts,
        rules: validRules.length > 0 ? JSON.stringify(validRules) : undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
      });

      sounds.pop();
      haptics.success();
      toast.success(`c/${newComm.name} is live`);
      router.push(`/communities/${newComm.slug || newComm.id}`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Couldn't create the community. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pt-3 pb-32 sm:px-6">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/communities">
          <ArrowLeft />
          Communities
        </Link>
      </Button>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-7">
          <div className="space-y-1">
            <h1 className="text-3xl text-fg">Start a community</h1>
            <p className="text-fg-muted">For a club, a study group or anything your campus is into.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Name and topic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Name" hint="Short and easy to remember." required>
                <Input
                  required
                  maxLength={40}
                  placeholder="film-club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormField>

              <FormField
                label="Link (optional)"
                hint={
                  derivedSlug
                    ? `campusloop.space/communities/${derivedSlug}`
                    : "Made from the name if you leave it empty."
                }
              >
                <Input
                  maxLength={30}
                  placeholder={derivedSlug || "film-club"}
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                />
              </FormField>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-fg">Topic</legend>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Chip
                      key={cat.id}
                      selected={category === cat.id}
                      onSelectedChange={() => {
                        sounds.tap();
                        haptics.light();
                        setCategory(cat.id);
                      }}
                    >
                      {cat.label}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <FormField label="What's it about?" hint={`${description.length}/300`}>
                <Textarea
                  rows={3}
                  maxLength={300}
                  placeholder="What will people post and talk about here?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Picture and cover</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Picture link (optional)">
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://…/logo.png"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </FormField>
              <FormField label="Cover link (optional)">
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://…/cover.jpg"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                />
              </FormField>
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
                  <Label htmlFor="create-allow-anon">Allow anonymous posts</Label>
                  <p className="text-sm text-fg-muted">Members can post without showing their name.</p>
                </div>
                <Switch
                  id="create-allow-anon"
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
            onChange={(idx, field, value) =>
              setRules(rules.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
            }
          />

          <Button type="submit" size="lg" loading={loading} disabled={!name.trim()} className="w-full">
            Create community
          </Button>
        </form>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            <CreateCommunityPreview
              name={name}
              description={description}
              category={categoryLabel}
              privacy={privacy}
              avatarUrl={avatarUrl.trim()}
              bannerUrl={bannerUrl.trim()}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
