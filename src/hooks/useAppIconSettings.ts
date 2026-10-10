import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { applyAppIcon, canChangeAppIcon, currentAppIcon } from '../services/appIcon';
import { ICON_COLORS, ICON_MARK_COLOR, ICON_SHAPES, iconLabel, type IconChoice } from '../utils/appIcons';

/** Etiqueta del ícono activo (para la fila de Ajustes). */
export function useCurrentIconLabel(): string {
  return useMemo(() => iconLabel(currentAppIcon()), []);
}

export function useAppIconSettings() {
  const router = useRouter();
  const [active, setActive] = useState<IconChoice>(() => currentAppIcon());
  const [draft, setDraft] = useState<IconChoice>(active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const background = ICON_COLORS.find((c) => c.id === draft.color)?.background ?? ICON_COLORS[0]!.background;

  const apply = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setApplied(false);
    try {
      await applyAppIcon(draft);
      setActive(draft);
      setApplied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el ícono');
    } finally {
      setBusy(false);
    }
  };

  return {
    supported: canChangeAppIcon,
    shapes: ICON_SHAPES.map((s) => ({ ...s, selected: s.id === draft.shape })),
    colors: ICON_COLORS.map((c) => ({ ...c, selected: c.id === draft.color })),
    markColor: ICON_MARK_COLOR,
    background,
    draft,
    label: iconLabel(draft),
    selectShape: (shape: string) => setDraft((d) => ({ ...d, shape })),
    selectColor: (color: string) => setDraft((d) => ({ ...d, color })),
    canApply: !busy && (draft.shape !== active.shape || draft.color !== active.color),
    busy,
    error,
    applied,
    apply,
    back: () => router.back(),
  };
}
