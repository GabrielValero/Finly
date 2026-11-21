import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

/** Píldora con el mes y una flecha que abre el selector de mes. */
export function MonthPill({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useThemedStyles((t) => ({
    pill: { height: 32, paddingHorizontal: t.space[12], borderRadius: t.radius.full, backgroundColor: t.colors.surface, flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
  }));
  return (
    <PressableScale onPress={onPress} style={styles.pill} accessibilityLabel="Cambiar de mes">
      <AppText variant="label">{label}</AppText>
      <Icon name="chevronDown" size={16} color="textMuted" />
    </PressableScale>
  );
}
