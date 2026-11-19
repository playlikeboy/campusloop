"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { refreshGa4Snapshot } from "./actions";

export function RefreshGa4Button({ enabled }: { enabled: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={!enabled || pending}
      title={enabled ? undefined : "Needs COMPOSIO_API_KEY and COMPOSIO_GA_ACCOUNT_ID"}
      onClick={() =>
        start(async () => {
          const res = await refreshGa4Snapshot();
          if (res.ok) {
            toast.success("GA4 numbers updated");
            router.refresh();
          } else {
            toast.error(res.error);
          }
        })
      }
    >
      <RefreshCw className={pending ? "animate-spin" : undefined} aria-hidden />
      Refresh from GA4
    </Button>
  );
}
