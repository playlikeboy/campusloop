"use client";

import { Bike, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BikeEditDialog } from "@/components/merchant/bikes/bike-edit-dialog";
import { LoadError } from "@/components/merchant/load-error";
import { SearchField } from "@/components/merchant/merchant-filters";
import { MerchantListSkeleton, MerchantPage } from "@/components/merchant/merchant-page";
import { readError, rupees } from "@/components/merchant/merchant-utils";
import { StatusBadge } from "@/components/merchant/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher } from "@/lib/api";

export function MerchantFleetClient() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [removing, setRemoving] = useState<any | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ fleet: any[] }>("/api/merchant/bikes/fleet", fetcher, {
    dedupingInterval: 6000,
  });
  const fleet = data?.fleet || [];
  const q = query.toLowerCase().trim();
  const list = q
    ? fleet.filter((b) =>
        [b.name, b.model, b.registrationNumber].some((v: string | undefined) => v?.toLowerCase().includes(q))
      )
    : fleet;

  async function confirmRemove() {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      const res = await fetch(`/api/merchant/bikes/fleet?id=${removing.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res, "Couldn't remove the bike. Try again."));
      await mutate();
      toast.success("Bike removed. Old bookings are kept.");
      setRemoving(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove the bike. Try again.");
    } finally {
      setRemoveBusy(false);
    }
  }

  const addBike = (
    <Button asChild>
      <Link href="/merchant-portal/bikes/fleet/new">
        <Plus />
        Add a bike
      </Link>
    </Button>
  );

  return (
    <MerchantPage
      title="Your bikes"
      description="Status, price and deposit for each bike."
      primaryAction={addBike}
      toolbar={
        fleet.length > 0 ? (
          <SearchField
            label="Search bikes"
            value={query}
            onChange={setQuery}
            placeholder="Name, model or number plate"
          />
        ) : undefined
      }
    >
      {isLoading ? (
        <MerchantListSkeleton rows={3} />
      ) : error ? (
        <LoadError what="your bikes" onRetry={mutate} />
      ) : list.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {list.map((bike) => (
            <li key={bike.id} className="flex items-center gap-3 p-3">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted text-fg-subtle">
                {bike.imageUrl ? (
                  <img src={bike.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <Bike className="size-6" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-fg">{bike.name}</p>
                  <StatusBadge kind="bike" status={bike.status} />
                </div>
                <p className="truncate text-sm text-fg-muted">
                  {bike.registrationNumber} ·{" "}
                  <span className="tabular-nums">{rupees(bike.dailyPrice)}/day</span>
                  {bike.hourlyPrice ? ` · ${rupees(bike.hourlyPrice)}/hr` : ""}
                </p>
                <p className="truncate text-sm text-fg-subtle">
                  Deposit {rupees(bike.securityDeposit)}
                  {bike.pickupLocation ? ` · ${bike.pickupLocation}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${bike.name}`}
                onClick={() => setEditing(bike)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${bike.name}`}
                className="text-fg-muted hover:text-danger"
                onClick={() => setRemoving(bike)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : q ? (
        <EmptyState bordered icon={Bike} title="No bike matches that" description="Try another word." />
      ) : (
        <EmptyState
          bordered
          icon={Bike}
          title="No bikes yet"
          description="Add your first bike so students can book it."
          action={addBike}
        />
      )}

      <BikeEditDialog bike={editing} onClose={() => setEditing(null)} onSaved={mutate} />
      <ConfirmDialog
        isOpen={Boolean(removing)}
        title={`Remove ${removing?.name ?? "this bike"}?`}
        description="Students can't book it anymore. Old bookings stay saved."
        confirmText="Remove"
        isLoading={removeBusy}
        onConfirm={confirmRemove}
        onClose={() => setRemoving(null)}
      />
    </MerchantPage>
  );
}
