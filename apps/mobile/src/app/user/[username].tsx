import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, Button, Card, ErrorState, LoadingState } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { blockUser, reportUser, useBlockedAuthors } from "@/lib/blocks";
import { webUrl } from "@/lib/config";
import { useSession } from "@/lib/session";
import { space, type, useTheme } from "@/lib/theme";
import type { Profile } from "@/lib/types";
import { useRequest } from "@/lib/use-request";

export default function UserProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const t = useTheme();
  const { me } = useSession();
  const blocked = useBlockedAuthors();
  const req = useRequest(() => api<Profile>(`/api/profile/${encodeURIComponent(username)}`), [username]);

  if (req.loading) return <LoadingState />;
  if (req.error || !req.data) return <ErrorState message={req.error ?? "Profile not found"} onRetry={req.reload} />;
  const p = req.data;
  const isMe = me?.id === p.id;
  const isBlocked = blocked.has(p.id);
  const name = p.displayName || p.username;

  const block = () =>
    Alert.alert(`Block ${name}?`, "You won't see each other's posts, and they can't message you.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: () =>
          blockUser(p.id)
            .then(() => router.back())
            .catch((e) => Alert.alert("Couldn't block", errorMessage(e))),
      },
    ]);

  const sendReport = (reason: string) =>
    reportUser(p.id, reason)
      .then(() => Alert.alert("Thanks for reporting", "Our team will take a look."))
      .catch((e) => Alert.alert("Report failed", errorMessage(e)));

  const report = () =>
    Alert.alert("Report this profile", "What's wrong?", [
      { text: "Cancel", style: "cancel" },
      { text: "Fake or spam", onPress: () => sendReport("SPAM") },
      { text: "Harassment", onPress: () => sendReport("HARASSMENT") },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Avatar uri={p.avatarUrl} name={name} size={80} />
        <Text style={[type.title, { color: t.ink, fontSize: 22 }]}>{name}</Text>
        <Text style={[type.body, { color: t.inkMuted }]}>@{p.username}</Text>
        {p.institution?.name ? <Text style={[type.caption, { color: t.inkSubtle }]}>{p.institution.name}</Text> : null}
      </View>
      {p.bio ? (
        <Card>
          <Text style={[type.body, { color: t.ink }]}>{p.bio}</Text>
        </Card>
      ) : null}
      <Button title="Open full profile" variant="secondary" icon="external-link" onPress={() => WebBrowser.openBrowserAsync(webUrl(`/${p.username}`))} />
      {isMe ? null : (
        <View style={{ gap: space.sm }}>
          <Button title="Report" variant="ghost" icon="flag" onPress={report} />
          <Button title={isBlocked ? "Blocked" : "Block"} variant="danger" icon="slash" disabled={isBlocked} onPress={block} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.lg, gap: space.lg },
  header: { alignItems: "center", gap: space.xs, paddingVertical: space.lg },
});
