import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";

import { Card, Row } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { PRIVACY_URL, webUrl } from "@/lib/config";
import { useSession } from "@/lib/session";
import { space, type, useTheme } from "@/lib/theme";

export default function Settings() {
  const t = useTheme();
  const { signOut, deleteAccount: removeAccount } = useSession();
  const [busy, setBusy] = useState(false);

  const confirmSignOut = () =>
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await removeAccount();
    } catch (e) {
      Alert.alert("Couldn't delete your account", `${errorMessage(e)}\n\nYou can also delete it on the web under Settings.`);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      "Delete your account?",
      "This removes your profile, posts and chats from CampusLoop. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: deleteAccount },
      ]
    );

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Card style={styles.group}>
        <Row icon="bell" label="Notification settings on the web" onPress={() => WebBrowser.openBrowserAsync(webUrl("/settings"))} />
        <Row icon="shield" label="Privacy policy" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)} />
        <Row icon="file-text" label="Terms" onPress={() => WebBrowser.openBrowserAsync(webUrl("/terms"))} />
        <Row icon="help-circle" label="Safety and help" onPress={() => WebBrowser.openBrowserAsync(webUrl("/safety"))} />
      </Card>
      <Card style={styles.group}>
        <Row icon="log-out" label="Sign out" onPress={confirmSignOut} right={null} />
        <Row icon="trash-2" label={busy ? "Deleting…" : "Delete account"} danger onPress={busy ? undefined : confirmDelete} right={null} />
      </Card>
      <Text style={[type.caption, { color: t.inkSubtle, textAlign: "center" }]}>
        CampusLoop beta {Constants.expoConfig?.version ?? ""}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.lg, gap: space.lg },
  group: { padding: 0, overflow: "hidden" },
});
