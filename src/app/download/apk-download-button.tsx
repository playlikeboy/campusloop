"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackApkDownload } from "@/lib/analytics/ga4";

export const APK_URL = "https://github.com/playlikeboy/campusloop/releases/download/beta/campusloop-beta.apk";

/** Plain link to the beta APK; logs apk_download to GA4 on click. */
export function ApkDownloadButton({ placement = "download_page" }: { placement?: string }) {
  return (
    <Button asChild size="lg">
      <a href={APK_URL} download onClick={() => trackApkDownload(placement)}>
        <Download aria-hidden />
        Download the Android beta
      </a>
    </Button>
  );
}
