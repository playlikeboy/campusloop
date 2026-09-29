"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PwaLaunchRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      router.replace("/feeds");
    }
  }, [router]);

  return null;
}
