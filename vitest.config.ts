import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node', server: { deps: { inline: ['drizzle-orm'] } } },
  resolve: {
    // El driver real de Drizzle para Expo corre en tests sobre node:sqlite.
    alias: { 'expo-sqlite': fileURLToPath(new URL('./tests/helpers/expo-sqlite-shim.ts', import.meta.url)) },
  },
});
