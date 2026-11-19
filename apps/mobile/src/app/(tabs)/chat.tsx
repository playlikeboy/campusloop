import { router } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Avatar, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { api } from "@/lib/api";
import { chatTitle, timeAgo } from "@/lib/format";
import { useSession } from "@/lib/session";
import { radius, space, type, useTheme } from "@/lib/theme";
import type { Conversation } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";
import { useRequest } from "@/lib/use-request";

export default function ChatList() {
  const t = useTheme();
  const { me } = useSession();
  const req = useRequest(() => api<Conversation[]>("/api/chat"));
  usePolling(req.poll, 5000);

  if (req.loading) return <LoadingState />;
  if (req.error && !req.data) return <ErrorState message={req.error} onRetry={req.reload} />;

  return (
    <FlatList
      data={req.data ?? []}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ flexGrow: 1, paddingVertical: space.sm }}
      refreshControl={<RefreshControl refreshing={req.refreshing} onRefresh={req.refresh} colors={[t.action]} />}
      ListEmptyComponent={
        <EmptyState icon="message-circle" title="No chats yet" body="Start a chat from someone's profile on the web. It shows up here." />
      }
      renderItem={({ item }) => {
        const title = chatTitle(item);
        const last = item.lastMessage;
        const unread = item.unreadCount > 0;
        return (
          <Pressable
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id, title } })}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: t.muted }]}
          >
            <Avatar uri={item.otherParticipant?.avatarUrl} name={title} size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.top}>
                <Text style={[type.label, { color: t.ink, flex: 1, fontSize: 16 }]} numberOfLines={1}>
                  {title}
                </Text>
                {last ? <Text style={[type.caption, { color: t.inkSubtle }]}>{timeAgo(last.createdAt)}</Text> : null}
              </View>
              <View style={styles.top}>
                <Text
                  style={[type.body, { color: unread ? t.ink : t.inkMuted, flex: 1, fontWeight: unread ? "600" : "400" }]}
                  numberOfLines={1}
                >
                  {last ? `${last.senderId === me?.id ? "You: " : ""}${last.body}` : "Say hi"}
                </Text>
                {unread ? (
                  <View style={[styles.badge, { backgroundColor: t.action }]}>
                    <Text style={[type.caption, { color: t.actionText }]}>{item.unreadCount}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  top: { flexDirection: "row", alignItems: "center", gap: space.sm },
  badge: { minWidth: 22, height: 22, borderRadius: radius.pill, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
});
