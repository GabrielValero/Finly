import { contrastRatio, mix, readableOn } from './color';

/**
 * Sistema de temas (estilo VS Code).
 *
 *   semilla (pocos colores) ──deriveTheme──▶ Theme (todos los roles semánticos)
 *
 * Reglas:
 * - Los componentes SOLO usan roles semánticos (`colors.surface`, `colors.accent`…), nunca hex.
 * - Un tema de usuario se guarda como semilla (+ overrides opcionales): compacto y editable.
 * - Espaciado, radios y tipografía son tokens fijos por ahora; viven aquí para poder
 *   volverlos tematizables sin tocar componentes.
 */

export const THEME_COLOR_KEYS = [
  'bg',
  'surface',
  'surface2',
  'border',
  'text',
  'textMuted',
  'accent',
  'onAccent',
  'income',
  'expense',
  'warning',
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];
export type ThemeColors = Record<ThemeColorKey, string>;
export type ThemeKind = 'dark' | 'light';

export interface ThemeSeed {
  id: string;
  name: string;
  kind: ThemeKind;
  bg: string;
  text: string;
  accent: string;
  income: string;
  expense: string;
  warning: string;
  /** Ajustes finos de cualquier rol derivado. */
  overrides?: Partial<ThemeColors>;
}

export interface Theme {
  id: string;
  name: string;
  kind: ThemeKind;
  colors: ThemeColors;
}

export const TOKENS = {
  space: { 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32 },
  radius: { 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, full: 999 },
  /** Nombres de familia tal como los registra expo-font (ver hooks/useAppFonts). */
  font: {
    sans: { regular: 'Geist_400Regular', medium: 'Geist_500Medium', bold: 'Geist_700Bold' },
    mono: { regular: 'GeistMono_400Regular', medium: 'GeistMono_500Medium', bold: 'GeistMono_700Bold' },
  },
} as const;

export type Tokens = typeof TOKENS;
/** Lo que reciben los componentes: colores del tema activo + tokens fijos. */
export type ResolvedTheme = Theme & Tokens;

export function deriveTheme(seed: ThemeSeed): Theme {
  const { bg, text, accent } = seed;
  const derived: ThemeColors = {
    bg,
    surface: mix(bg, text, 0.045),
    surface2: mix(bg, text, 0.085),
    border: mix(bg, text, 0.145),
    text,
    textMuted: mix(bg, text, 0.62),
    accent,
    onAccent: readableOn(accent, bg, text),
    income: seed.income,
    expense: seed.expense,
    warning: seed.warning,
  };
  return { id: seed.id, name: seed.name, kind: seed.kind, colors: { ...derived, ...seed.overrides } };
}

export interface ThemeIssue {
  role: string;
  ratio: number;
  min: number;
}

/** Comprobaciones mínimas de legibilidad (WCAG). Lista vacía = tema usable. */
export function validateTheme(theme: Theme): ThemeIssue[] {
  const c = theme.colors;
  const checks: [string, string, string, number][] = [
    ['text/bg', c.text, c.bg, 4.5],
    ['text/surface', c.text, c.surface, 4.5],
    ['textMuted/bg', c.textMuted, c.bg, 4.5],
    ['onAccent/accent', c.onAccent, c.accent, 4.5],
    ['accent/bg', c.accent, c.bg, 3],
    ['income/bg', c.income, c.bg, 3],
    ['expense/bg', c.expense, c.bg, 3],
    ['warning/bg', c.warning, c.bg, 3],
  ];
  return checks.flatMap(([role, fg, bg, min]) => {
    const ratio = contrastRatio(fg, bg);
    return ratio < min ? [{ role, ratio: Math.round(ratio * 100) / 100, min }] : [];
  });
}

export const finlyDark: ThemeSeed = {
  id: 'finly-dark',
  name: 'Finly Oscuro',
  kind: 'dark',
  bg: '#0A0A0B',
  text: '#F5F5F6',
  accent: '#FF6B2C',
  income: '#B8F34A',
  expense: '#FF6B6B',
  warning: '#FFC247',
  // Valores exactos del diseño en Figma.
  overrides: { surface: '#141416', surface2: '#1D1D21', border: '#2B2B31', textMuted: '#9A9AA3', onAccent: '#0A0A0B' },
};

export const finlyLight: ThemeSeed = {
  id: 'finly-light',
  name: 'Finly Claro',
  kind: 'light',
  bg: '#F5F5F6',
  text: '#0F0F12',
  accent: '#E04E0B',
  income: '#3B7D00',
  expense: '#D12F2F',
  warning: '#9A5B00',
  overrides: { surface: '#FFFFFF' },
};

export const BUILTIN_SEEDS: readonly ThemeSeed[] = [finlyDark, finlyLight];
export const DEFAULT_THEME_ID = finlyDark.id;

/** Resuelve un id a un tema listo para usar; si no existe, cae al tema por defecto. */
export function resolveTheme(id: string, customSeeds: readonly ThemeSeed[] = []): ResolvedTheme {
  const seed =
    customSeeds.find((s) => s.id === id) ??
    BUILTIN_SEEDS.find((s) => s.id === id) ??
    finlyDark;
  return { ...deriveTheme(seed), ...TOKENS };
}
