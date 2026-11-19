// Story-sticker primitives for native: pill buttons, chips, hairline cards,
// and the loading / empty / error states every screen uses.
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { radius, space, type, useTheme } from "@/lib/theme";

export type IconName = ComponentProps<typeof Feather>["name"];

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = "primary", icon, loading, disabled, style }: ButtonProps) {
  const t = useTheme();
  const bg =
    variant === "primary" ? t.action : variant === "danger" ? t.dangerSubtle : variant === "secondary" ? t.muted : "transparent";
  const fg = variant === "primary" ? t.actionText : variant === "danger" ? t.danger : variant === "ghost" ? t.actionDeep : t.ink;
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: off ? 0.6 : 1, transform: [{ scale: pressed && !off ? 0.97 : 1 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={18} color={fg} /> : null}
          <Text style={[type.label, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? t.action : t.muted }]}
    >
      <Text style={[type.label, { color: selected ? t.actionText : t.inkMuted }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const t = useTheme();
  const base = [styles.card, { backgroundColor: t.surface, borderColor: t.hairline }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { backgroundColor: t.muted }]}>
      {children}
    </Pressable>
  );
}

export function Avatar({ uri, name, size = 36 }: { uri?: string | null; name?: string | null; size?: number }) {
  const t = useTheme();
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.muted }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.mist, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: t.actionDeep, fontWeight: "700", fontSize: size * 0.42 }}>{initial}</Text>
    </View>
  );
}

export function Field(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.inkSubtle}
      selectionColor={t.action}
      cursorColor={t.action}
      {...props}
      style={[styles.field, { borderColor: t.hairlineStrong, color: t.ink, backgroundColor: t.surface }, props.style]}
    />
  );
}

export function LoadingState() {
  const t = useTheme();
  return (
    <View style={styles.center} accessibilityLabel="Loading">
      <ActivityIndicator size="large" color={t.action} />
    </View>
  );
}

export function EmptyState({ icon = "inbox", title, body, action }: { icon?: IconName; title: string; body?: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.stateIcon, { backgroundColor: t.mist }]}>
        <Feather name={icon} size={26} color={t.actionDeep} />
      </View>
      <Text style={[type.title, { color: t.ink, textAlign: "center" }]}>{title}</Text>
      {body ? <Text style={[type.body, { color: t.inkMuted, textAlign: "center" }]}>{body}</Text> : null}
      {action}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.stateIcon, { backgroundColor: t.dangerSubtle }]}>
        <Feather name="wifi-off" size={26} color={t.danger} />
      </View>
      <Text style={[type.title, { color: t.ink, textAlign: "center" }]}>Couldn&apos;t load this</Text>
      <Text style={[type.body, { color: t.inkMuted, textAlign: "center" }]}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" icon="refresh-cw" onPress={onRetry} /> : null}
    </View>
  );
}

export function Row({ icon, label, onPress, danger, right }: { icon: IconName; label: string; onPress?: () => void; danger?: boolean; right?: ReactNode }) {
  const t = useTheme();
  const color = danger ? t.danger : t.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: t.hairline, backgroundColor: pressed ? t.muted : "transparent" }]}
    >
      <Feather name={icon} size={20} color={danger ? t.danger : t.inkMuted} />
      <Text style={[type.body, { color, flex: 1 }]}>{label}</Text>
      {right ?? <Feather name="chevron-right" size={18} color={t.inkSubtle} />}
    </Pressable>
  );
}

export function Tag({ label, tone }: { label: string; tone?: "mint" | "violet" }) {
  const t = useTheme();
  const bg = tone === "mint" ? t.mintSubtle : tone === "violet" ? t.mist : t.muted;
  const fg = tone === "mint" ? t.mintText : tone === "violet" ? t.actionDeep : t.inkMuted;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={[type.caption, { color: fg, textTransform: "capitalize" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  chip: { minHeight: 40, borderRadius: radius.pill, paddingHorizontal: space.lg, justifyContent: "center" },
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth * 2, padding: space.lg },
  field: { minHeight: 44, borderRadius: radius.field, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.md, minHeight: 280 },
  stateIcon: { width: 56, height: 56, borderRadius: radius.sticker, alignItems: "center", justifyContent: "center" },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
