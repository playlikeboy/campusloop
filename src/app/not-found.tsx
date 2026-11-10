import Link from "next/link";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { StatusScreen } from "@/components/shells/status-screen";
import { buttonVariants } from "@/components/ui/button";
import { hexclaveServerApp } from "@/hexclave/server";
import { cn } from "@/lib/utils";

export default async function NotFound() {
  const user = await hexclaveServerApp.getUser();

  return (
    <MarketingShell isAuthenticated={!!user} className="[&_main]:flex [&_main]:flex-col">
      <StatusScreen
        sticker="404"
        title="This page doesn't exist"
        description="The link may be old or have a typo."
        action={
          <Link
            href={user ? "/feeds" : "/"}
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
          >
            {user ? "Go to your feed" : "Go to the home page"}
          </Link>
        }
        secondary={
          <Link href="/explore" className="font-medium text-brand-text underline-offset-4 hover:underline">
            Search CampusLoop instead
          </Link>
        }
      />
    </MarketingShell>
  );
}
