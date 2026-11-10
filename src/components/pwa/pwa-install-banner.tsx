"use client";

import { Download, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { trackPWAInstallOutcome } from "@/lib/analytics/ga4";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { PWAInstallSteps } from "./pwa-install-steps";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Trigger PWA Install Prompt or Instructions Modal from anywhere in the app
 */
export function triggerPWAInstall() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("campusloop_trigger_pwa_install"));
  }
}

export function PWAInstallBanner() {
  const pathname = usePathname();
  const unreadCount = useUnreadNotificationsCount();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [, setInstalled] = useState(false);

  // Merchant Portal & Admin have dedicated interfaces and MUST NOT show main student app install prompt
  const isMerchantOrAdmin = pathname?.startsWith("/merchant-portal") || pathname?.startsWith("/admin");

  // ─── PWA Badging API ───
  useEffect(() => {
    if (isMerchantOrAdmin) return;
    if (typeof navigator !== "undefined") {
      if ("setAppBadge" in navigator) {
        if (unreadCount > 0) {
          navigator.setAppBadge(unreadCount).catch(() => {});
        } else if ("clearAppBadge" in navigator) {
          navigator.clearAppBadge().catch(() => {});
        }
      }
    }
  }, [unreadCount, isMerchantOrAdmin]);

  // ─── PWA Audio & Haptic Network Cues ───
  useEffect(() => {
    if (isMerchantOrAdmin) return;
    function handleOnline() {
      sounds.ting();
      haptics.success();
    }
    function handleOffline() {
      haptics.heavy();
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isMerchantOrAdmin]);

  useEffect(() => {
    if (isMerchantOrAdmin) return;
    // Check if already running in standalone / PWA mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(Boolean(isStandaloneMode));
    if (isStandaloneMode) return;

    // Detect device OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if user dismissed banner recently — 7 day cooldown (30 days after 3+ dismissals)
    let dismissedAt: string | null = null;
    let dismissCount = 0;
    try {
      dismissedAt = localStorage.getItem("cl_pwa_dismissed");
      dismissCount = Number(localStorage.getItem("cl_pwa_dismiss_count") || "0");
    } catch {}
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      const cooldownDays = dismissCount >= 3 ? 30 : 7;
      if (daysSinceDismissed < cooldownDays) return;
    }

    // Android/Desktop Chrome install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Global programmatic trigger
    const handleCustomTrigger = () => {
      if (globalDeferredPrompt) {
        globalDeferredPrompt.prompt().then(async () => {
          const choice = await globalDeferredPrompt?.userChoice;
          if (choice?.outcome === "accepted") {
            sounds.match();
            haptics.match();
            setInstalled(true);
            setShowBanner(false);
          }
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
        });
      } else if (isIosDevice) {
        setShowIOSModal(true);
      } else {
        setShowAndroidModal(true);
      }
    };

    window.addEventListener("campusloop_trigger_pwa_install", handleCustomTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("campusloop_trigger_pwa_install", handleCustomTrigger);
    };
  }, [isMerchantOrAdmin]);

  async function handleInstallClick() {
    sounds.tap();
    haptics.light();
    if (deferredPrompt || globalDeferredPrompt) {
      const p = deferredPrompt || globalDeferredPrompt;
      p?.prompt();
      const choice = await p?.userChoice;
      if (choice?.outcome === "accepted") {
        sounds.match();
        haptics.match();
        setInstalled(true);
        setShowBanner(false);
        trackPWAInstallOutcome("accepted");
      } else {
        trackPWAInstallOutcome("dismissed");
      }
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowAndroidModal(true);
    }
  }

  function handleDismiss() {
    sounds.tap();
    haptics.light();
    trackPWAInstallOutcome("dismissed");
    setShowBanner(false);
    setShowIOSModal(false);
    setShowAndroidModal(false);
    try {
      localStorage.setItem("cl_pwa_dismissed", String(Date.now()));
      const prevCount = Number(localStorage.getItem("cl_pwa_dismiss_count") || "0");
      localStorage.setItem("cl_pwa_dismiss_count", String(prevCount + 1));
    } catch {}
  }

  if (isMerchantOrAdmin || isStandalone) return null;

  return (
    <>
      {showBanner && (
        <div className="fixed inset-x-4 bottom-[calc(var(--nav-mobile-h)+env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-sm md:hidden">
          <div className="sticker sticker-pop flex items-center gap-3 p-3 [--pop-from:-3deg]">
            <img src="/logo.png" alt="" className="size-10 shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">Get the CampusLoop app</p>
              <p className="truncate text-xs text-fg-muted">Opens full screen. Free.</p>
            </div>
            <Button size="sm" onClick={handleInstallClick}>
              <Download className="size-4" aria-hidden="true" />
              Install
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Not now" onClick={handleDismiss}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <PWAInstallSteps
        platform="android"
        open={showAndroidModal}
        onOpenChange={(open) => {
          setShowAndroidModal(open);
          if (!open) setShowBanner(false);
        }}
      />
      <PWAInstallSteps
        platform="ios"
        open={showIOSModal}
        onOpenChange={(open) => {
          setShowIOSModal(open);
          if (!open) setShowBanner(false);
        }}
      />
    </>
  );
}
