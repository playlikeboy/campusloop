"use client";

import { Copy, Download, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { CampusQrCode, generateBrandedQrDataUrl } from "@/components/common/campus-qr-code";
import { LoadError } from "@/components/merchant/load-error";
import { MerchantPage } from "@/components/merchant/merchant-page";
import { copyText, storeUrl } from "@/components/merchant/merchant-utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export function MerchantQrClient() {
  const [downloading, setDownloading] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<{ merchant: any }>("/api/merchant/store", fetcher);
  const merchant = data?.merchant;
  const targetUrl = merchant ? storeUrl(merchant.id) : "";

  async function handleDownload() {
    if (!targetUrl) return;
    sounds.tap();
    haptics.success();
    setDownloading(true);
    try {
      const dataUrl = await generateBrandedQrDataUrl({
        value: targetUrl,
        size: 1080,
        logoUrl: "/logo.png",
        // ds-allow: QR modules are rasterised to PNG; scanners need pure black on white, not theme tokens
        darkColor: "#000000",
        // ds-allow: see above
        lightColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${(merchant?.name || "campus-store").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("QR code saved to your downloads");
    } catch {
      toast.error("Couldn't make the QR image. Try again, or print this page instead.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <MerchantPage
      width="narrow"
      title="QR poster"
      description="Print it for your counter. Students scan it to see your menu and order."
      className="print:max-w-none"
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-poster,
          #qr-poster * {
            visibility: visible;
          }
          #qr-poster {
            position: absolute;
            inset: 0;
            margin: auto;
            box-shadow: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {error && !merchant ? (
        <LoadError what="your store link" onRetry={mutate} />
      ) : isLoading || !merchant ? (
        <Skeleton className="mx-auto h-[26rem] w-full max-w-xs rounded-sticker" />
      ) : (
        <div
          id="qr-poster"
          className="sticker-pop mx-auto flex max-w-xs flex-col items-center gap-4 rounded-sticker border border-sticker-border bg-sticker p-6 text-center text-sticker-fg shadow-sticker"
        >
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="size-6 object-contain" />
            <span className="font-display text-sm font-bold">CampusLoop</span>
          </div>
          <h2 className="sticker-caption text-2xl leading-tight">{merchant.name}</h2>
          <div className="rounded-md bg-surface p-2">
            <CampusQrCode
              value={targetUrl}
              size={220}
              logoUrl="/logo.png"
              bordered={false}
              // ds-allow: QR modules must stay pure black for scanners
              darkColor="#000000"
            />
          </div>
          <p className="text-base font-semibold">Scan to see the menu and order</p>
          <p className="text-sm text-fg-muted">campusloop.space</p>
        </div>
      )}

      <div className="mx-auto flex max-w-xs flex-col gap-2 print:hidden">
        <Button
          size="lg"
          disabled={!merchant}
          onClick={() => {
            sounds.tap();
            window.print();
          }}
        >
          <Printer />
          Print poster
        </Button>
        <Button variant="outline" loading={downloading} disabled={!merchant} onClick={handleDownload}>
          <Download />
          Download QR image
        </Button>
        <Button
          variant="ghost"
          disabled={!merchant}
          onClick={() => void copyText(targetUrl, "Store link copied")}
        >
          <Copy />
          Copy store link
        </Button>
      </div>
    </MerchantPage>
  );
}
