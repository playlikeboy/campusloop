import { router } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Avatar, Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { space, type, useTheme } from "@/lib/theme";
import type { NotificationItem } from "@/lib/types";
import { useRequest } from "@/lib/use-request";

/** Where a notification leads, when the app has that screen. */
function target(n: NotificationItem): string | null {
  if (!n.referenceId) return null;
  const kind = n.type.toUpperCase();
  if (kind.includes("MESSAGE") || kind.includes("CHAT")) return `/chat/${n.referenceId}`;
  if (kind.includes("EVENT")) return `/event/${n.referenceId}`;
  if (kind.includes("POST") || kind.includes("COMMENT") || kind.includes("VOTE") || kind.includes("MENTION") || kind.includes("REPLY"))
    return `/post/${n.referenceId}`;
  return null;
}

export default function Notifications() {
  const t = useTheme();
  const req = useRequest(() => api<{ notifications: NotificationItem[] }>("/api/notifications").then((r) => r.notifications ?? []));

  const markAll = async () => {
    req.setData((list) => (list ?? []).map((n) => ({ ...n, isRead: true })));
    await api("/api/notifications", { method: "PATCH", body: { all: true } }).catch(() => req.poll());
  };

  const open = (n: NotificationItem) => {
    if (!n.isRead) {
      req.setData((list) => (list ?? []).map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      api("/api/notifications", { method: "PATCH", body: { id: n.id } }).catch(() => undefined);
    }
    const to = target(n);
    if (to) router.push(to as never);
  };

  if (req.loading) return <LoadingState />;
  if (req.error && !req.data) return <ErrorState message={req.error} onRetry={req.reload} />;
  const list = req.data ?? [];
  const hasUnread = list.some((n) => !n.isRead);

  return (
    <FlatList
      data={list}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: space.xl }}
      refreshControl={<RefreshControl refreshing={req.refreshing} onRefresh={req.refresh} colors={[t.action]} />}
      ListHeaderComponent={
        hasUnread ? (
          <View style={{ padding: space.lg, paddingBottom: 0, alignItems: "flex-end" }}>
            <Button title="Mark all as read" variant="ghost" icon="check" onPress={markAll} />
          </View>
        ) : undefined
      }
      ListEmptyComponent={<EmptyState icon="bell" title="You're all caught up" body="Votes, comments and replies show up here." />}
      renderItem={({ item }) => {
        const name = item.actor?.displayName || item.actor?.username || "CampusLoop";
        return (
          <Pressable
            onPress={() => open(item)}
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? t.muted : item.isRead ? "transparent" : t.mist }]}
          >
            <Avatar uri={item.actor?.avatarUrl} name={name} size={40} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.body, { color: t.ink }]} numberOfLines={3}>
                <Text style={{ fontWeight: "700" }}>{name}</Text> {item.previewText || item.type.replace(/_/g, " ").toLowerCase()}
              </Text>
              <Text style={[type.caption, { color: t.inkSubtle }]}>{timeAgo(item.createdAt)}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, alignItems: "center" },
});
