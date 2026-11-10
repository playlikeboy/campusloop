"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

export type CallType = "audio" | "video";

export interface CallPartner {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  username?: string;
}

export interface ActiveCall {
  callId: string;
  isCaller: boolean;
  type: CallType;
  remotePeerId?: string;
  /** Who the call is with, fixed when it starts so switching chats mid-call keeps the right name. */
  partner: CallPartner;
}

export interface IncomingCall {
  callId: string;
  status: string;
  type: CallType;
  callerPeerId?: string;
  caller: CallPartner;
}

/** Polls for incoming calls and starts outgoing ones for a 1:1 chat. */
export function useChatCalls({
  currentUserId,
  conversationId,
  receiverId,
}: {
  currentUserId: string;
  conversationId: string | null;
  /** Null for groups: calls are 1:1 only. */
  receiverId: string | null;
}) {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (!currentUserId || activeCall) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/calls");
        if (!res.ok) return;
        const data = (await res.json()) as { incomingCall?: IncomingCall | null };
        setIncomingCall(data?.incomingCall?.status === "CALLING" ? data.incomingCall : null);
      } catch {
        // Offline: try again on the next tick.
      }
    }, 2800);
    return () => clearInterval(interval);
  }, [currentUserId, activeCall]);

  const startCall = useCallback(
    async (type: CallType, partner: CallPartner) => {
      if (!conversationId || !receiverId) return;
      sounds.tap();
      haptics.medium();
      try {
        const res = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId, conversationId, type, context: "chat" }),
        });
        const data = (await res.json()) as { call?: { id: string }; error?: string };
        if (!res.ok || !data.call) {
          toast.error(data.error || "Couldn't start the call. Try again in a moment.");
          return;
        }
        setActiveCall({ callId: data.call.id, isCaller: true, type, partner });
      } catch {
        toast.error("Couldn't start the call. Check your connection and try again.");
      }
    },
    [conversationId, receiverId]
  );

  const acceptIncoming = useCallback(() => {
    if (!incomingCall) return;
    setActiveCall({
      callId: incomingCall.callId,
      isCaller: false,
      type: incomingCall.type,
      remotePeerId: incomingCall.callerPeerId,
      partner: incomingCall.caller,
    });
    setIncomingCall(null);
  }, [incomingCall]);

  const declineIncoming = useCallback(async () => {
    if (!incomingCall) return;
    const { callId } = incomingCall;
    setIncomingCall(null);
    try {
      await fetch(`/api/calls/${callId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DECLINE" }),
      });
    } catch {
      // The caller's side times out on its own.
    }
  }, [incomingCall]);

  const endActiveCall = useCallback(() => setActiveCall(null), []);

  return { activeCall, incomingCall, startCall, acceptIncoming, declineIncoming, endActiveCall };
}
