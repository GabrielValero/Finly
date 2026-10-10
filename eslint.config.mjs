import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const forbiddenInPure = [
  { group: ['react', 'react-native', 'react-native/*', 'expo', 'expo-*', 'expo/*'], message: 'utils/ y schemas/ deben ser TS puro.' },
  { group: ['drizzle-orm', 'drizzle-orm/*', '**/data/**', '**/hooks/**', '**/components/**', '**/store/**'], message: 'utils/ y schemas/ no dependen de BD, hooks, UI ni store.' },
];

export default tseslint.config(
  { ignores: ['babel.config.js', 'metro.config.js', 'app.config.js', 'scripts', 'node_modules', 'drizzle', '.expo', 'dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/utils/**/*.ts', 'src/schemas/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: forbiddenInPure }] },
  },
  {
    // Capas: los componentes solo hablan con hooks, nunca con utils de negocio ni con la BD.
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['**/data/**', 'drizzle-orm', 'drizzle-orm/*', 'expo-sqlite'], message: 'Los componentes acceden a datos solo vía hooks.' }],
      }],
    },
  },
  {
    // Temas: ningún color hexadecimal fuera de utils/theme.ts. Los componentes usan roles semánticos.
    files: ['src/components/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}', 'App.tsx'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
        message: 'Nada de colores hex en la UI: usa theme.colors.* (ver utils/theme.ts).',
      }],
    },
  },
);
