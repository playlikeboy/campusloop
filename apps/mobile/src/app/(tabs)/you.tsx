import Feather from "@expo/vector-icons/Feather";
import { router, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, Card, ErrorState, LoadingState, Row } from "@/components/ui";
import { api } from "@/lib/api";
import { webUrl } from "@/lib/config";
import { useSession } from "@/lib/session";
import { radius, space, type, useTheme } from "@/lib/theme";
import type { Profile, Streak } from "@/lib/types";
import { useRequest } from "@/lib/use-request";

type YouData = { me: Profile; streak: Streak | null; unread: number };

export default function You() {
  const t = useTheme();
  const { reloadMe } = useSession();
  const req = useRequest<YouData>(async () => {
    const [me, streak, unread] = await Promise.all([
      api<Profile>("/api/profile/me"),
      api<Streak>("/api/streaks/me").catch(() => null),
      api<{ unreadCount?: number }>("/api/notifications/unread-count").catch(() => null),
    ]);
    return { me, streak, unread: unread?.unreadCount ?? 0 };
  });

  useFocusEffect(
    useCallback(() => {
      req.poll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  if (req.loading) return <LoadingState />;
  if (req.error || !req.data) return <ErrorState message={req.error ?? "Couldn't load your profile"} onRetry={req.reload} />;
  const { me, streak, unread } = req.data;
  const name = me.displayName || me.username;

  return (
    <ScrollView
      contentContainerStyle={styles.root}
      refreshControl={
        <RefreshControl
          refreshing={req.refreshing}
          onRefresh={() => {
            req.refresh();
            reloadMe();
          }}
          colors={[t.action]}
        />
      }
    >
      <View style={styles.header}>
        <Avatar uri={me.avatarUrl} name={name} size={72} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.title, { color: t.ink, fontSize: 22 }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[type.body, { color: t.inkMuted }]} numberOfLines={1}>
            @{me.username}
          </Text>
          {me.institution?.name ? (
            <Text style={[type.caption, { color: t.inkSubtle }]} numberOfLines={1}>
              {me.institution.name}
            </Text>
          ) : null}
        </View>
      </View>
      {me.bio ? <Text style={[type.body, { color: t.ink }]}>{me.bio}</Text> : null}

      <View style={styles.stats}>
        <Card style={[styles.stat, { backgroundColor: streak?.isSafeToday ? t.mintSubtle : t.surface }]}>
          <Feather name="zap" size={20} color={streak?.isSafeToday ? t.mintText : t.inkMuted} />
          <Text style={[type.sticker, styles.num, { color: t.ink }]}>{streak?.currentStreak ?? 0}</Text>
          <Text style={[type.caption, { color: t.inkMuted }]}>
            {streak ? (streak.isSafeToday ? "day streak · safe today" : "day streak · post today to keep it") : "day streak"}
          </Text>
        </Card>
        <View style={[styles.stat, styles.points, { backgroundColor: t.points, shadowColor: t.shadow }]}>
          <Feather name="award" size={20} color={t.ink} />
          <Text style={[type.sticker, styles.num, { color: t.ink }]}>{me.points ?? 0}</Text>
          <Text style={[type.caption, { color: t.ink }]}>Loop Points</Text>
        </View>
      </View>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Row
          icon="bell"
          label="Notifications"
          onPress={() => router.push("/notifications")}
          right={
            unread > 0 ? (
              <View style={[styles.badge, { backgroundColor: t.action }]}>
                <Text style={[type.caption, { color: t.actionText }]}>{unread > 99 ? "99+" : unread}</Text>
              </View>
            ) : undefined
          }
        />
        <Row icon="edit-2" label="Edit profile on the web" onPress={() => WebBrowser.openBrowserAsync(webUrl("/profile"))} />
        <Row icon="settings" label="Settings" onPress={() => router.push("/settings")} />
      </Card>
      {streak ? (
        <Text style={[type.caption, { color: t.inkSubtle, textAlign: "center" }]}>
          Longest streak {streak.longestStreak} days · {streak.totalQualifiedDays} active days
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.lg, gap: space.lg },
  header: { flexDirection: "row", alignItems: "center", gap: space.lg },
  stats: { flexDirection: "row", gap: space.md },
  stat: { flex: 1, gap: 2, padding: space.lg },
  points: {
    borderRadius: radius.sticker,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  num: { fontVariant: ["tabular-nums"], fontSize: 30, lineHeight: 34 },
  badge: { minWidth: 24, height: 24, borderRadius: radius.pill, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
});
