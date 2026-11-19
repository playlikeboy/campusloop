import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, Card, ErrorState, LoadingState, Tag } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { webUrl } from "@/lib/config";
import { eventDate } from "@/lib/format";
import { radius, space, type, useTheme } from "@/lib/theme";
import type { EventItem } from "@/lib/types";
import { useRequest } from "@/lib/use-request";

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const req = useRequest(() => api<{ event: EventItem }>(`/api/events/${id}`).then((r) => r.event), [id]);
  const [busy, setBusy] = useState(false);

  if (req.loading) return <LoadingState />;
  if (req.error || !req.data) return <ErrorState message={req.error ?? "Event not found"} onRetry={req.reload} />;
  const ev = req.data;

  const ended = ev.isClosed || new Date(ev.endDate).getTime() < Date.now();
  const deadlinePassed = ev.registrationDeadline ? new Date(ev.registrationDeadline).getTime() < Date.now() : false;
  const started = new Date(ev.startDate).getTime() < Date.now();
  const teamOnly = ev.participationType === "TEAM";
  const webPage = webUrl(`/events/${ev.id}`);

  const register = async () => {
    setBusy(true);
    try {
      await api(`/api/events/${ev.id}/register`, { method: "POST", body: { registrationType: "SOLO" } });
      req.setData({ ...ev, isRegistered: true, attendeeCount: (ev.attendeeCount ?? 0) + 1 });
    } catch (e) {
      Alert.alert("Couldn't register", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const cancel = () =>
    Alert.alert("Cancel your registration?", undefined, [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel registration",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await api(`/api/events/${ev.id}/register`, { method: "DELETE" });
            req.setData({ ...ev, isRegistered: false, attendeeCount: Math.max(0, (ev.attendeeCount ?? 1) - 1) });
          } catch (e) {
            Alert.alert("Couldn't cancel", errorMessage(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  let action;
  if (ev.isRegistered) action = <Button title="You're registered. Cancel?" variant="secondary" icon="check" loading={busy} onPress={cancel} />;
  else if (ended || started || deadlinePassed) action = <Button title={ended ? "This event has ended" : "Registration closed"} variant="secondary" disabled />;
  else if (teamOnly) action = <Button title="Register your team on the web" icon="external-link" onPress={() => WebBrowser.openBrowserAsync(webPage)} />;
  else action = <Button title="Register" icon="calendar" loading={busy} onPress={register} />;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      {ev.bannerUrl ? <Image source={{ uri: ev.bannerUrl }} style={styles.banner} contentFit="cover" /> : null}
      <View style={styles.tags}>
        {ev.isLiveNow ? <Tag label="Live now" tone="mint" /> : null}
        {ev.eventType ? <Tag label={ev.eventType.replace(/_/g, " ").toLowerCase()} /> : null}
        {ev.mode ? <Tag label={ev.mode.toLowerCase()} /> : null}
        <Tag label={ev.isPaid ? `Fee ₹${ev.entryFee ?? ""}` : "Free"} />
      </View>
      <Text style={[type.sticker, { color: t.ink }]}>{ev.title}</Text>
      {ev.tagline ? <Text style={[type.body, { color: t.inkMuted }]}>{ev.tagline}</Text> : null}

      <Card style={{ gap: space.sm }}>
        <Info label="Starts" value={eventDate(ev.startDate)} />
        <Info label="Ends" value={eventDate(ev.endDate)} />
        {ev.registrationDeadline ? <Info label="Register by" value={eventDate(ev.registrationDeadline)} /> : null}
        <Info label="Where" value={ev.mode === "ONLINE" ? "Online" : ev.venue || "To be announced"} />
        {ev.clubName || ev.institution?.name ? <Info label="Hosted by" value={(ev.clubName || ev.institution?.name) as string} /> : null}
        <Info label="Going" value={String(ev.attendeeCount ?? 0)} />
      </Card>

      {action}

      {ev.prizesDescription ? (
        <View style={{ gap: space.xs }}>
          <Text style={[type.title, { color: t.ink }]}>Prizes</Text>
          <Text style={[type.body, { color: t.ink }]}>{ev.prizesDescription}</Text>
        </View>
      ) : null}
      {ev.description ? (
        <View style={{ gap: space.xs }}>
          <Text style={[type.title, { color: t.ink }]}>About</Text>
          <Text style={[type.body, { color: t.ink }]}>{ev.description}</Text>
        </View>
      ) : null}
      <Button title="Open on the web" variant="ghost" icon="external-link" onPress={() => WebBrowser.openBrowserAsync(webPage)} />
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={styles.info}>
      <Text style={[type.label, { color: t.inkMuted, width: 96 }]}>{label}</Text>
      <Text style={[type.body, { color: t.ink, flex: 1 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.lg, gap: space.lg, paddingBottom: 48 },
  banner: { width: "100%", aspectRatio: 2, borderRadius: radius.card },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  info: { flexDirection: "row", gap: space.sm },
});
