"use client";

import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Revalidate all active SWR keys across the app
      mutate(() => true, undefined, { revalidate: true });

      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);

      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [mutate]);

  const handleManualSync = () => {
    mutate(() => true, undefined, { revalidate: true });
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-3 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface-raised/95 text-fg shadow-lg backdrop-blur-md pointer-events-auto text-xs font-bold">
            <span className="flex size-2 rounded-full bg-warning animate-pulse" />
            <WifiOff className="size-3.5 text-warning" />
            <span>Offline Mode · Viewing cached campus data</span>
            <button
              type="button"
              onClick={handleManualSync}
              className="ml-1 p-1 rounded-full hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              title="Try Reconnecting"
            >
              <RefreshCw className="size-3" />
            </button>
          </div>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-3 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-success-subtle text-success shadow-lg backdrop-blur-md pointer-events-auto text-xs font-bold">
            <Wifi className="size-3.5 text-success" />
            <span>Back online · Campus feed synced</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
