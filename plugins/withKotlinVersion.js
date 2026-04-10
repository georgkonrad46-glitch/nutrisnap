// @ts-check
const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Ensures kotlinVersion and kotlin_version are defined in root android/build.gradle.
 * Fixes "Could not get unknown property 'kotlinVersion'" error on Expo SDK 54 + RN 0.76.
 */
module.exports = function withKotlinVersion(config, props = {}) {
  const version = props.version || '2.0.21';

  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;

    let src = cfg.modResults.contents;

    // Check if there is already an ext { ... } block under buildscript { ... }
    if (!/buildscript\s*{[^}]*ext\s*{/.test(src)) {
      // No ext block inside buildscript — inject one
      src = src.replace(
        /buildscript\s*{/,
        `buildscript {\n  ext {\n    kotlinVersion = '${version}'\n    kotlin_version = '${version}'\n  }`,
      );
    } else {
      // ext block exists — update or add kotlinVersion
      if (/kotlinVersion\s*=/.test(src)) {
        src = src.replace(
          /kotlinVersion\s*=\s*['"'][^'"]*['"']/,
          `kotlinVersion = '${version}'`,
        );
      } else {
        src = src.replace(/ext\s*{/, `ext {\n    kotlinVersion = '${version}'`);
      }
      // Update or add kotlin_version (underscore variant)
      if (/kotlin_version\s*=/.test(src)) {
        src = src.replace(
          /kotlin_version\s*=\s*['"'][^'"]*['"']/,
          `kotlin_version = '${version}'`,
        );
      } else {
        src = src.replace(/ext\s*{/, `ext {\n    kotlin_version = '${version}'`);
      }
    }

    cfg.modResults.contents = src;
    return cfg;
  });
};
