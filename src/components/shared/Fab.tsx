import { useThemedStyles } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export function Fab({ onPress, label = 'Nuevo movimiento' }: { onPress: () => void; label?: string }) {
  const styles = useThemedStyles((t) => ({
    fab: {
      position: 'absolute', right: t.space[16], bottom: t.space[16], width: 64, height: 64, borderRadius: t.radius.full,
      backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 8,
    },
  }));
  return (
    <PressableScale onPress={onPress} style={styles.fab} accessibilityLabel={label}>
      <Icon name="plus" size={30} color="onAccent" />
    </PressableScale>
  );
}
