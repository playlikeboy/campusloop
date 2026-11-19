// CampusLoop Android beta. Dynamic config so CI can stamp versionCode
// (ANDROID_VERSION_CODE = github.run_number) without editing this file.
const versionCode = Number.parseInt(process.env.ANDROID_VERSION_CODE ?? "", 10);

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: "CampusLoop",
  slug: "campusloop",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "campusloop",
  userInterfaceStyle: "automatic",
  android: {
    package: "space.campusloop.app",
    versionCode: Number.isFinite(versionCode) && versionCode > 0 ? versionCode : 1,
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
      backgroundColor: "#ffffff",
    },
    predictiveBackGestureEnabled: false,
    permissions: ["android.permission.POST_NOTIFICATIONS"],
  },
  ios: {
    bundleIdentifier: "space.campusloop.app",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    [
      "expo-notifications",
      {
        color: "#6b3df5",
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#ffffff",
        image: "./assets/images/splash-icon.png",
        imageWidth: 96,
        dark: {
          backgroundColor: "#0d0a17",
          image: "./assets/images/splash-icon.png",
        },
      },
    ],
    "./plugins/with-release-signing.js",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.CAMPUSLOOP_API_URL || "https://campusloop.space",
    // Expo push tokens need an EAS project id: set EAS_PROJECT_ID when building.
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
};
