const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // Ensure the app directory is recognized as the project root for expo-router
  config.projectRoot = __dirname;

  return config;
})();