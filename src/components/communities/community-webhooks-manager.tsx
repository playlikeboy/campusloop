"use client";

import { Bot, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createCommunityWebhook,
  deleteCommunityWebhook,
  getCommunityWebhooks,
  regenerateCommunityWebhookToken,
  sendTestCommunityWebhookPost,
  toggleCommunityWebhook,
} from "@/app/(app)/(main)/communities/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { CommunityWebhook } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { CreateWebhookDialog, CurlGuideDialog, type NewWebhookInput } from "./community-webhook-dialogs";
import { CommunityWebhookRow } from "./community-webhook-row";

interface CommunityWebhooksManagerProps {
  community: {
    id: string;
    slug?: string | null;
    name: string;
  };
}

function errorText(err: unknown, fallback: string) {
  return (err as Error)?.message || fallback;
}

export function CommunityWebhooksManager({ community }: CommunityWebhooksManagerProps) {
  const [webhooks, setWebhooks] = useState<CommunityWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [guideFor, setGuideFor] = useState<CommunityWebhook | null>(null);
  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const identifier = community.slug || community.id;

  const loadWebhooks = useCallback(async () => {
    try {
      setWebhooks(await getCommunityWebhooks(community.id));
    } catch (err: unknown) {
      toast.error(errorText(err, "Couldn't load webhooks. Refresh the page to try again."));
    } finally {
      setLoading(false);
    }
  }, [community.id]);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  function getWebhookUrl(token: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
    return `${origin}/api/communities/${identifier}/webhook?token=${token}`;
  }

  async function handleCopyUrl(token: string) {
    sounds.tap();
    haptics.light();
    try {
      await navigator.clipboard.writeText(getWebhookUrl(token));
      setCopiedToken(token);
      toast.success("Webhook link copied");
      setTimeout(() => setCopiedToken(null), 2500);
    } catch {
      toast.error("Couldn't copy. Show the link and copy it by hand.");
    }
  }

  async function handleCreate(input: NewWebhookInput) {
    try {
      const created = await createCommunityWebhook({ communityId: community.id, ...input });
      setWebhooks((prev) => [created, ...prev]);
      setShowCreate(false);
      toast.success("Webhook created");
      sounds.pop();
      haptics.medium();
      return true;
    } catch (err: unknown) {
      toast.error(errorText(err, "Couldn't create the webhook. Try again."));
      return false;
    }
  }

  async function handleToggle(wh: CommunityWebhook) {
    sounds.tap();
    haptics.light();
    try {
      const updated = await toggleCommunityWebhook(wh.id, !wh.isActive);
      setWebhooks((prev) => prev.map((w) => (w.id === wh.id ? updated : w)));
      toast.success(updated.isActive ? "Webhook turned on" : "Webhook paused");
    } catch (err: unknown) {
      toast.error(errorText(err, "Couldn't change the webhook. Try again."));
    }
  }

  async function handleRegenerate(wh: CommunityWebhook) {
    if (!confirm(`Make a new secret link for "${wh.name}"? Anything using the old link will stop working.`))
      return;
    sounds.tap();
    haptics.medium();
    try {
      const updated = await regenerateCommunityWebhookToken(wh.id);
      setWebhooks((prev) => prev.map((w) => (w.id === wh.id ? updated : w)));
      toast.success("New secret link made");
    } catch (err: unknown) {
      toast.error(errorText(err, "Couldn't make a new link. Try again."));
    }
  }

  async function handleDelete(wh: CommunityWebhook) {
    if (!confirm(`Delete "${wh.name}"? This can't be undone.`)) return;
    sounds.tap();
    haptics.medium();
    try {
      await deleteCommunityWebhook(wh.id);
      setWebhooks((prev) => prev.filter((w) => w.id !== wh.id));
      toast.success("Webhook deleted");
    } catch (err: unknown) {
      toast.error(errorText(err, "Couldn't delete the webhook. Try again."));
    }
  }

  async function handleTest(wh: CommunityWebhook) {
    sounds.pop();
    haptics.medium();
    setTestingId(wh.id);
    try {
      await sendTestCommunityWebhookPost(wh.id);
      toast.success("Test post sent");
      setWebhooks((prev) =>
        prev.map((w) => (w.id === wh.id ? { ...w, postsCount: w.postsCount + 1, lastUsedAt: new Date() } : w))
      );
    } catch (err: unknown) {
      toast.error(errorText(err, "Test post failed. Check the webhook is on and try again."));
    } finally {
      setTestingId(null);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="webhooks-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 id="webhooks-heading" className="text-lg font-semibold text-fg">
            Webhooks and bots
          </h2>
          <p className="text-sm text-fg-muted">
            Let a script, GitHub Action or Discord bot post in c/{community.name}.
          </p>
        </div>
        <Button
          onClick={() => {
            sounds.tap();
            haptics.light();
            setShowCreate(true);
          }}
          className="shrink-0"
        >
          <Plus />
          New webhook
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading webhooks">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
      ) : webhooks.length === 0 ? (
        <EmptyState
          icon={Bot}
          bordered
          title="No webhooks yet"
          description="Make one to post club updates or contest alerts automatically."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus />
              New webhook
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {webhooks.map((wh) => (
            <CommunityWebhookRow
              key={wh.id}
              webhook={wh}
              url={getWebhookUrl(wh.token)}
              maskedUrl={getWebhookUrl(`${wh.token.substring(0, 10)}••••••••••••`)}
              tokenVisible={Boolean(visibleTokens[wh.id])}
              copied={copiedToken === wh.token}
              testing={testingId === wh.id}
              onToggleToken={() => setVisibleTokens((prev) => ({ ...prev, [wh.id]: !prev[wh.id] }))}
              onCopy={() => handleCopyUrl(wh.token)}
              onToggleActive={() => handleToggle(wh)}
              onTest={() => handleTest(wh)}
              onShowGuide={() => setGuideFor(wh)}
              onRegenerate={() => handleRegenerate(wh)}
              onDelete={() => handleDelete(wh)}
            />
          ))}
        </ul>
      )}

      <CreateWebhookDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        communityName={community.name}
        onCreate={handleCreate}
      />
      <CurlGuideDialog
        open={guideFor !== null}
        onOpenChange={(open) => !open && setGuideFor(null)}
        url={guideFor ? getWebhookUrl(guideFor.token) : ""}
        botName={guideFor?.botName ?? ""}
      />
    </section>
  );
}
