// Config plugin: sign `assembleRelease` with the CampusLoop upload key when CI
// provides one, and leave Expo's default (the debug keystore) otherwise.
//
// prebuild regenerates android/, so the signing setup lives here instead of in
// android/app/build.gradle. Gradle reads these environment variables at build time:
//   CAMPUSLOOP_KEYSTORE_PATH      absolute path to the PKCS12 keystore
//   CAMPUSLOOP_KEYSTORE_PASSWORD  keystore password
//   CAMPUSLOOP_KEY_ALIAS          key alias (e.g. "campusloop")
//   CAMPUSLOOP_KEY_PASSWORD       key password
// If CAMPUSLOOP_KEYSTORE_PATH is unset or the file is missing, the release build
// keeps signingConfigs.debug, so the APK is still installable (beta fallback).
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// campusloop-release-signing";

const GROOVY = `
${MARKER}
def campusloopKeystore = System.getenv("CAMPUSLOOP_KEYSTORE_PATH")
if (campusloopKeystore != null && !campusloopKeystore.isEmpty() && new File(campusloopKeystore).exists()) {
    android.signingConfigs.create("campusloopRelease") {
        storeFile = new File(campusloopKeystore)
        storeType = "pkcs12"
        storePassword = System.getenv("CAMPUSLOOP_KEYSTORE_PASSWORD")
        keyAlias = System.getenv("CAMPUSLOOP_KEY_ALIAS")
        keyPassword = System.getenv("CAMPUSLOOP_KEY_PASSWORD")
    }
    android.buildTypes.release.signingConfig = android.signingConfigs.campusloopRelease
    println("CampusLoop: signing release with the upload keystore")
} else {
    println("CampusLoop: no upload keystore, release stays signed with the debug keystore")
}
`;

const KOTLIN = `
${MARKER}
val campusloopKeystore: String? = System.getenv("CAMPUSLOOP_KEYSTORE_PATH")
if (!campusloopKeystore.isNullOrEmpty() && file(campusloopKeystore).exists()) {
    android.signingConfigs.create("campusloopRelease") {
        storeFile = file(campusloopKeystore)
        storeType = "pkcs12"
        storePassword = System.getenv("CAMPUSLOOP_KEYSTORE_PASSWORD")
        keyAlias = System.getenv("CAMPUSLOOP_KEY_ALIAS")
        keyPassword = System.getenv("CAMPUSLOOP_KEY_PASSWORD")
    }
    android.buildTypes.getByName("release").signingConfig = android.signingConfigs.getByName("campusloopRelease")
    println("CampusLoop: signing release with the upload keystore")
} else {
    println("CampusLoop: no upload keystore, release stays signed with the debug keystore")
}
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(MARKER)) {
      const snippet = mod.modResults.language === "kt" ? KOTLIN : GROOVY;
      mod.modResults.contents = `${mod.modResults.contents.trimEnd()}\n${snippet}`;
    }
    return mod;
  });
};
