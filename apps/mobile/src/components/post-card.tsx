import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { api, errorMessage } from "@/lib/api";
import { blockUser } from "@/lib/blocks";
import { authorName, timeAgo } from "@/lib/format";
import { space, type, useTheme } from "@/lib/theme";
import type { Post } from "@/lib/types";

import { Avatar, Card } from "./ui";

/** Up/down vote with an optimistic update that rolls back on failure. */
export function useVote(post: Post, onChange: (p: Post) => void) {
  return async (value: 1 | -1) => {
    const next = post.userVote === value ? 0 : value;
    const delta = next - post.userVote;
    const before = post;
    onChange({ ...post, userVote: next, votesCount: post.votesCount + delta });
    try {
      await api(`/api/posts/${post.id}/vote`, { method: "POST", body: { value: next } });
    } catch (e) {
      onChange(before);
      Alert.alert("Vote didn't go through", errorMessage(e));
    }
  };
}

export function openPostMenu(post: Post, onBlocked?: () => void) {
  const report = (reason: string) =>
    api(`/api/posts/${post.id}/report`, { method: "POST", body: { reason } })
      .then(() => Alert.alert("Thanks for reporting", "Our team will take a look."))
      .catch((e) => Alert.alert("Report failed", errorMessage(e)));

  const askReason = () =>
    Alert.alert("Report this post", "What's wrong with it?", [
      { text: "Cancel", style: "cancel" },
      { text: "Spam", onPress: () => report("SPAM") },
      { text: "Harmful or abusive", onPress: () => report("HARASSMENT") },
    ]);

  const authorId = post.isAnonymous ? null : (post.author?.id ?? post.authorId ?? null);
  const buttons: { text: string; style?: "cancel" | "destructive"; onPress?: () => void }[] = [
    { text: "Cancel", style: "cancel" },
    { text: "Report", onPress: askReason },
  ];
  if (authorId) {
    buttons.push({
      text: "Block author",
      style: "destructive",
      onPress: () =>
        Alert.alert("Block this student?", "You won't see each other's posts, and they can't message you.", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Block",
            style: "destructive",
            onPress: () =>
              blockUser(authorId)
                .then(() => onBlocked?.())
                .catch((e) => Alert.alert("Couldn't block", errorMessage(e))),
          },
        ]),
    });
  }
  Alert.alert("Post options", undefined, buttons);
}

export function PostCard({ post, onChange, full }: { post: Post; onChange: (p: Post) => void; full?: boolean }) {
  const t = useTheme();
  const vote = useVote(post, onChange);
  const [expanded, setExpanded] = useState(!!full);
  const name = authorName(post);
  const isConfession = post.type === "CONFESSION";
  const openProfile =
    !post.isAnonymous && post.author?.username ? () => router.push(`/user/${post.author!.username}`) : undefined;

  return (
    <Card onPress={full ? undefined : () => router.push(`/post/${post.id}`)} style={styles.card}>
      <View style={styles.head}>
        <Pressable onPress={openProfile} disabled={!openProfile} style={styles.who}>
          <Avatar uri={post.isAnonymous ? null : post.author?.avatarUrl} name={name} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: t.ink }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[type.caption, { color: t.inkSubtle }]} numberOfLines={1}>
              {[isConfession ? "Confession" : null, post.institution?.name, timeAgo(post.createdAt)].filter(Boolean).join(" · ")}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel="Post options"
          hitSlop={12}
          onPress={() => openPostMenu(post, () => router.canGoBack() && full && router.back())}
          style={styles.iconBtn}
        >
          <Feather name="more-horizontal" size={20} color={t.inkMuted} />
        </Pressable>
      </View>

      {post.title ? <Text style={[type.title, { color: t.ink }]}>{post.title}</Text> : null}
      <Text
        style={[type.body, { color: t.ink }]}
        numberOfLines={expanded ? undefined : 8}
        onPress={full ? undefined : () => setExpanded(true)}
      >
        {post.body}
      </Text>

      <View style={styles.actions}>
        <View style={[styles.votePill, { backgroundColor: t.muted }]}>
          <Pressable accessibilityLabel="Upvote" hitSlop={8} onPress={() => vote(1)} style={styles.iconBtn}>
            <Feather name="arrow-up" size={20} color={post.userVote === 1 ? t.action : t.inkMuted} />
          </Pressable>
          <Text style={[type.label, styles.count, { color: post.userVote !== 0 ? t.actionDeep : t.ink }]}>
            {post.votesCount}
          </Text>
          <Pressable accessibilityLabel="Downvote" hitSlop={8} onPress={() => vote(-1)} style={styles.iconBtn}>
            <Feather name="arrow-down" size={20} color={post.userVote === -1 ? t.action : t.inkMuted} />
          </Pressable>
        </View>
        <View style={[styles.votePill, { backgroundColor: t.muted, paddingHorizontal: space.md }]}>
          <Feather name="message-circle" size={18} color={t.inkMuted} />
          <Text style={[type.label, styles.count, { color: t.ink }]}>{post.commentsCount}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  who: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.sm },
  actions: { flexDirection: "row", gap: space.sm },
  votePill: { flexDirection: "row", alignItems: "center", borderRadius: 9999, minHeight: 40, gap: 2 },
  iconBtn: { minWidth: 40, minHeight: 40, alignItems: "center", justifyContent: "center" },
  count: { minWidth: 18, textAlign: "center", fontVariant: ["tabular-nums"] },
});
