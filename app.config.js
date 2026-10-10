/**
 * Extiende app.json: registra un alias de Android por cada combinación forma × color del catálogo
 * (src/config/app-icons.json) para poder cambiar el ícono de la app desde Ajustes.
 */
const catalog = require('./src/config/app-icons.json');

const pascal = (id) => id.charAt(0).toUpperCase() + id.slice(1);

function aliases() {
  const out = [];
  for (const shape of catalog.shapes) {
    for (const color of catalog.colors) {
      if (shape.id === catalog.defaultShape && color.id === catalog.defaultColor) continue;
      out.push({
        name: `Icon${shape.id.toUpperCase()}${pascal(color.id)}`,
        android: {
          foregroundImage: `./assets/icons/mark-${shape.id}.png`,
          monochromeImage: `./assets/icons/mark-${shape.id}.png`,
          backgroundColor: color.background,
        },
      });
    }
  }
  return out;
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [...(config.plugins ?? []), ['expo-alternate-app-icons', aliases()]],
});
