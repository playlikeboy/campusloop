import Feather from "@expo/vector-icons/Feather";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";

import { PostCard } from "@/components/post-card";
import { Button, Chip, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { api } from "@/lib/api";
import { useBlockedAuthors } from "@/lib/blocks";
import { feedSignal } from "@/lib/signals";
import { radius, space, useTheme } from "@/lib/theme";
import type { Post } from "@/lib/types";
import { usePagedList } from "@/lib/use-request";

const PAGE = 20;
type Filter = "all" | "confessions";

export default function Home() {
  const t = useTheme();
  const [filter, setFilter] = useState<Filter>("all");
  const blocked = useBlockedAuthors();
  // Page 1 starts a scroll session; later pages use the same `before` snapshot so offsets stay stable.
  const snapshot = useRef(new Date().toISOString());
  const list = usePagedList<Post>(
    (page) => {
      if (page === 1) snapshot.current = new Date().toISOString();
      const type = filter === "confessions" ? "&type=CONFESSION" : "";
      return api<Post[]>(
        `/api/feed?sort=latest&limit=${PAGE}&page=${page}&before=${encodeURIComponent(snapshot.current)}${type}`
      );
    },
    PAGE,
    [filter]
  );

  // A new post from the composer shows up when Home is focused again.
  useFocusEffect(
    useCallback(() => {
      if (feedSignal.dirty) {
        feedSignal.dirty = false;
        list.refresh();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const visible = list.items.filter((p) => p.isAnonymous || !p.author?.id || !blocked.has(p.author.id));
  const update = (p: Post) => list.setItems((items) => items.map((x) => (x.id === p.id ? p : x)));

  const header = (
    <View style={styles.filters}>
      <Chip label="All posts" selected={filter === "all"} onPress={() => setFilter("all")} />
      <Chip label="Confessions" selected={filter === "confessions"} onPress={() => setFilter("confessions")} />
    </View>
  );

  let body;
  if (list.loading) body = <LoadingState />;
  else if (list.error && list.items.length === 0) body = <ErrorState message={list.error} onRetry={list.reload} />;
  else
    body = (
      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} onChange={update} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[t.action]} />}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          <EmptyState
            icon={filter === "confessions" ? "eye-off" : "edit-3"}
            title={filter === "confessions" ? "No confessions yet" : "Nothing here yet"}
            body="Be the first to post something."
            action={<Button title="Write a post" onPress={() => openComposer(filter === "confessions")} />}
          />
        }
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={t.action} style={{ margin: space.lg }} /> : undefined}
      />
    );

  return (
    <View style={{ flex: 1 }}>
      {header}
      {body}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Write a post"
        onPress={() => openComposer(filter === "confessions")}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: t.action, shadowColor: t.shadow, transform: [{ scale: pressed ? 0.95 : 1 }] },
        ]}
      >
        <Feather name="plus" size={26} color={t.actionText} />
      </Pressable>
    </View>
  );
}

function openComposer(confession: boolean) {
  router.push(confession ? "/compose?confession=1" : "/compose");
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm },
  list: { padding: space.lg, paddingTop: space.sm, paddingBottom: 96, flexGrow: 1 },
  fab: {
    position: "absolute",
    right: space.lg,
    bottom: space.lg,
    width: 56,
    height: 56,
    borderRadius: radius.sticker,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
});
