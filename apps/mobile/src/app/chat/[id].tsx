import Feather from "@expo/vector-icons/Feather";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState, ErrorState, Field, LoadingState } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useSession } from "@/lib/session";
import { space, type, useTheme } from "@/lib/theme";
import type { Message } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";
import { useRequest } from "@/lib/use-request";

export default function ChatThread() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { me } = useSession();
  const req = useRequest(() => api<Message[]>(`/api/chat/${id}/messages?limit=50`), [id]);
  usePolling(req.poll, 5000);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setSendError(null);
    try {
      const msg = await api<Message>(`/api/chat/${id}/messages`, { method: "POST", body: { body } });
      req.setData((prev) => [...(prev ?? []).filter((m) => m.id !== msg.id), msg]);
      setDraft("");
    } catch (e) {
      setSendError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  // Newest at the bottom: render reversed in an inverted list.
  const messages = [...(req.data ?? [])].reverse();

  let body;
  if (req.loading) body = <LoadingState />;
  else if (req.error && !req.data) body = <ErrorState message={req.error} onRetry={req.reload} />;
  else if (messages.length === 0) body = <EmptyState icon="message-circle" title="No messages yet" body="Say hi." />;
  else
    body = (
      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        renderItem={({ item }) => {
          const mine = item.senderId === me?.id;
          return (
            <View style={[styles.bubble, mine ? { alignSelf: "flex-end", backgroundColor: t.action } : { alignSelf: "flex-start", backgroundColor: t.muted }]}>
              <Text style={[type.body, { color: mine ? t.actionText : t.ink }]}>{item.body}</Text>
              <Text style={[type.caption, { color: mine ? t.mist : t.inkSubtle, alignSelf: "flex-end", fontWeight: "500" }]}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
          );
        }}
      />
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: title || "Chat" }} />
      <View style={{ flex: 1 }}>{body}</View>
      <View style={[styles.composer, { borderColor: t.hairline, backgroundColor: t.surface, paddingBottom: space.sm + insets.bottom }]}>
        {sendError ? <Text style={[type.caption, { color: t.danger }]}>{sendError}</Text> : null}
        <View style={styles.row}>
          <Field value={draft} onChangeText={setDraft} placeholder="Message" style={{ flex: 1 }} multiline maxLength={4000} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={send}
            disabled={sending || !draft.trim()}
            style={[styles.send, { backgroundColor: t.action, opacity: sending || !draft.trim() ? 0.5 : 1 }]}
          >
            {sending ? <ActivityIndicator color={t.actionText} /> : <Feather name="send" size={18} color={t.actionText} />}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: "80%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 2 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.xs },
  row: { flexDirection: "row", gap: space.sm, alignItems: "flex-end" },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
