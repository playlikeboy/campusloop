import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui";
import { AuthError } from "@/lib/auth";
import { PRIVACY_URL, webUrl } from "@/lib/config";
import { useSession } from "@/lib/session";
import { radius, space, type, useTheme } from "@/lib/theme";

export default function SignIn() {
  const t = useTheme();
  const { signIn } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-in failed. Try again.";
      setError(msg);
      setNeedsOnboarding(e instanceof AuthError && /onboard|profile|setting up/i.test(`${e.code} ${e.message}`));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.ground }]}>
      <View style={styles.hero}>
        <Image source={require("@/../assets/images/icon.png")} style={styles.logo} />
        <View style={[styles.sticker, { backgroundColor: t.surface, borderColor: t.hairline }]}>
          <Text style={[type.sticker, { color: t.ink }]}>Your campus,</Text>
          <Text style={[type.sticker, { color: t.actionDeep }]}>in your pocket.</Text>
        </View>
        <Text style={[type.body, { color: t.inkMuted, textAlign: "center" }]}>
          Feed, confessions, events, free courses and chat with students from your college.
        </Text>
      </View>

      <View style={styles.actions}>
        {error ? (
          <View style={[styles.error, { backgroundColor: t.dangerSubtle }]}>
            <Text style={[type.body, { color: t.danger }]}>{error}</Text>
          </View>
        ) : null}
        <Button title="Sign in with CampusLoop" icon="log-in" loading={busy} onPress={go} />
        {needsOnboarding ? (
          <Button title="Finish setup on the web" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(webUrl("/onboarding"))} />
        ) : (
          <Button title="New here? Create an account" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(webUrl("/sign-up"))} />
        )}
        <Button title="Privacy policy" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space.xl, justifyContent: "space-between" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.xl },
  logo: { width: 88, height: 88, borderRadius: radius.sticker },
  sticker: {
    borderRadius: radius.sticker,
    borderWidth: 1,
    paddingVertical: space.lg,
    paddingHorizontal: space.xl,
    alignItems: "center",
    transform: [{ rotate: "-2deg" }],
  },
  actions: { gap: space.md },
  error: { borderRadius: radius.field, padding: space.md },
});
