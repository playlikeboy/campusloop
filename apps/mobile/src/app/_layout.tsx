import * as Notifications from "expo-notifications";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { routeForPushUrl } from "@/lib/push";
import { SessionProvider, useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

function RootStack() {
  const { status } = useSession();
  const t = useTheme();

  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync();
  }, [status]);

  // Tapping a push opens the matching screen.
  useEffect(() => {
    if (status !== "signedIn") return;
    const open = (n: Notifications.Notification) => {
      const route = routeForPushUrl(n.request.content.data?.url);
      if (route) router.push(route as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last.notification);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification));
    return () => sub.remove();
  }, [status]);

  if (status === "loading") return null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: t.ink,
        headerStyle: { backgroundColor: t.ground },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: t.ground },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Protected guard={status === "signedIn"}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
        <Stack.Screen name="compose" options={{ title: "New post", presentation: "modal" }} />
        <Stack.Screen name="event/[id]" options={{ title: "Event" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
        <Stack.Screen name="user/[username]" options={{ title: "Profile" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack.Protected>
      <Stack.Protected guard={status === "signedOut"}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <SessionProvider>
        <RootStack />
      </SessionProvider>
    </ThemeProvider>
  );
}
