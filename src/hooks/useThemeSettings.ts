import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { deriveTheme } from '../utils/theme';
import { useThemeList } from './useTheme';

export function useThemeSettings() {
  const router = useRouter();
  const { seeds, activeId, setThemeId } = useThemeList();
  const items = useMemo(
    () =>
      seeds.map((seed) => {
        const c = deriveTheme(seed).colors;
        return { id: seed.id, name: seed.name, selected: seed.id === activeId, swatches: [c.bg, c.surface2, c.accent, c.income] };
      }),
    [seeds, activeId],
  );
  return { items, select: setThemeId, back: () => router.back() };
}
