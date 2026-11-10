"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ActiveCallOverlay } from "@/components/calls/active-call-overlay";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { RANDOM_LOOP_STARTERS } from "@/lib/random-loop-safety";
import { sounds } from "@/lib/sounds";
import { RandomChatView } from "./random-chat-view";
import { ChatOptionsDialog, ReportDialog, SafetyDialog, VideoConsentDialog } from "./random-dialogs";
import { MAX_INTERESTS, type RandomMode, RandomSetupView } from "./random-setup-view";
import { RandomEndedView, RandomSearchingView } from "./random-status-views";

interface RandomLoopClientProps {
  currentProfile: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    institutionId: string;
    year: string | null;
    branch: string | null;
  };
}

type ViewState = "CONFIGURING" | "QUEUED" | "ACTIVE" | "ENDED";

async function postAction(sessionId: string, body: Record<string, unknown>) {
  return fetch(`/api/random/session/${sessionId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function RandomLoopClient({ currentProfile }: RandomLoopClientProps) {
  const router = useRouter();

  const [viewState, setViewState] = useState<ViewState>("CONFIGURING");
  const [mode, setMode] = useState<RandomMode>("MY_CAMPUS");
  const [interests, setInterests] = useState<string[]>(["fun"]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [starterIndex, setStarterIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("HARASSMENT");
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [rating, setRating] = useState<string | null>(null);

  const [isVideoActive, setIsVideoActive] = useState(false);
  const [showVideoConsent, setShowVideoConsent] = useState(false);
  // "Not now" on a video request: don't ask again for this session
  const [videoDeclined, setVideoDeclined] = useState(false);

  const { data: sessionData, mutate: mutateSession } = useSWR<{
    session: any;
    partner: any;
    messages: any[];
  }>(activeSessionId ? `/api/random/session/${activeSessionId}` : null, fetcher, {
    refreshInterval: 2500, // Often enough for chat, light on mobile data
  });

  const session = sessionData?.session;
  const partner = sessionData?.partner;
  const messages = sessionData?.messages || [];

  // The other person left or the session closed
  useEffect(() => {
    if (session?.status && session.status !== "ACTIVE" && viewState === "ACTIVE") {
      setViewState("ENDED");
      setIsVideoActive(false);
    }
  }, [session?.status, viewState]);

  // Video starts only when both people said yes
  useEffect(() => {
    if (session?.isBothVideoAccepted && !isVideoActive) {
      sounds.ting();
      toast.success("You both said yes. Starting video…");
      setIsVideoActive(true);
      setShowVideoConsent(false);
    } else if (
      session?.partnerVideoRequested &&
      !session?.myVideoRequested &&
      !showVideoConsent &&
      !videoDeclined &&
      !isVideoActive
    ) {
      sounds.pop();
      setShowVideoConsent(true);
    }
  }, [
    session?.isBothVideoAccepted,
    session?.partnerVideoRequested,
    session?.myVideoRequested,
    showVideoConsent,
    videoDeclined,
    isVideoActive,
  ]);

  // Poll the queue while waiting for a match
  useEffect(() => {
    if (viewState !== "QUEUED") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/random/queue");
        const data = (await res.json()) as any;
        if (data.status === "MATCHED" && data.sessionId) {
          sounds.ting();
          haptics.success();
          setActiveSessionId(data.sessionId);
          setViewState("ACTIVE");
        }
      } catch {
        // Try again on the next tick
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [viewState]);

  function toggleInterest(id: string) {
    sounds.tap();
    haptics.light();
    if (interests.includes(id)) {
      setInterests(interests.filter((i) => i !== id));
    } else if (interests.length >= MAX_INTERESTS) {
      toast.info(`Pick up to ${MAX_INTERESTS} topics.`);
    } else {
      setInterests([...interests, id]);
    }
  }

  function resetSession() {
    setActiveSessionId(null);
    setShowOptions(false);
    setRating(null);
    setInputText("");
    setIsVideoActive(false);
    setShowVideoConsent(false);
    setVideoDeclined(false);
  }

  async function findSomeone() {
    sounds.pop();
    haptics.medium();
    resetSession();
    setViewState("QUEUED");

    try {
      const res = await fetch("/api/random/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          interests,
          year: currentProfile.year,
          department: currentProfile.branch,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || data.error) throw new Error(data.error || "Couldn't start searching. Try again.");
      if (data.status === "MATCHED" && data.sessionId) {
        sounds.ting();
        haptics.success();
        setActiveSessionId(data.sessionId);
        setViewState("ACTIVE");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start searching. Try again.");
      setViewState("CONFIGURING");
    }
  }

  async function cancelQueue() {
    sounds.tap();
    await fetch("/api/random/queue", { method: "DELETE" }).catch(() => {});
    setViewState("CONFIGURING");
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!inputText.trim() || !activeSessionId || isSending) return;

    sounds.send();
    haptics.light();
    setIsSending(true);
    try {
      const res = await fetch(`/api/random/session/${activeSessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        if (data.piiDetected) {
          haptics.heavy();
          toast.warning(data.error || "Remove phone numbers, emails or handles, then send again.");
        } else {
          toast.error(data.error || "Couldn't send. Try again.");
        }
        return;
      }
      setInputText("");
      mutateSession();
    } catch {
      toast.error("Couldn't send. Check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  }

  async function nextPerson() {
    if (activeSessionId) await postAction(activeSessionId, { action: "NEXT" }).catch(() => {});
    findSomeone();
  }

  async function leaveChat() {
    sounds.tap();
    if (activeSessionId) await postAction(activeSessionId, { action: "LEAVE" }).catch(() => {});
    resetSession();
    setViewState("CONFIGURING");
  }

  async function requestVideo() {
    sounds.tap();
    haptics.medium();
    if (!activeSessionId) return;
    try {
      const res = await fetch(`/api/random/session/${activeSessionId}/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as any;
      mutateSession();
      if (data.isBothVideoAccepted) {
        sounds.ting();
        haptics.success();
        setIsVideoActive(true);
        setShowVideoConsent(false);
      } else {
        setShowVideoConsent(false);
        toast.info("Asked for video. It starts if they say yes.");
      }
    } catch {
      toast.error("Couldn't ask for video. Try again.");
    }
  }

  async function requestReveal() {
    sounds.tap();
    haptics.medium();
    if (!activeSessionId) return;
    try {
      const res = await fetch(`/api/random/session/${activeSessionId}/reveal`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as any;
      mutateSession();
      if (data.isBothRevealed) {
        sounds.ting();
        haptics.success();
        toast.success("You can both see each other's names now.");
      } else {
        toast.info("Your name shows only if they choose to show theirs too.");
      }
    } catch {
      toast.error("Couldn't send that. Try again.");
    }
  }

  async function keepTalking() {
    sounds.tap();
    haptics.medium();
    if (!activeSessionId) return;
    try {
      const res = await fetch(`/api/random/session/${activeSessionId}/continue`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as any;
      mutateSession();
      if (data.bothContinued && data.conversationId) {
        sounds.ting();
        haptics.success();
        toast.success("Moved to your chats.");
        router.push("/chat");
      } else {
        toast.info("Saved. It moves to Chat if they tap it too.");
      }
    } catch {
      toast.error("Couldn't save this chat. Try again.");
    }
  }

  async function submitReport() {
    if (!activeSessionId) return;
    setIsReporting(true);
    try {
      const res = await postAction(activeSessionId, { action: "REPORT", reason: reportReason });
      if (!res.ok) throw new Error();
      toast.success("Report sent. You've left the chat.");
      setShowReport(false);
      resetSession();
      setViewState("CONFIGURING");
    } catch {
      toast.error("Couldn't send the report. Try again.");
    } finally {
      setIsReporting(false);
    }
  }

  async function blockPartner() {
    if (!activeSessionId) return;
    setIsBlocking(true);
    try {
      const res = await postAction(activeSessionId, { action: "BLOCK" });
      if (!res.ok) throw new Error();
      toast.success("Blocked. You won't be matched again.");
      findSomeone();
    } catch {
      toast.error("Couldn't block. Try again, or leave the chat.");
    } finally {
      setIsBlocking(false);
    }
  }

  async function rateChat(value: string) {
    setRating(value);
    sounds.tap();
    haptics.light();
    if (activeSessionId) await postAction(activeSessionId, { action: "RATE", rating: value }).catch(() => {});
  }

  const safety = <SafetyDialog open={showSafety} onOpenChange={setShowSafety} />;

  if (viewState === "CONFIGURING") {
    return (
      <>
        <RandomSetupView
          mode={mode}
          onModeChange={(m) => {
            sounds.tap();
            setMode(m);
          }}
          interests={interests}
          onToggleInterest={toggleInterest}
          onFind={findSomeone}
          onShowSafety={() => setShowSafety(true)}
        />
        {safety}
      </>
    );
  }

  if (viewState === "QUEUED") return <RandomSearchingView onCancel={cancelQueue} />;

  if (viewState === "ENDED") {
    return (
      <RandomEndedView
        rating={rating}
        onRate={rateChat}
        onFindNext={findSomeone}
        onDone={() => {
          resetSession();
          setViewState("CONFIGURING");
        }}
      />
    );
  }

  return (
    <>
      <RandomChatView
        session={session}
        partner={partner}
        messages={messages}
        starter={RANDOM_LOOP_STARTERS[starterIndex % RANDOM_LOOP_STARTERS.length]}
        onShuffleStarter={() => {
          sounds.pop();
          setStarterIndex((i) => i + 1);
        }}
        inputText={inputText}
        onInputChange={setInputText}
        onSend={sendMessage}
        isSending={isSending}
        onLeave={leaveChat}
        onNext={nextPerson}
        onVideo={requestVideo}
        onReveal={requestReveal}
        onKeepTalking={keepTalking}
        onShowSafety={() => setShowSafety(true)}
        onShowOptions={() => setShowOptions(true)}
      />

      {safety}
      <ChatOptionsDialog
        open={showOptions}
        onOpenChange={setShowOptions}
        onReport={() => {
          setShowOptions(false);
          setShowReport(true);
        }}
        onBlock={blockPartner}
        blocking={isBlocking}
      />
      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        reason={reportReason}
        onReasonChange={setReportReason}
        onSubmit={submitReport}
        submitting={isReporting}
      />
      <VideoConsentDialog
        open={showVideoConsent}
        onOpenChange={(open) => {
          setShowVideoConsent(open);
          if (!open) setVideoDeclined(true);
        }}
        partnerName={partner?.displayName || "They"}
        onAccept={requestVideo}
      />

      {isVideoActive && partner && activeSessionId && (
        <ActiveCallOverlay
          callId={activeSessionId}
          isCaller={session?.myVideoRequested || false}
          type="video"
          partner={{
            id: partner.id,
            displayName: partner.displayName,
            avatarUrl: partner.avatarUrl,
            username: partner.username,
          }}
          remotePeerId={session?.partnerPeerId}
          onCallEnded={() => setIsVideoActive(false)}
        />
      )}
    </>
  );
}
