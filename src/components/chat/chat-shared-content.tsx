"use client";

import { ExternalLink, ImageIcon, Link2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CachedMessage } from "@/lib/chat-cache";

const IMAGE_URL = /(https?:\/\/[^\s)]+?\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s)]*)?)/gi;
const HOSTED_IMAGE = /(https?:\/\/(?:images\.unsplash\.com|i\.ibb\.co|res\.cloudinary\.com)[^\s)]+)/gi;
const ANY_URL = /(https?:\/\/[^\s)]+)/gi;

/** Photos and links found in the loaded messages, newest first. */
export function useSharedContent(messages: CachedMessage[]) {
  return useMemo(() => {
    const media: { id: string; url: string }[] = [];
    const links: { id: string; url: string; domain: string }[] = [];
    for (const m of messages) {
      if (!m.body) continue;
      for (const url of m.body.match(IMAGE_URL) || m.body.match(HOSTED_IMAGE) || []) {
        media.push({ id: m.id + url, url });
      }
      for (const url of m.body.match(ANY_URL) || []) {
        if (/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(url) || /\/api\/files\/r2\//.test(url)) continue;
        let domain = "link";
        try {
          domain = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          // keep "link"
        }
        links.push({ id: m.id + url, url, domain });
      }
    }
    return { media: media.reverse(), links: links.reverse() };
  }, [messages]);
}

/** Media / Links tabs for the chat info panel, with a photo viewer. */
export function ChatSharedContent({ messages }: { messages: CachedMessage[] }) {
  const { media, links } = useSharedContent(messages);
  const [viewing, setViewing] = useState<string | null>(null);

  return (
    <>
      <Tabs defaultValue="media">
        <TabsList variant="line" className="w-full justify-start gap-6 border-b border-border">
          <TabsTrigger value="media">Photos ({media.length})</TabsTrigger>
          <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="media" className="pt-3">
          {media.length > 0 ? (
            <ul className="grid grid-cols-3 gap-1.5">
              {media.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setViewing(item.url)}
                    aria-label="Open photo"
                    className="block aspect-square w-full cursor-pointer overflow-hidden rounded-sm bg-surface-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img src={item.url} alt="" className="size-full object-cover" loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              size="compact"
              icon={ImageIcon}
              title="No photos yet"
              description="Photos you send each other show up here."
            />
          )}
        </TabsContent>
        <TabsContent value="links" className="pt-3">
          {links.length > 0 ? (
            <ul className="space-y-1">
              {links.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center gap-3 rounded-md px-2 transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ExternalLink className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-brand-text">
                        {item.domain}
                      </span>
                      <span className="block truncate text-xs text-fg-muted">{item.url}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              size="compact"
              icon={Link2}
              title="No links yet"
              description="Links you share show up here."
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        {viewing && (
          <DialogContent className="max-w-3xl p-2 sm:p-3">
            <img
              src={viewing}
              alt="Shared photo"
              className="max-h-[80dvh] w-full rounded-lg object-contain"
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
