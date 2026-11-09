"use client";

import { CheckCircle2, MapPin, Rocket, Scissors, Ticket } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { InstagramIcon } from "@/components/ui/social-icons";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface BarberMarketplaceClientProps {
  profileId: string;
  collegeName?: string;
}

export function BarberMarketplaceClient({
  profileId,
  collegeName = "Campus Hub",
}: BarberMarketplaceClientProps) {
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isBookingToken, setIsBookingToken] = useState(false);

  const { data: storesData, isLoading } = useSWR<{ stores: any[] }>(
    `/api/marketplace/stores?category=barber`,
    fetcher,
    { dedupingInterval: 10000 }
  );

  const { data: productsData } = useSWR<{ products: any[] }>(
    `/api/marketplace/products?category=barber&limit=20`,
    fetcher,
    { dedupingInterval: 10000 }
  );

  const barberStores = storesData?.stores || [];
  const services = productsData?.products || [];
  const primaryBarber = barberStores[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28 select-none">
      {/* ─── Hero Banner ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-brand p-4 sm:p-6 text-brand-fg shadow-md">
        <div className="relative z-10 max-w-lg space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold">
            <Scissors className="size-3.5" />
            <span>Campus Barber &amp; Salon Express</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            Haircut, Beard Trim &amp; Salon Grooming
          </h1>
        </div>

        <div className="absolute right-4 -bottom-4 opacity-20 pointer-events-none">
          <Scissors className="size-32 sm:size-40" />
        </div>
      </div>

      {/* ─── Live Queue Token Status Card ─── */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-subtle text-success text-xs font-bold">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              <span>Live Queue Status</span>
            </div>
            <h3 className="text-base font-black text-foreground">
              {primaryBarber?.name || "BIT Campus Salon & Cuts"}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3 text-muted-foreground" />
              <span>{primaryBarber?.address || "Shopping Complex, near Post Office"}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-foreground">2</span>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">In Queue Ahead</p>
          </div>
        </div>

        {/* Live Token Bar */}
        <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-black">
              <Ticket className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {activeToken ? `Your Live Token: #${activeToken}` : "Current Serving: Token #07"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {activeToken
                  ? "You are next in line! Head over to the salon."
                  : "Estimated wait time: ~10–15 mins"}
              </p>
            </div>
          </div>

          {!activeToken ? (
            <button
              type="button"
              disabled={isBookingToken}
              onClick={() => {
                setIsBookingToken(true);
                sounds.success();
                haptics.medium();
                setTimeout(() => {
                  setIsBookingToken(false);
                  setActiveToken("09");
                }, 600);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-foreground text-background text-xs font-black hover:opacity-90 active:scale-95 transition-[opacity,transform] cursor-pointer shadow-xs shrink-0"
            >
              {isBookingToken ? (
                <span>Generating...</span>
              ) : (
                <>
                  <Ticket className="size-3.5" />
                  <span>Get Live Token #09</span>
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-success text-white text-xs font-black shadow-xs">
              <CheckCircle2 className="size-3.5" />
              <span>Token Confirmed</span>
            </span>
          )}
        </div>
      </div>

      {/* ─── Services & Price List ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-foreground">
            Grooming Menu &amp; Packages ({services.length || 5})
          </h2>
          <span className="text-xs text-muted-foreground font-medium">Student Subsidized Rates</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-3 w-3/4 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="group rounded-2xl border border-border bg-card hover:border-warning hover:shadow-md transition-colors p-4 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-foreground group-hover:text-warning transition-colors truncate">
                      {srv.name}
                    </h4>
                    {srv.isPopular && (
                      <span className="px-1.5 py-0.5 rounded bg-warning-subtle text-warning text-[9px] font-black uppercase shrink-0">
                        Popular
                      </span>
                    )}
                  </div>
                  {srv.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {srv.description}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-base font-black text-foreground">₹{srv.price}</span>
                    {srv.originalPrice && srv.originalPrice > srv.price && (
                      <span className="text-xs text-muted-foreground line-through font-medium">
                        ₹{srv.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.tap();
                    haptics.light();
                    setSelectedService(srv);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-muted/80 hover:bg-warning hover:text-white text-foreground text-xs font-black transition-[opacity,transform] cursor-pointer active:scale-95 shrink-0 shadow-2xs"
                >
                  Book Slot
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Service Booking Confirmation Modal ─── */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-warning">
                  Salon Reservation
                </span>
                <h3 className="text-base font-black text-foreground">{selectedService.name}</h3>
                <p className="text-xs text-muted-foreground font-bold">
                  ₹{selectedService.price} · Pay at salon
                </p>
              </div>
              <div className="size-10 rounded-2xl bg-warning-subtle text-warning flex items-center justify-center font-black">
                <Scissors className="size-5" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Your appointment slot will be confirmed with {primaryBarber?.name || "the campus barber"}.
              Estimated wait: ~10 mins.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.success();
                  haptics.medium();
                  setSelectedService(null);
                  setActiveToken("09");
                  alert(
                    `Slot booked for ${selectedService.name}!\nYour Live Token is #09. Please show this token at the salon counter.`
                  );
                }}
                className="flex-1 py-2.5 rounded-xl bg-warning hover:bg-warning text-white text-xs font-black transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5"
              >
                <Scissors className="size-3.5" />
                <span>Confirm Slot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Campus Onboarding & Expansion Banner (Instagram Highlighted) ─── */}
      <div className="rounded-3xl border border-brand-subtle-border bg-brand-subtle p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand-text text-xs font-bold">
              <Rocket className="size-3" />
              <span>Want this at your campus?</span>
            </div>
            <h4 className="text-sm font-black text-foreground">
              Bring CampusLoop Salon Tokens to Your College
            </h4>
            <p className="text-[11px] text-muted-foreground max-w-md">
              We onboard campus hair stylists, barber shops, and beauty salons with instant token queues.
              Contact us on Instagram!
            </p>
          </div>
          <a
            href="https://www.instagram.com/campusloop.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-brand-fg text-xs font-black shadow-md hover:opacity-95 transition-transform active:scale-95 shrink-0"
          >
            <InstagramIcon className="size-3.5" />
            <span>DM @campusloop.space</span>
          </a>
        </div>
      </div>
    </div>
  );
}
