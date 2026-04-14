// @ts-check
const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Removes enableBundleCompression from app/build.gradle.
 * This property was removed from ReactExtension in React Native 0.75+
 * but the Expo prebuild template still generates it.
 */
module.exports = function withBundleCompressionFix(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;

    cfg.modResults.contents = cfg.modResults.contents.replace(
      /\s*enableBundleCompression\s*=.*\n/g,
      '\n'
    );

    return cfg;
  });
};
