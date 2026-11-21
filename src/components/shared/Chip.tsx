import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** `pill`: píldora (etiquetas). `tile`: chip de 34 px con radio 12 para hojas de filtros. */
  shape?: 'pill' | 'tile';
  /** Color de categoría (dato): al estar seleccionado reemplaza al acento como fondo. */
  tint?: string | null;
}

/** Chip seleccionable. */
export function Chip({ label, selected = false, onPress, shape = 'pill', tint = null }: Props) {
  const styles = useThemedStyles((t) => ({
    chip: { paddingHorizontal: t.space[16], height: 36, borderRadius: t.radius.full, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', maxWidth: '100%' },
    tile: { paddingHorizontal: t.space[12], height: 34, borderRadius: t.radius[12], backgroundColor: t.colors.surface2, borderColor: t.colors.surface2 },
    on: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
  }));
  return (
    <PressableScale onPress={onPress} style={[styles.chip, shape === 'tile' ? styles.tile : null, selected ? styles.on : null, selected && tint ? { backgroundColor: tint, borderColor: tint } : null]} accessibilityLabel={label} accessibilityState={{ selected }}>
      <AppText variant="small" color={selected ? 'onAccent' : 'text'} numberOfLines={1}>{label}</AppText>
    </PressableScale>
  );
}
