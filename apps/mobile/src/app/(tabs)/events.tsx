import { router } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { Card, Chip, EmptyState, ErrorState, LoadingState, Tag } from "@/components/ui";
import { api } from "@/lib/api";
import { eventDate } from "@/lib/format";
import { space, type, useTheme } from "@/lib/theme";
import type { EventItem } from "@/lib/types";
import { useRequest } from "@/lib/use-request";

type Scope = "ALL" | "MY_CAMPUS";

export default function Events() {
  const t = useTheme();
  const [scope, setScope] = useState<Scope>("ALL");
  const req = useRequest(
    () => api<{ events: EventItem[] }>(`/api/events?sort=upcoming&scope=${scope}&limit=40`).then((r) => r.events ?? []),
    [scope]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filters}>
        <Chip label="All events" selected={scope === "ALL"} onPress={() => setScope("ALL")} />
        <Chip label="My campus" selected={scope === "MY_CAMPUS"} onPress={() => setScope("MY_CAMPUS")} />
      </View>
      {req.loading ? (
        <LoadingState />
      ) : req.error ? (
        <ErrorState message={req.error} onRetry={req.reload} />
      ) : (
        <FlatList
          data={req.data ?? []}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
          refreshControl={<RefreshControl refreshing={req.refreshing} onRefresh={req.refresh} colors={[t.action]} />}
          ListEmptyComponent={<EmptyState icon="calendar" title="No events right now" body="Check back soon, or switch to all events." />}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/event/${item.id}`)} style={{ gap: space.sm, padding: 0, overflow: "hidden" }}>
              {item.bannerUrl ? <Image source={{ uri: item.bannerUrl }} style={styles.banner} contentFit="cover" /> : null}
              <View style={{ padding: space.lg, paddingTop: item.bannerUrl ? 0 : space.lg, gap: space.xs }}>
                <View style={styles.tags}>
                  {item.isLiveNow ? <Tag label="Live now" tone="mint" /> : null}
                  {item.isRegistered ? <Tag label="Registered" tone="violet" /> : null}
                  {item.eventType ? <Tag label={item.eventType.replace(/_/g, " ").toLowerCase()} /> : null}
                </View>
                <Text style={[type.title, { color: t.ink }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[type.caption, { color: t.inkMuted }]} numberOfLines={1}>
                  {[eventDate(item.startDate), item.mode === "ONLINE" ? "Online" : item.venue].filter(Boolean).join(" · ")}
                </Text>
                {item.clubName || item.institution?.name ? (
                  <Text style={[type.caption, { color: t.inkSubtle }]} numberOfLines={1}>
                    {item.clubName || item.institution?.name}
                  </Text>
                ) : null}
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm },
  list: { padding: space.lg, paddingTop: space.sm, flexGrow: 1 },
  banner: { width: "100%", aspectRatio: 2.2 },
  tags: { flexDirection: "row", gap: space.xs, flexWrap: "wrap" },
});
