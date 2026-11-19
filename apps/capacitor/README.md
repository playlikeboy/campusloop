# CampusLoop Web (Android beta, Capacitor)

A thin Android shell that loads the live site, https://campusloop.space, in a Capacitor WebView,
so it always has every feature of the website. It is a second beta next to the Expo app in
`apps/mobile`; the two install side by side.

|                | Expo app (`apps/mobile`)           | This app (`apps/capacitor`)                 |
| -------------- | ---------------------------------- | ------------------------------------------- |
| App id         | `space.campusloop.app`             | `space.campusloop.web`                      |
| Name           | CampusLoop                         | CampusLoop Web                              |
| Workflow       | `android-apk.yml`                  | `android-capacitor-apk.yml`                 |
| Release tag    | `beta` (marked latest)             | `beta-web` (`--latest=false`)               |
| APK            | `releases/download/beta/campusloop-beta.apk` | `releases/download/beta-web/campusloop-web-beta.apk` |

Capacitor 8.6.2. CI builds with JDK 21 and Node 22. There is no web build: `www/` only holds the
offline screen, and `server.url` points the WebView at the live site.

## Layout

- `capacitor.config.json`: app id, `server.url`, `allowNavigation`, `appendUserAgent`
  (`CampusLoopWebApp/1.0`, which GA4 reports as platform `android_web`), splash and system bars.
- `www/index.html`: offline screen (Loop Violet on paper) with a Retry button.
- `android/`: committed native project. CI only runs `npx cap sync android`, so the custom code
  below survives every build. Generated files (`assets/public`, `capacitor.config.json` copy,
  `build/`) are git-ignored.
  - `ShellPlugin.java`: OAuth hand-off, back button, `navigator.share`, blob downloads.
  - `ShellWebViewClient.java`: offline screen on network errors only (not on HTTP 404/500).
  - `ShellChromeClient.java`: camera + gallery chooser for `<input type=file>`, full-screen video.
  - `ShellDownloadListener.java`: http(s) downloads through DownloadManager.
  - `assets/campusloop-shell.js`: injected at document start on campusloop.space only.
- `scripts/make-icons.mjs`: launcher icons, adaptive layers and splash from `public/favicon.svg`.
  Run from the repo root: `node apps/capacitor/scripts/make-icons.mjs`.

## What works in the WebView

- Everything on the website, live: feed, stories, chat, events, courses, communities, settings.
- Email and password sign-in (Hexclave cookies on campusloop.space, same origin).
- Google and GitHub sign-in through a Chrome Custom Tab, back into the app (see below).
- Photo uploads: the file picker offers the camera and the gallery.
- Sharing: `navigator.share` (text, links and image files) opens the Android share sheet.
- Downloads: http(s) files go to Downloads; generated images (`<a download>` with blob/data URLs,
  such as story cards) are saved to Pictures/CampusLoop.
- Microphone for voice notes, camera for any page that asks, and opt-in location.
- Back button: browser history back; exits the app on the first page. Leaves full-screen video first.
- Links to other sites open in the system browser or the app that handles them.

## Google sign-in

Google blocks OAuth inside embedded WebViews (`403 disallowed_useragent`). We do not hide the
WebView marker from Google. Instead:

1. In the WebView, Hexclave saves its PKCE verifier cookie and navigates to `accounts.google.com`.
2. `ShellPlugin.shouldOverrideLoad` catches that and opens
   `https://campusloop.space/app-auth/start?to=<provider url>` in a Custom Tab.
3. That route (`src/app/app-auth/start/route.ts`) sets the `cl_app_oauth` cookie in the browser and
   forwards to Google. It only forwards to known OAuth authorize URLs.
4. Google and Hexclave redirect the Custom Tab to `/handler/oauth-callback?code&state`.
5. `src/middleware.ts` sees `cl_app_oauth`, clears it and redirects to
   `intent://auth/oauth-callback?...#Intent;scheme=space.campusloop.web;package=space.campusloop.web;...`.
   If Chrome does not open the app, it falls back to `/app-auth/return`, which has a button.
6. The app reopens and loads `/handler/oauth-callback?code&state` in the WebView, where the
   verifier cookie lives, and Hexclave completes the sign-in.

The code is useless without the verifier, so carrying it through the app link is safe. If the user
closes the Custom Tab without finishing, the app reloads the sign-in page.

Not tested on a device yet (no Android SDK on the dev machine). If it fails, email sign-in still works.

## Push notifications: TODO

Web push does not work in Android WebView (no `PushManager`). Native push needs
`@capacitor/push-notifications` plus Firebase Cloud Messaging, which needs a
`google-services.json` for `space.campusloop.web` from the Firebase console. Not wired yet:

1. Add an Android app `space.campusloop.web` in Firebase and download `google-services.json`.
2. Store it as a CI secret and write it to `android/app/google-services.json` before the build
   (`android/app/build.gradle` already applies the Google services plugin when the file exists).
3. `npm i @capacitor/push-notifications`, register for push from the site when
   `navigator.userAgent` contains `CampusLoopWebApp`, and send the FCM token to the server.
4. Server: send through FCM for these tokens next to the existing web push.

## Local commands

```bash
cd apps/capacitor
npm ci
npx cap sync android        # copies www/ and the plugin list into android/
cd android && ./gradlew assembleRelease   # needs the Android SDK and JDK 21
```
