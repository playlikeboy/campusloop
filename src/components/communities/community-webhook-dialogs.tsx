"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export interface NewWebhookInput {
  name: string;
  botName?: string;
  avatarUrl?: string;
}

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityName: string;
  /** Resolves true when the webhook was created (the form then clears). Must not throw. */
  onCreate: (input: NewWebhookInput) => Promise<boolean>;
}

export function CreateWebhookDialog({
  open,
  onOpenChange,
  communityName,
  onCreate,
}: CreateWebhookDialogProps) {
  const [name, setName] = useState("");
  const [botName, setBotName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give the webhook a name first.");
      return;
    }
    setSaving(true);
    try {
      const created = await onCreate({
        name: name.trim(),
        botName: botName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      if (created) {
        setName("");
        setBotName("");
        setAvatarUrl("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New webhook</DialogTitle>
          <DialogDescription>Posts sent to this link show up in c/{communityName}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" required>
            <Input
              placeholder="GitHub releases"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
            />
          </FormField>

          <FormField label="Bot name" hint="Shown as the author of each post. Leave empty to use CampusBot.">
            <Input
              placeholder="ACM Bot"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              maxLength={40}
            />
          </FormField>

          <FormField label="Bot picture link (optional)">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://example.com/bot.png"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </FormField>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={!name.trim()}>
              Create webhook
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CurlGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  botName: string;
}

export function CurlGuideDialog({ open, onOpenChange, url, botName }: CurlGuideDialogProps) {
  const snippet = `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Hackathon results",
    "body": "Results are out. Check the notice board.",
    "botName": "${botName}"
  }'`;

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Command copied");
    } catch {
      toast.error("Couldn't copy. Select the command and copy it by hand.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a post with cURL</DialogTitle>
          <DialogDescription>Send a POST request with a JSON body to your webhook link.</DialogDescription>
        </DialogHeader>

        <pre className="overflow-x-auto rounded-md border border-border bg-surface-muted p-3.5 font-mono text-xs whitespace-pre-wrap break-all text-fg">
          {snippet}
        </pre>

        <div className="mt-4 space-y-1.5 text-sm text-fg-muted">
          <p className="font-semibold text-fg">Fields you can send</p>
          <ul className="list-inside list-disc space-y-0.5">
            <li>
              <code className="font-mono">body</code> or <code className="font-mono">content</code>: the post
              text (Markdown works)
            </li>
            <li>
              <code className="font-mono">title</code>: optional
            </li>
            <li>
              <code className="font-mono">botName</code> or <code className="font-mono">username</code>:
              optional author name
            </li>
            <li>
              <code className="font-mono">avatarUrl</code>: optional picture link
            </li>
          </ul>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={copySnippet}>
            <Copy />
            Copy command
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
