import { buttonVariants } from "@/components/ui/button";
import { InstagramIcon } from "@/components/ui/social-icons";
import { cn } from "@/lib/utils";

const INSTAGRAM_URL = "https://www.instagram.com/campusloop.space/";

/** Shown to students whose college does not have the marketplace yet. */
export function MarketplaceLaunchNotice({ collegeName }: { collegeName?: string }) {
  return (
    <section
      aria-labelledby="marketplace-launch-title"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-1">
        <h2 id="marketplace-launch-title" className="font-sans text-base font-semibold text-fg">
          Marketplace isn&apos;t open at {collegeName || "your college"} yet
        </h2>
        <p className="max-w-prose text-sm text-fg-muted">
          It&apos;s live at BIT Mesra for now. Want it at your college? Message us.
        </p>
      </div>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "md" }), "shrink-0")}
      >
        <InstagramIcon className="size-4 fill-current" />
        Message us on Instagram
      </a>
    </section>
  );
}

export { INSTAGRAM_URL };
