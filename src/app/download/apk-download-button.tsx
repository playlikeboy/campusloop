"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ApkVariant, trackApkDownload } from "@/lib/analytics/ga4";

const RELEASES = "https://github.com/playlikeboy/campusloop/releases/download";

/** Stable download URLs: each CI build replaces the file on its GitHub release. */
export const APK_URLS: Record<ApkVariant, string> = {
  expo: `${RELEASES}/beta/campusloop-beta.apk`,
  capacitor: `${RELEASES}/beta-web/campusloop-web-beta.apk`,
  twa: `${RELEASES}/beta-twa/campusloop-twa-beta.apk`,
};

/** The native (Expo) beta, kept for existing imports. */
export const APK_URL = APK_URLS.expo;

/** Plain link to a beta APK; logs apk_download (placement + variant) to GA4 on click. */
export function ApkDownloadButton({
  placement = "download_page",
  variant = "expo",
  label = "Download the Android beta",
}: {
  placement?: string;
  variant?: ApkVariant;
  label?: string;
}) {
  return (
    <Button asChild size="lg" className="w-full sm:w-auto">
      <a href={APK_URLS[variant]} download onClick={() => trackApkDownload(placement, variant)}>
        <Download aria-hidden />
        {label}
      </a>
    </Button>
  );
}
