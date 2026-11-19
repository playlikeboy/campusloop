import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

import { PostCard } from "@/components/post-card";
import { Avatar, EmptyState, ErrorState, Field, LoadingState } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useBlockedAuthors } from "@/lib/blocks";
import { authorName, timeAgo } from "@/lib/format";
import { space, type, useTheme } from "@/lib/theme";
import type { Comment, Post } from "@/lib/types";
import { useRequest } from "@/lib/use-request";

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const blocked = useBlockedAuthors();
  const post = useRequest(() => api<Post>(`/api/posts/${id}`), [id]);
  const comments = useRequest(() => api<Comment[]>(`/api/posts/${id}/comments?limit=50`), [id]);
  const [draft, setDraft] = useState("");
  const [anon, setAnon] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  if (post.loading) return <LoadingState />;
  if (post.error || !post.data) return <ErrorState message={post.error ?? "Post not found"} onRetry={post.reload} />;

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setSendError(null);
    try {
      const created = await api<Comment>(`/api/posts/${id}/comments`, { method: "POST", body: { body: text, isAnonymous: anon } });
      comments.setData((prev) => [...(prev ?? []), created]);
      post.setData((p) => (p ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      setDraft("");
    } catch (e) {
      setSendError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const list = (comments.data ?? []).filter((c) => c.isAnonymous || !c.author?.id || !blocked.has(c.author.id));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: space.lg, gap: space.md }}
        ListHeaderComponent={
          <View style={{ gap: space.lg }}>
            <PostCard post={post.data} full onChange={(p) => post.setData(p)} />
            <Text style={[type.title, { color: t.ink }]}>Comments</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Avatar uri={item.isAnonymous ? null : item.author?.avatarUrl} name={authorName(item)} size={30} />
            <View style={[styles.bubble, { backgroundColor: t.muted }]}>
              <Text style={[type.caption, { color: t.inkMuted }]}>
                {authorName(item)} · {timeAgo(item.createdAt)}
              </Text>
              <Text style={[type.body, { color: t.ink }]}>{item.body}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          comments.loading ? (
            <ActivityIndicator color={t.action} />
          ) : comments.error ? (
            <ErrorState message={comments.error} onRetry={comments.reload} />
          ) : (
            <EmptyState icon="message-circle" title="No comments yet" body="Start the conversation." />
          )
        }
      />
      <View style={[styles.composer, { borderColor: t.hairline, backgroundColor: t.surface, paddingBottom: space.sm + insets.bottom }]}>
        {sendError ? <Text style={[type.caption, { color: t.danger }]}>{sendError}</Text> : null}
        <View style={styles.composerRow}>
          <Field value={draft} onChangeText={setDraft} placeholder="Add a comment" style={{ flex: 1 }} maxLength={1000} multiline />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send comment"
            onPress={send}
            disabled={sending || !draft.trim()}
            style={[styles.send, { backgroundColor: t.action, opacity: sending || !draft.trim() ? 0.5 : 1 }]}
          >
            {sending ? <ActivityIndicator color={t.actionText} /> : <Feather name="send" size={18} color={t.actionText} />}
          </Pressable>
        </View>
        <View style={styles.anonRow}>
          <Switch value={anon} onValueChange={setAnon} trackColor={{ true: t.action, false: t.hairlineStrong }} thumbColor={t.surface} accessibilityLabel="Comment anonymously" />
          <Text style={[type.caption, { color: t.inkMuted }]}>Comment anonymously</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  comment: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  bubble: { flex: 1, borderRadius: 18, padding: space.md, gap: 2 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.xs },
  composerRow: { flexDirection: "row", gap: space.sm, alignItems: "flex-end" },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  anonRow: { flexDirection: "row", alignItems: "center", gap: space.xs },
});
