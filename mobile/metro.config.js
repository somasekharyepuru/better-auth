const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @/* path aliases are configured in tsconfig.json
// Metro automatically reads baseUrl and paths from tsconfig.json

module.exports = config;
