// Expo push: ask permission, get the Expo push token, send it to /api/push/devices.
// Needs an EAS project id (extra.eas.projectId) and FCM credentials in the build;
// without them registration is skipped quietly and the app works without push.
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "./api";

let currentToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice || !projectId()) return;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "CampusLoop",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== "granted") return;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    currentToken = data;
    await api("/api/push/devices", { method: "POST", body: { token: data, platform: Platform.OS } });
  } catch (e) {
    console.warn("Push registration skipped:", e);
  }
}

export async function unregisterPush(): Promise<void> {
  if (!currentToken) return;
  try {
    await api("/api/push/devices", { method: "DELETE", body: { token: currentToken } });
  } catch {
    // Signing out must not fail because of push.
  }
  currentToken = null;
}

/** Push payload data.url ("/post/<id>", "/chat/<id>") mapped to an app route. */
export function routeForPushUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const post = url.match(/^\/post\/([\w-]+)/);
  if (post) return `/post/${post[1]}`;
  const chat = url.match(/^\/chat\/([\w-]+)/);
  if (chat) return `/chat/${chat[1]}`;
  const event = url.match(/^\/events\/([\w-]+)/);
  if (event) return `/event/${event[1]}`;
  if (url.startsWith("/notifications")) return "/notifications";
  return null;
}
