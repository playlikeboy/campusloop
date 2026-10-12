"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import { MarkdownEditor } from "@/components/common/markdown-editor";
import { fetcher } from "@/lib/api";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface EditEventClientProps {
  eventId: string;
  initialSlug: string;
}

export function EditEventClient({ eventId, initialSlug }: EditEventClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [clubName, setClubName] = useState("");
  const [eventType, setEventType] = useState("HACKATHON");
  const [mode, setMode] = useState("OFFLINE");
  const [venue, setVenue] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [prizesDescription, setPrizesDescription] = useState("");
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT" | "COMPLETED" | "CANCELLED">("PUBLISHED");
  const [visibility, setVisibility] = useState<"PUBLIC" | "UNLISTED" | "PRIVATE">("PUBLIC");

  const { data, error, isLoading } = useSWR<{
    event: {
      id: string;
      slug: string;
      title: string;
      tagline: string | null;
      description: string | null;
      bannerUrl: string | null;
      clubName: string;
      eventType: string;
      mode: string;
      venue: string | null;
      meetingUrl: string | null;
      startDate: string;
      endDate: string;
      registrationDeadline: string | null;
      maxParticipants: number | null;
      prizesDescription: string | null;
      status: "PUBLISHED" | "DRAFT" | "COMPLETED" | "CANCELLED";
      visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
    };
  }>(`/api/events/${eventId}`, fetcher);

  // Helper to format ISO to datetime-local string
  const toLocalDatetime = (isoStr?: string | null) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (data?.event) {
      const ev = data.event;
      setTitle(ev.title || "");
      setTagline(ev.tagline || "");
      setDescription(ev.description || "");
      setBannerUrl(ev.bannerUrl || "");
      setClubName(ev.clubName || "");
      setEventType(ev.eventType || "HACKATHON");
      setMode(ev.mode || "OFFLINE");
      setVenue(ev.venue || "");
      setMeetingUrl(ev.meetingUrl || "");
      setStartDate(toLocalDatetime(ev.startDate));
      setEndDate(toLocalDatetime(ev.endDate));
      setRegistrationDeadline(toLocalDatetime(ev.registrationDeadline));
      setMaxParticipants(ev.maxParticipants ? String(ev.maxParticipants) : "");
      setPrizesDescription(ev.prizesDescription || "");
      setStatus(ev.status || "PUBLISHED");
      setVisibility(ev.visibility || "PUBLIC");
    }
  }, [data]);

  const slug = data?.event?.slug || initialSlug;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadImageToImgBB(file);
      setBannerUrl(uploaded.url);
      toast.success("Banner image uploaded successfully");
    } catch {
      toast.error("Failed to upload image. You can also paste an image URL directly.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Event title cannot be empty");
      return;
    }
    if (!startDate) {
      toast.error("Start date and time are required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          bannerUrl: bannerUrl.trim() || null,
          clubName: clubName.trim() || "Campus Club",
          eventType,
          mode,
          venue: venue.trim() || null,
          meetingUrl: meetingUrl.trim() || null,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
          registrationDeadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
          prizesDescription: prizesDescription.trim() || null,
          status,
          visibility,
        }),
      });

      if (!res.ok) {
        const errorData = ((await res.json().catch(() => ({}))) || {}) as { error?: string };
        throw new Error(errorData.error || "Failed to update event");
      }

      toast.success("Event details saved successfully!");
      router.push(`/events/manage/${slug}`);
    } catch (err: any) {
      toast.error(err.message || "Could not save event changes");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 space-y-6">
        <div className="h-6 w-32 bg-card/60 rounded animate-pulse" />
        <div className="h-96 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-6 space-y-6">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between pb-4 border-b border-border/30">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/events/manage/${slug}`}
            className="p-2 rounded-xl border border-border/40 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Event Editor
            </span>
            <h1 className="text-xl font-black text-foreground truncate">{title || "Edit Event"}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/events/${slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-foreground text-xs font-bold transition-colors"
          >
            <Eye className="size-3.5 text-muted-foreground" />
            <span>Preview</span>
          </Link>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Card 1: Essential Info ─── */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border/40 bg-card/50 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Core Event Information</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Event Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HackCampus 2026, Annual Tech Fest"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border/50 bg-background text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Tagline / One-Liner</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. 36 hours of non-stop code, caffeine & high-stakes builds"
              className="w-full px-3.5 py-2 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Club / Organizing Entity</label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g. Google Developer Student Club"
                className="w-full px-3.5 py-2 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Event Category</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                <option value="HACKATHON">Hackathon</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="FEST">College Fest</option>
                <option value="COMPETITION">Competition</option>
                <option value="SEMINAR">Seminar / Talk</option>
                <option value="GAMING">Gaming Tournament</option>
                <option value="CULTURAL">Cultural Event</option>
                <option value="MEETUP">Meetup</option>
              </select>
            </div>
          </div>

          {/* Banner Upload / URL */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            <label className="text-xs font-bold text-foreground">Banner Image</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="Paste banner image URL (or upload below)"
                className="flex-1 w-full px-3.5 py-2 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-xs font-bold text-foreground cursor-pointer transition-colors shrink-0">
                {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            {bannerUrl && (
              <img
                src={bannerUrl}
                alt=""
                className="h-32 w-full object-cover rounded-xl border border-border/40 mt-2"
              />
            )}
          </div>
        </div>

        {/* ─── Card 2: Schedule & Venue ─── */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border/40 bg-card/50 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Schedule & Mode</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode("OFFLINE")}
              className={cn(
                "p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer",
                mode === "OFFLINE"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/40 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              In-Person / Offline
            </button>
            <button
              type="button"
              onClick={() => setMode("ONLINE")}
              className={cn(
                "p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer",
                mode === "ONLINE"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/40 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              Virtual / Online
            </button>
            <button
              type="button"
              onClick={() => setMode("HYBRID")}
              className={cn(
                "p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer",
                mode === "HYBRID"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/40 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              Hybrid
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Physical Venue / Room</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. CS Seminar Hall, Block C"
                className="w-full px-3.5 py-2 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Online Link (Google Meet / Zoom)</label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3.5 py-2 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/30">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Start Date & Time <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">End Date & Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Registration Deadline</label>
              <input
                type="datetime-local"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* ─── Card 3: Capacity, Prizes & Description ─── */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border/40 bg-card/50 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Registration Rules & Prizes</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Max Attendee Capacity</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="w-full px-3.5 py-2 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Prizes & Cash Rewards</label>
              <input
                type="text"
                value={prizesDescription}
                onChange={(e) => setPrizesDescription(e.target.value)}
                placeholder="e.g. ₹50,000 Pool + Certificates + Swag"
                className="w-full px-3.5 py-2 rounded-xl border border-border/50 bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Detailed Description (Markdown)</label>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe rounds, themes, submission rules, schedule..."
              rows={7}
            />
          </div>
        </div>

        {/* ─── Card 4: Publication & Privacy ─── */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border/40 bg-card/50 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Status & Discovery</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Publication Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                <option value="PUBLISHED">Published / Live</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Campus Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                <option value="PUBLIC">Public (All Colleges Across India)</option>
                <option value="PRIVATE">Private (Only Host Campus Students)</option>
                <option value="UNLISTED">Unlisted (Direct Link Only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Submit Bar ─── */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link
            href={`/events/manage/${slug}`}
            className="px-4 py-2 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
