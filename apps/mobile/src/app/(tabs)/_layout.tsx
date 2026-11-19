import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router/js-tabs";
import type { ColorValue } from "react-native";

import type { IconName } from "@/components/ui";
import { useTheme } from "@/lib/theme";

const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Feather name={name} size={size} color={color as string} />;

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.actionDeep,
        tabBarInactiveTintColor: t.inkSubtle,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.hairline, height: 64 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        headerStyle: { backgroundColor: t.ground },
        headerShadowVisible: false,
        headerTintColor: t.ink,
        headerTitleStyle: { fontWeight: "800", fontSize: 22 },
        sceneStyle: { backgroundColor: t.ground },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home") }} />
      <Tabs.Screen name="events" options={{ title: "Events", tabBarIcon: icon("calendar") }} />
      <Tabs.Screen name="learn" options={{ title: "Learn", tabBarIcon: icon("book-open") }} />
      <Tabs.Screen name="chat" options={{ title: "Chat", tabBarIcon: icon("message-circle") }} />
      <Tabs.Screen name="you" options={{ title: "You", tabBarIcon: icon("user") }} />
    </Tabs>
  );
}
