"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MERCHANT_NAV, verticalLabel } from "@/components/merchant/merchant-nav";
import { MerchantNavPanel } from "@/components/merchant/merchant-nav-panel";
import { homePathFor, merchantVertical } from "@/components/merchant/merchant-utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface MerchantLayoutClientProps {
  children: React.ReactNode;
  profile: any;
  merchant?: any;
}

export function MerchantLayoutClient({ children, profile, merchant }: MerchantLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const vertical = merchantVertical(merchant, pathname);
  const items = MERCHANT_NAV[vertical];
  const verticalName = verticalLabel(vertical, merchant?.verticalType);

  async function handleLogout() {
    sounds.tap();
    haptics.medium();
    try {
      await fetch("/api/merchant/auth/logout", { method: "POST" });
      toast.success("Logged out");
    } catch {
      // The login page clears any stale session on its own.
    }
    router.push("/merchant-portal/login");
    router.refresh();
  }

  const panel = (onNavigate?: () => void) => (
    <MerchantNavPanel
      items={items}
      pathname={pathname}
      verticalName={verticalName}
      merchant={merchant}
      profile={profile}
      onNavigate={onNavigate}
      onLogout={handleLogout}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg md:flex-row">
      <header className="sticky top-0 z-(--z-sticky) flex h-14 items-center gap-2 border-b border-border bg-surface px-2 md:hidden">
        <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu />
        </Button>
        <Link href={homePathFor(vertical)} className="flex min-w-0 items-center gap-2">
          <img src="/logo.png" alt="" className="size-7 shrink-0 object-contain" />
          <span className="truncate font-display text-base font-bold">{merchant?.name || "Your store"}</span>
        </Link>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 overflow-y-auto border-r border-border bg-surface px-3 py-5 md:flex">
        <Link href={homePathFor(vertical)} className="flex items-center gap-2.5 px-3">
          <img src="/logo.png" alt="" className="size-8 object-contain" />
          <span className="leading-tight">
            <span className="block font-display text-base font-bold text-fg">CampusLoop</span>
            <span className="block text-sm text-fg-muted">Store dashboard</span>
          </span>
        </Link>
        <div className="flex-1">{panel()}</div>
      </aside>

      <Sheet side="left" open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Store menu</SheetTitle>
          </SheetHeader>
          <SheetBody>{panel(() => setMenuOpen(false))}</SheetBody>
        </SheetContent>
      </Sheet>

      <main className="w-full flex-1 px-4 pt-5 pb-24 sm:px-6 md:ml-64 md:pb-10">{children}</main>
    </div>
  );
}
