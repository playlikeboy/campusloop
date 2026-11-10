import { Globe, Lock } from "lucide-react";

interface CreateCommunityPreviewProps {
  name: string;
  description: string;
  category: string;
  privacy: "PUBLIC" | "PRIVATE" | "UNLISTED";
  avatarUrl: string;
  bannerUrl: string;
}

/** How the new community will look in the list. Shows only what will be saved. */
export function CreateCommunityPreview({
  name,
  description,
  category,
  privacy,
  avatarUrl,
  bannerUrl,
}: CreateCommunityPreviewProps) {
  const initial = (name.trim()[0] || "C").toUpperCase();
  return (
    <section aria-label="Preview" className="space-y-2">
      <h2 className="text-sm font-semibold text-fg-muted">Preview</h2>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="h-20 w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="h-20 w-full bg-surface-muted" />
        )}
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-11 shrink-0 rounded-md object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-subtle font-display text-lg font-bold text-brand-text">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-fg">c/{name.trim() || "your-community"}</p>
              <p className="flex items-center gap-1 text-sm text-fg-muted">
                {privacy === "PUBLIC" ? (
                  <Globe className="size-3.5" aria-hidden="true" />
                ) : (
                  <Lock className="size-3.5" aria-hidden="true" />
                )}
                {privacy === "PUBLIC" ? "Public" : privacy === "PRIVATE" ? "Private" : "Hidden"} · {category}
              </p>
            </div>
          </div>
          <p className="line-clamp-3 text-sm text-fg-muted">
            {description.trim() || "Your description shows here."}
          </p>
        </div>
      </div>
    </section>
  );
}
