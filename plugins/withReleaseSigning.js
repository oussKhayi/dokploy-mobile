// Config plugin: sign release builds with a real keystore when the
// ANDROID_KEYSTORE_* environment variables are set (CI secrets),
// otherwise fall back to the debug keystore so local builds still work.
const { withAppBuildGradle } = require("expo/config-plugins");

const SIGNING = `
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes("ANDROID_KEYSTORE_PATH")) return cfg;

    // 1. add a "release" signing config next to "debug"
    src = src.replace(/signingConfigs\s*\{/, (m) => `${m}${SIGNING}`);

    // 2. use it for the release build type when available
    src = src.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      `$1signingConfig System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug`,
    );

    cfg.modResults.contents = src;
    return cfg;
  });
};
