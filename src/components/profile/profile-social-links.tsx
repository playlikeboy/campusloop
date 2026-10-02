import { Link2 } from "lucide-react";
import { SocialPlatformIcon } from "@/components/ui/social-icons";
import { type CustomLink, displayValueFor, PLATFORM_MAP, resolvePlatformUrl } from "@/lib/social-links";

interface ProfileSocialLinksProps {
  links?: {
    platforms?: Record<string, string>;
    custom?: CustomLink[];
  } | null;
}

function Tile({
  platformKey,
  monogram,
  color,
  label,
  sub,
  href,
}: {
  platformKey: string;
  monogram: string;
  color: string;
  label: string;
  sub: string;
  href: string | null;
}) {
  const tile = (
    <span
      className="flex size-9 items-center justify-center rounded-xl shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}35` }}
    >
      <SocialPlatformIcon platformKey={platformKey} className="size-4 shrink-0" fallbackMonogram={monogram} />
    </span>
  );
  const text = (
    <span className="min-w-0 text-left">
      <span className="block text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
        {label}
      </span>
      <span className="block text-[10px] text-muted-foreground truncate max-w-[120px] leading-tight">
        {sub}
      </span>
    </span>
  );
  const cls =
    "group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-2.5 py-1.5 transition-all";
  if (!href) {
    return (
      <span className={cls} title={`${label}: ${sub}`}>
        {tile}
        {text}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="me noopener noreferrer" className={cls} title={`${label}: ${sub}`}>
      {tile}
      {text}
    </a>
  );
}

export function ProfileSocialLinks({ links }: ProfileSocialLinksProps) {
  if (!links) return null;

  const platformTiles = Object.entries(links.platforms ?? {})
    .map(([key, raw]) => {
      const platform = PLATFORM_MAP[key];
      if (!platform || !raw?.trim()) return null;
      return (
        <Tile
          key={key}
          platformKey={key}
          monogram={platform.monogram}
          color={platform.color}
          label={platform.label}
          sub={displayValueFor(platform, raw)}
          href={resolvePlatformUrl(platform, raw)}
        />
      );
    })
    .filter(Boolean);

  const customTiles = (links.custom ?? [])
    .filter((c) => c.label?.trim() && c.url?.trim())
    .map((c, i) => (
      <Tile
        key={`custom-${i}`}
        platformKey={c.label.trim().toLowerCase()}
        monogram={(c.label.trim()[0] ?? "L").toUpperCase()}
        color="#a170ff"
        label={c.label.trim()}
        sub={displayValueFor(
          {
            key: "custom",
            label: c.label,
            category: "Professional",
            monogram: "L",
            color: "#a170ff",
            kind: "url",
            placeholder: "",
            hint: "",
          },
          c.url
        )}
        href={c.url.startsWith("http") ? c.url : `https://${c.url}`}
      />
    ));

  const all = [...platformTiles, ...customTiles];
  if (all.length === 0) return null;

  return (
    <div className="space-y-2 pt-1">
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Link2 className="size-3" /> Links
      </p>
      <div className="flex flex-wrap gap-2">{all}</div>
    </div>
  );
}
