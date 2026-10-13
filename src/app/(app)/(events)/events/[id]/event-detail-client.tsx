"use client";

import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  Gift,
  GraduationCap,
  HelpCircle,
  MapPin,
  MessageSquareText,
  Palette,
  QrCode,
  Rocket,
  School,
  Settings,
  Share2,
  Trophy,
  Users,
  Wrench,
  Dumbbell,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { useProfile } from "@/hooks/use-profile";
import { BrandedQrModal } from "@/components/common/branded-qr-modal";
import { MarkdownContent } from "@/components/common/markdown-content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/api";
import { type CalendarEvent, downloadAppleCalendarIcs, openGoogleCalendar } from "@/lib/calendar";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";

interface EventDetailClientProps {
  eventId: string;
}

const FAQ_ITEMS = [
  {
    q: "Who is eligible to participate?",
    a: "All verified college students across supported campuses with an active student profile can participate.",
  },
  {
    q: "Is there any registration fee?",
    a: "This event is completely free for verified students unless explicitly marked otherwise on the pass.",
  },
  {
    q: "Can I participate individually or do I need a team?",
    a: "Depends on the event format: solo events are individual, while team hackathons allow squads of 2-4 students. You can register solo and form teams later.",
  },
  {
    q: "When and how will certificates or prizes be awarded?",
    a: "E-certificates will be issued to all verified attendees post-event. Cash prizes and Loop Points (LP) are credited directly to your CampusLoop profile.",
  },
];

