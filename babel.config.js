module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle en Expo: las migraciones .sql se incrustan como strings.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
