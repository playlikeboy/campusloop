import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { Button, Chip, Field } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { feedSignal } from "@/lib/signals";
import { radius, space, type, useTheme } from "@/lib/theme";

const MAX = 2000;
type Kind = "post" | "confession";

export default function Compose() {
  const t = useTheme();
  const params = useLocalSearchParams<{ confession?: string }>();
  const [kind, setKind] = useState<Kind>(params.confession ? "confession" : "post");
  const [anonymous, setAnonymous] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfession = kind === "confession";
  const trimmed = body.trim();

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/posts", {
        method: "POST",
        body: {
          body: trimmed,
          type: isConfession ? "CONFESSION" : "NORMAL",
          scope: isConfession ? "CAMPUS" : "GLOBAL",
          isAnonymous: isConfession || anonymous,
        },
      });
      feedSignal.dirty = true;
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
        <View style={styles.row}>
          <Chip label="Post" selected={kind === "post"} onPress={() => setKind("post")} />
          <Chip label="Confession" selected={isConfession} onPress={() => setKind("confession")} />
        </View>

        <Field
          multiline
          autoFocus
          value={body}
          onChangeText={setBody}
          maxLength={MAX}
          placeholder={isConfession ? "Say what you can't say out loud…" : "What's happening on campus?"}
          style={styles.input}
          textAlignVertical="top"
          accessibilityLabel="Post text"
        />
        <Text style={[type.caption, { color: t.inkSubtle, alignSelf: "flex-end" }]}>
          {trimmed.length}/{MAX}
        </Text>

        {isConfession ? (
          <View style={[styles.note, { backgroundColor: t.mist }]}>
            <Text style={[type.body, { color: t.ink }]}>
              Confessions are always anonymous and go to your campus. No names, numbers or anything that points to someone.
            </Text>
          </View>
        ) : (
          <View style={[styles.toggle, { borderColor: t.hairline }]}>
            <View style={{ flex: 1 }}>
              <Text style={[type.label, { color: t.ink }]}>Post anonymously</Text>
              <Text style={[type.caption, { color: t.inkSubtle }]}>Your name and photo stay hidden.</Text>
            </View>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ true: t.action, false: t.hairlineStrong }}
              thumbColor={t.surface}
              accessibilityLabel="Post anonymously"
            />
          </View>
        )}

        {error ? <Text style={[type.body, { color: t.danger }]}>{error}</Text> : null}
        <Button title={isConfession ? "Post confession" : "Post"} onPress={submit} loading={busy} disabled={!trimmed} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.lg, gap: space.md },
  row: { flexDirection: "row", gap: space.sm },
  input: { minHeight: 180, paddingTop: space.md, paddingBottom: space.md },
  note: { borderRadius: radius.card, padding: space.lg },
  toggle: { flexDirection: "row", alignItems: "center", gap: space.md, borderWidth: 1, borderRadius: radius.card, padding: space.lg },
});
