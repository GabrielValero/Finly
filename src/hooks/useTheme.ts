import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { themeSeedSchema } from '../schemas/theme';
import { usePreferences } from '../store/preferences';
import { BUILTIN_SEEDS, resolveTheme, type ResolvedTheme, type ThemeSeed } from '../utils/theme';

function validCustomSeeds(raw: readonly ThemeSeed[]): ThemeSeed[] {
  return raw.flatMap((s) => {
    const parsed = themeSeedSchema.safeParse(s);
    return parsed.success ? [parsed.data as ThemeSeed] : [];
  });
}

/** Tema activo. Se actualiza solo al cambiar la preferencia. */
export function useTheme(): ResolvedTheme {
  const themeId = usePreferences((s) => s.themeId);
  const custom = usePreferences((s) => s.customThemes);
  return useMemo(() => resolveTheme(themeId, validCustomSeeds(custom)), [themeId, custom]);
}

/** Estilos dependientes del tema; se recalculan solo cuando cambia el tema. */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: ResolvedTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}

/** Lista para el selector de temas. */
export function useThemeList() {
  const custom = usePreferences((s) => s.customThemes);
  const activeId = usePreferences((s) => s.themeId);
  const setThemeId = usePreferences((s) => s.setThemeId);
  const seeds = useMemo(() => [...BUILTIN_SEEDS, ...validCustomSeeds(custom)], [custom]);
  return { seeds, activeId, setThemeId };
}
