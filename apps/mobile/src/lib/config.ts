import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };

export const BASE_URL = (extra.apiBaseUrl || "https://campusloop.space").replace(/\/$/, "");
export const OAUTH = {
  clientId: "campusloop-android",
  redirectUri: "campusloop://oauth",
  scopes: "openid profile offline_access app",
  authorizeUrl: `${BASE_URL}/oauth/authorize`,
  tokenUrl: `${BASE_URL}/oauth/token`,
  revokeUrl: `${BASE_URL}/oauth/revoke`,
};
export const PRIVACY_URL = "https://campusloop.space/privacy";
export const webUrl = (path: string) => `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
