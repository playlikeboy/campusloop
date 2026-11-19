import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, ErrorState, Field, LoadingState } from "@/components/ui";
import { api } from "@/lib/api";
import { webUrl } from "@/lib/config";
import { radius, space, type, useTheme } from "@/lib/theme";
import type { Course } from "@/lib/types";
import { usePagedList } from "@/lib/use-request";

const PAGE = 20;

export default function Learn() {
  const t = useTheme();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setQ(input.trim()), 400);
    return () => clearTimeout(id);
  }, [input]);

  const list = usePagedList<Course>(
    (page) =>
      api<{ courses: Course[] }>(`/api/courses?limit=${PAGE}&page=${page}${q ? `&q=${encodeURIComponent(q)}` : ""}`).then(
        (r) => r.courses ?? []
      ),
    PAGE,
    [q]
  );

  const open = (c: Course) =>
    WebBrowser.openBrowserAsync(webUrl(`/courses/${c.slug}`), { toolbarColor: t.ground, controlsColor: t.action });

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.search}>
        <Field
          value={input}
          onChangeText={setInput}
          placeholder="Search free courses"
          returnKeyType="search"
          accessibilityLabel="Search courses"
        />
      </View>
      {list.loading ? (
        <LoadingState />
      ) : list.error && list.items.length === 0 ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} colors={[t.action]} />}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.6}
          ListEmptyComponent={
            <EmptyState icon="book-open" title={q ? "No courses match that" : "No courses yet"} body={q ? "Try a shorter search." : undefined} />
          }
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={t.action} style={{ margin: space.lg }} /> : undefined}
          renderItem={({ item }) => (
            <Card onPress={() => open(item)} style={styles.card}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: t.mist, alignItems: "center", justifyContent: "center" }]}>
                  <Feather name="play-circle" size={26} color={t.actionDeep} />
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.label, { color: t.ink, fontSize: 15 }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[type.caption, { color: t.inkMuted }]} numberOfLines={1}>
                  {item.instructorName || item.provider || item.category || "Free course"}
                </Text>
                <Text style={[type.caption, { color: t.inkSubtle }]} numberOfLines={1}>
                  {[item.lecturesCount ? `${item.lecturesCount} lectures` : null, item.level, item.language].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  list: { padding: space.lg, paddingTop: space.sm, flexGrow: 1 },
  card: { flexDirection: "row", gap: space.md, alignItems: "center", padding: space.md },
  thumb: { width: 112, aspectRatio: 16 / 9, borderRadius: radius.field },
});
