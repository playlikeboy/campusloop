"use client";

import { Download, PlusSquare, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "cl_merchant_pwa_dismissed";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(at) && Date.now() - at < WEEK_MS;
  } catch {
    return false;
  }
}

/** Offers to install the store dashboard as an app, so order sounds work from the home screen. */
export function MerchantPWAInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || dismissedRecently()) return;

    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const timer = ios ? window.setTimeout(() => setShow(true), 2000) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  async function install() {
    sounds.tap();
    haptics.medium();
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        haptics.success();
        setShow(false);
      }
      setDeferred(null);
    } else if (isIOS) {
      setIosHelp(true);
    }
  }

  function dismiss() {
    sounds.tap();
    setShow(false);
    setIosHelp(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode: the banner may show again next visit, which is fine.
    }
  }

  if (!show) return null;

  return (
    <>
      <aside
        aria-label="Install the store app"
        className="sticker-pop fixed inset-x-4 bottom-4 z-(--z-sticky) flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3 shadow-lg sm:right-6 sm:left-auto sm:max-w-sm"
      >
        <img src="/logo.png" alt="" className="size-10 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">Install the store app</p>
          <p className="text-sm text-fg-muted">Hear new orders from your home screen.</p>
        </div>
        <Button onClick={() => void install()}>
          <Download />
          Install
        </Button>
        <Button variant="ghost" size="icon" aria-label="Not now" onClick={dismiss}>
          <X />
        </Button>
      </aside>

      <Dialog open={iosHelp} onOpenChange={setIosHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to your iPhone</DialogTitle>
            <DialogDescription>Three taps in Safari.</DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-fg">
            <li>
              Tap <Share aria-hidden className="inline size-4 align-text-bottom text-brand-text" />{" "}
              <strong>Share</strong> at the bottom.
            </li>
            <li>
              Tap <PlusSquare aria-hidden className="inline size-4 align-text-bottom text-brand-text" />{" "}
              <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Tap <strong>Add</strong>.
            </li>
          </ol>
          <Button className="mt-5 w-full" onClick={dismiss}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
