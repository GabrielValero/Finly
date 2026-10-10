import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

/** Píldora seleccionable (etiquetas). */
export function Chip({ label, selected = false, onPress }: Props) {
  const styles = useThemedStyles((t) => ({
    chip: { paddingHorizontal: t.space[16], height: 36, borderRadius: t.radius.full, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' },
    on: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
  }));
  return (
    <PressableScale onPress={onPress} style={[styles.chip, selected ? styles.on : null]} accessibilityLabel={label}>
      <AppText variant="small" color={selected ? 'onAccent' : 'text'}>{label}</AppText>
    </PressableScale>
  );
}