function getEventHeroArtwork(eventType: string) {
  const type = String(eventType || "").toUpperCase();
  if (type === "HACKATHON") return { gradient: "from-violet-800 via-indigo-700 to-cyan-500", eyebrow: "BUILD · SHIP · WIN", Icon: Rocket };
  if (["SCHOLARSHIP", "FELLOWSHIP", "GRANT"].includes(type)) return { gradient: "from-amber-600 via-orange-600 to-pink-600", eyebrow: "FUND YOUR FUTURE", Icon: GraduationCap };
  if (["INTERNSHIP", "JOB"].includes(type)) return { gradient: "from-sky-800 via-blue-700 to-indigo-500", eyebrow: "YOUR NEXT CAREER MOVE", Icon: BriefcaseBusiness };
  if (["COMPETITION", "CONTEST"].includes(type)) return { gradient: "from-orange-700 via-rose-600 to-amber-500", eyebrow: "SHOW WHAT YOU CAN DO", Icon: Trophy };
  if (type === "WORKSHOP") return { gradient: "from-cyan-800 via-teal-700 to-emerald-500", eyebrow: "LEARN BY DOING", Icon: Wrench };
  if (type === "SEMINAR") return { gradient: "from-blue-800 via-indigo-700 to-violet-500", eyebrow: "IDEAS & INSIGHTS", Icon: MessageSquareText };
  if (type === "MEETUP") return { gradient: "from-teal-800 via-cyan-700 to-blue-500", eyebrow: "MEET YOUR PEOPLE", Icon: Users };
  if (["FEST", "CULTURAL"].includes(type)) return { gradient: "from-fuchsia-800 via-pink-700 to-rose-500", eyebrow: "CAMPUS CULTURE", Icon: Palette };
  if (type === "SPORTS") return { gradient: "from-lime-800 via-green-700 to-emerald-500", eyebrow: "PLAY TO WIN", Icon: Dumbbell };
  return { gradient: "from-slate-800 via-slate-700 to-indigo-600", eyebrow: "YOUR NEXT OPPORTUNITY", Icon: Sparkles };
}
export function EventDetailClient({ eventId }: EventDetailClientProps) {
  const router = useRouter();
  const { profile } = useProfile();
  const { data, isLoading } = useSWR<{ event: any }>(`/api/events/${eventId}`, fetcher);

  const event = data?.event;
  const [bannerFailed, setBannerFailed] = useState(false);
  useEffect(() => setBannerFailed(false), [event?.bannerUrl]);
  const isOrganizer = Boolean(
    profile && event && (profile.id === event.organizerProfileId || profile.id === event.organizer?.id || profile.role === "ADMIN")
  );

  const [showRegModal, setShowRegModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [regType, setRegType] = useState<"SOLO" | "TEAM">("SOLO");
  const [teamName, setTeamName] = useState("");
  const [teammates, setTeammates] = useState<Array<{ name: string; emailOrRoll: string; role: string }>>([
    { name: "", emailOrRoll: "", role: "Developer / Member" },
  ]);
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingReminder, setIsTogglingReminder] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Live countdown ticker
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch related events
  const { data: relatedData } = useSWR<{ related: any[] }>(
    event ? `/api/events/${eventId}/related` : null,
    fetcher
  );
  const relatedEvents = relatedData?.related || [];

  const countdown = useMemo(() => {
    if (!event || now === 0) return null;
    const startMs = new Date(event.startDate).getTime();
    const endMs = new Date(event.endDate).getTime();
    if (now >= startMs && now <= endMs) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
    }
    const diff = startMs - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false, hasEnded: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, isLive: false, hasEnded: false };
  }, [event, now]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl min-h-screen p-4 border-x border-border/30 space-y-4 animate-pulse">
        <div className="h-8 w-32 bg-muted/40 rounded-full" />
        <div className="h-64 bg-muted/30 rounded-3xl" />
        <div className="h-10 w-3/4 bg-muted/40 rounded-xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-5xl min-h-screen p-8 text-center border-x border-border/30 flex flex-col items-center justify-center space-y-3">
        <Calendar className="size-12 text-muted-foreground" />
        <h2 className="text-lg font-bold">Event Not Found</h2>
        <Button onClick={() => router.push("/events")} variant="outline" className="rounded-full">
          Back to Events Hub
        </Button>
      </div>
    );
  }

  const isRestricted =
    Array.isArray(event.eligibleInstitutionIds) && !event.eligibleInstitutionIds.includes("ALL");

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const startFormatted = startDate.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatted = `${startDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })} – ${endDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;

  const posterUrl = typeof event.bannerUrl === "string" && event.bannerUrl.startsWith("https://") ? event.bannerUrl : null;
  const showPoster = Boolean(posterUrl && !bannerFailed);
  const heroArtwork = getEventHeroArtwork(event.eventType);

  const calendarEvent: CalendarEvent = {
    id: event.id,
    title: event.title,
    description: event.description,
    venue: event.venue,
    mode: event.mode,
    startDate: event.startDate,
    endDate: event.endDate,
    slug: event.slug,
    clubName: event.clubName,
  };

  async function handleToggleReminder() {
    if (isTogglingReminder) return;
    setIsTogglingReminder(true);
    haptics.light();

    try {
      const res = await fetch(`/api/events/${event.id}/reminder`, {
        method: "POST",
      });
      const resData = (await res.json()) as Record<string, any>;
      if (!res.ok) throw new Error(resData.error);

      if (resData.reminderSet) {
        toast.success("Timing reminder set! You'll be notified before the event ⏰");
      } else {
        toast.info("Timing reminder removed");
      }
      mutate(`/api/events/${eventId}`);
    } catch {
      toast.error("Failed to toggle reminder");
    } finally {
      setIsTogglingReminder(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    if (regType === "TEAM") {
      if (!teamName.trim()) {
        toast.error("Please enter your team name");
        return;
      }
      const validTeammates = teammates.filter((t) => t.name.trim());
      const totalSize = 1 + validTeammates.length;
      const min = event.minTeamSize || 1;
      const max = event.maxTeamSize || 4;

      if (totalSize < min) {
        toast.error(`Team must have at least ${min} members (including you as leader).`);
        return;
      }
      if (totalSize > max) {
        toast.error(`Team cannot exceed ${max} members.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const validTeammates = teammates.filter((t) => t.name.trim());
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationType: regType,
          teamName: regType === "TEAM" ? teamName.trim() : null,
          teamMembers: regType === "TEAM" ? validTeammates : [],
          contactPhone,
        }),
      });

      const resData = (await res.json()) as Record<string, any>;
      if (!res.ok) {
        throw new Error(resData.error || "Failed to register");
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      sounds.pop();
      haptics.medium();
      setShowRegModal(false);
      toast.success("Registration Confirmed! +25 Loop Points added to your clout.");
      mutate(`/api/events/${eventId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleShare() {
    haptics.light();
    setShowQrModal(true);
  }

  return (
    <div className="mx-auto max-w-5xl min-h-screen pb-28 border-x border-border/30 bg-background">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/30 px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {isOrganizer && (
            <Link
              href={`/events/manage/${event.slug || event.id}`}
              className="h-8 px-3 rounded-full text-xs font-bold gap-1.5 flex items-center bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-xs"
            >
              <Settings className="size-3.5" />
              <span>Manage</span>
            </Link>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="h-8 px-2.5 sm:px-3 rounded-full text-xs font-bold gap-1.5 cursor-pointer"
          >
            <Share2 className="size-3.5" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Event Hero Banner with Scrim & Tags */}
      <div className={cn("relative aspect-[16/9] sm:aspect-[24/9] md:aspect-[3/1] w-full overflow-hidden", showPoster ? "bg-muted/40" : "bg-gradient-to-br " + heroArtwork.gradient)}>
        {showPoster ? (
          <img src={posterUrl!} alt={event.title + " poster"} className="absolute inset-0 h-full w-full object-cover" loading="eager" decoding="async" referrerPolicy="no-referrer" onError={() => setBannerFailed(true)} />
        ) : (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 size-64 rounded-full border border-white/20 bg-white/10 blur-xl sm:size-80" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-black/10 blur-2xl" />
            <div className="absolute inset-0 flex items-start justify-between gap-4 px-4 py-4 sm:px-8 sm:py-6 md:px-10">
              <span className="relative z-10 inline-flex max-w-[75%] rounded-full border border-white/20 bg-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm sm:text-xs">
                {heroArtwork.eyebrow}
              </span>
              <heroArtwork.Icon className="relative z-10 mt-8 size-16 shrink-0 text-white/25 drop-shadow sm:mt-10 sm:size-28 md:size-36" strokeWidth={1.1} />
            </div>
          </>
        )}
        <div className={cn("absolute inset-0", showPoster ? "bg-gradient-to-t from-black/85 via-black/25 to-transparent" : "bg-gradient-to-t from-black/30 via-transparent to-black/5")} />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3 pb-3 pt-10 text-white sm:px-4 sm:pb-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md sm:text-xs">
                {event.eventType}
              </span>
              <span className="rounded-full border border-white/15 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase text-white backdrop-blur-md sm:text-xs">
                {event.mode}
              </span>
              {countdown?.isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase text-white sm:text-xs">
                  <span className="inline-block size-1.5 animate-ping rounded-full bg-white" />
                  Live Now
                </span>
              )}
            </div>
            <p className="max-w-full truncate text-[11px] font-semibold uppercase tracking-wide text-white/85 sm:text-sm">
              {event.clubName}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md sm:text-xs">
            {event.entryFee || "Free"}
          </span>
        </div>
      </div>

      <div className="p-3.5 sm:p-5 md:p-6 space-y-5 sm:space-y-6">
        {/* Title, Tagline & Live Countdown Widget */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight">
              {event.title}
            </h1>
            {event.tagline && (
              <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                {event.tagline}
              </p>
            )}
          </div>

          {/* Countdown Ticker */}
          {countdown && !countdown.hasEnded && !countdown.isLive && (
            <div className="flex items-center justify-between p-3 rounded-2xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Clock className="size-4 text-primary shrink-0" />
                <span>{countdown.isLive ? "Event is underway!" : "Event begins in:"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-black text-primary">
                {countdown.isLive ? (
                  <span className="text-red-500 animate-pulse">IN PROGRESS</span>
                ) : (
                  <>
                    {countdown.days > 0 && <span>{countdown.days}d</span>}
                    <span>{String(countdown.hours).padStart(2, "0")}h</span>
                    <span>:</span>
                    <span>{String(countdown.minutes).padStart(2, "0")}m</span>
                    <span>:</span>
                    <span>{String(countdown.seconds).padStart(2, "0")}s</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Digital Pass / Ticket Card (Luma-Style) ─── */}
        {event.isRegistered ? (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-linear-to-br from-emerald-500/10 via-card to-card p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-black uppercase text-emerald-500 tracking-wider">
                  Confirmed Student Pass
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                PASS #{event.id.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-base font-black text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {startFormatted} · {event.venue || event.mode}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500 text-white text-xs font-black hover:opacity-90 shadow-xs cursor-pointer"
                >
                  <QrCode className="size-3.5" />
                  <span>Show Pass QR</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Action Panel: Register & Reminders */
          <div className="p-4 sm:p-5 rounded-3xl border border-border/40 bg-card/60 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-foreground">Ready to participate?</span>
                  <span className="text-xs font-bold text-primary">
                    +{event.loopPointsReward || 25} LP Reward
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.attendeeCount || 0} students enrolled from Indian universities
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                {event.meetingUrl && event.meetingUrl.startsWith("http") && (
                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-5 rounded-full font-black text-xs bg-primary text-primary-foreground hover:opacity-90 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Apply on Official Portal</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                )}

                <Button
                  onClick={() => {
                    haptics.medium();
                    setShowRegModal(true);
                  }}
                  variant={event.meetingUrl && event.meetingUrl.startsWith("http") ? "outline" : "default"}
                  className={cn(
                    "h-10 px-5 rounded-full font-black text-xs cursor-pointer flex-1 sm:flex-initial justify-center",
                    !(event.meetingUrl && event.meetingUrl.startsWith("http"))
                      ? "bg-primary text-primary-foreground hover:opacity-90 shadow-md"
                      : ""
                  )}
                >
                  {event.meetingUrl && event.meetingUrl.startsWith("http")
                    ? "Get CampusLoop Pass"
                    : "Register Now"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleReminder}
                  disabled={isTogglingReminder}
                  className={`h-10 px-3.5 rounded-full text-xs font-bold gap-1.5 cursor-pointer shrink-0 ${
                    event.reminderSet
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Toggle Event Reminder"
                >
                  {event.reminderSet ? (
                    <>
                      <Bell className="size-4 fill-primary text-primary" />
                      <span className="hidden sm:inline">Reminder Set</span>
                    </>
                  ) : (
                    <>
                      <Bell className="size-4" />
                      <span className="hidden sm:inline">Remind Me</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Calendar Quick Add */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-border/30 text-xs">
              <span className="text-muted-foreground font-bold flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                <span>Add to calendar:</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openGoogleCalendar(calendarEvent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-muted/30 hover:bg-muted/70 text-foreground text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span>Google Calendar</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadAppleCalendarIcs(calendarEvent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-muted/30 hover:bg-muted/70 text-foreground text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span>Apple Calendar (.ics)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Date, Time, Venue, Eligibility Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl border border-border/40 bg-card/60 flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="size-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                Date & Timing
              </h4>
              <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5 leading-snug">
                {startFormatted}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium leading-snug">{timeFormatted}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-border/40 bg-card/60 flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPin className="size-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                Venue / Location
              </h4>
              <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5 truncate">
                {event.venue || event.mode}
              </p>
              {event.meetingUrl && (
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-0.5"
                >
                  <span>Join Online Stream</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-border/40 bg-card/60 flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <School className="size-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                Campus Eligibility
              </h4>
              <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                {isRestricted ? "Restricted Campuses" : "Open to All Verified Indian Students"}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                {isRestricted ? "Limited to selected student hubs" : "Valid across all colleges"}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-border/40 bg-card/60 flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                Participation Type
              </h4>
              <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                {event.participationType === "BOTH"
                  ? "Solo or Teams"
                  : event.participationType === "TEAM"
                    ? `Teams of ${event.minTeamSize}-${event.maxTeamSize}`
                    : "Individual · Solo"}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                {event.maxParticipants ? `${event.maxParticipants} spots limit` : "Unlimited enrollment"}
              </p>
            </div>
          </div>
        </div>

        {/* Prizes & Perks */}
        {(event.prizesDescription || (event.perks && event.perks.length > 0)) && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" />
              Prizes &amp; Participant Perks
            </h3>

            {event.prizesDescription && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Prize pool</span>
                <p className="text-base sm:text-lg font-black leading-snug">{event.prizesDescription}</p>
              </div>
            )}

            {event.perks && event.perks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.perks.map((perk: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted/40 border border-border/60 text-foreground"
                  >
                    <Gift className="size-3 text-primary" />
                    <span>{perk}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* About the Event */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">About the Event</h3>
          <div className="rounded-3xl border border-border/40 bg-card/60 p-4 sm:p-5 text-sm leading-relaxed text-foreground/90">
            <MarkdownContent content={event.description} />
          </div>
        </div>

        {/* Organizer Club Profile Card */}
        {event.organizer && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Hosted By</h3>
            <div className="flex items-center justify-between p-4 rounded-3xl border border-border/40 bg-card/60">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 border border-border/50">
                  <AvatarImage src={getAvatarUrl(event.organizer.avatarUrl, event.organizer.username)} />
                  <AvatarFallback className="font-bold">
                    {event.organizer.displayName?.[0] || "O"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-foreground">{event.organizer.displayName}</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                      Host
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    @{event.organizer.username} · {event.clubName}
                  </p>
                </div>
              </div>

              <Link
                href={`/@${event.organizer.username}`}
                className="px-3.5 py-1.5 rounded-full border border-border/60 text-xs font-bold text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                View Profile
              </Link>
            </div>
          </div>
        )}

        {/* Registered Attendees */}
        {event.registrations && event.registrations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Attending Students ({event.registrations.length})
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {event.registrations.slice(0, 18).map((r: any) => {
                const avatar = getAvatarUrl(r.profile?.avatarUrl, r.profile?.username);
                return (
                  <Link
                    key={r.id}
                    href={`/@${r.profile?.username}`}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-border/40 bg-card/60 hover:bg-muted/40 transition-all text-xs"
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={avatar} />
                      <AvatarFallback className="text-[10px]">
                        {r.profile?.displayName?.[0] || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-foreground">@{r.profile?.username}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Campus FAQ Accordion */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="size-4 text-primary" />
            Frequently Asked Questions
          </h3>

          <div className="space-y-2">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left text-xs sm:text-sm font-bold text-foreground cursor-pointer hover:bg-muted/20"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200 shrink-0",
                      expandedFaq === idx ? "rotate-180" : ""
                    )}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/20 pt-2.5">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Similar Campus Events ─── */}
        {relatedEvents.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-border/30">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black tracking-wider uppercase text-foreground flex items-center gap-1.5">
                <Zap className="size-4 text-primary" />
                <span>Similar Campus Events</span>
              </h2>
              <Link href="/events" className="text-xs font-bold text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedEvents.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/events/${rel.slug || rel.id}`}
                  className="group block p-3.5 rounded-2xl border border-border/40 bg-card/60 hover:bg-card/90 hover:border-primary/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-semibold">
                    <span className="truncate">{rel.clubName}</span>
                    <span className="text-primary font-black uppercase text-[10px]">{rel.mode}</span>
                  </div>

                  <h3 className="text-xs font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {rel.title}
                  </h3>

                  {rel.prizesDescription && (
                    <p className="text-[11px] font-bold text-amber-500 line-clamp-1 flex items-center gap-1">
                      <Trophy className="size-2.5 shrink-0" />
                      <span>{rel.prizesDescription}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[11px] text-muted-foreground">
                    <span>
                      {new Date(rel.startDate).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="font-bold text-foreground">{rel.entryFee || "Free"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <Dialog open={showRegModal} onOpenChange={setShowRegModal}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Register for {event.title}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-2">
            {event.participationType === "BOTH" && (
              <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-2xl border border-border/40">
                <button
                  type="button"
                  onClick={() => setRegType("SOLO")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    regType === "SOLO"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Solo (Individual)
                </button>
                <button
                  type="button"
                  onClick={() => setRegType("TEAM")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    regType === "TEAM"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Team
                </button>
              </div>
            )}

            {regType === "TEAM" && (
              <div className="space-y-3 rounded-2xl border border-border/40 bg-muted/20 p-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Team Name *</label>
                    <span className="text-[10px] text-muted-foreground">
                      Size: {1 + teammates.filter((t) => t.name.trim()).length} / {event.maxTeamSize || 4}{" "}
                      members
                    </span>
                  </div>
                  <Input
                    required
                    placeholder="e.g. CodeMonks Mesra"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="mt-1 rounded-xl text-xs bg-background"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground flex items-center gap-1">
                      <Users className="size-3.5 text-primary" />
                      Teammates ({teammates.length})
                    </span>
                    {teammates.length + 1 < (event.maxTeamSize || 4) && (
                      <button
                        type="button"
                        onClick={() =>
                          setTeammates((prev) => [...prev, { name: "", emailOrRoll: "", role: "Member" }])
                        }
                        className="text-[11px] font-black text-primary hover:underline cursor-pointer"
                      >
                        + Add Member
                      </button>
                    )}
                  </div>

                  {teammates.map((tm, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-border/30 bg-background/80 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Member #{idx + 2}
                        </span>
                        {teammates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTeammates((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-600 text-[10px] font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Full Name *"
                          value={tm.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTeammates((prev) => prev.map((m, i) => (i === idx ? { ...m, name: val } : m)));
                          }}
                          className="h-8 rounded-lg text-xs"
                        />
                        <Input
                          placeholder="College Email or Roll No"
                          value={tm.emailOrRoll}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTeammates((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, emailOrRoll: val } : m))
                            );
                          }}
                          className="h-8 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-muted-foreground">
                WhatsApp / Contact Number (For updates)
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-full font-black text-xs bg-primary text-primary-foreground hover:opacity-90 shadow-md cursor-pointer"
              >
                {isSubmitting ? "Confirming..." : "Confirm Registration (+25 LP)"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cute Branded QR Code Modal */}
      <BrandedQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={event.title}
        subtitle={`${event.clubName} • ${event.venue || event.mode}`}
        badgeText="Campus Event"
        shortUrl={`https://campusloop.space/e/${event.slug || event.id}`}
        category="event"
      />
    </div>
  );
}
