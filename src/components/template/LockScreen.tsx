import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from '../shared/AppText';
import { Button } from '../shared/Button';

/** Cubre la app mientras está bloqueada. */
export function LockScreen({ onUnlock, busy }: { onUnlock: () => void; busy: boolean }) {
  const styles = useThemedStyles((t) => ({
    wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center', gap: t.space[16], paddingHorizontal: t.space[24] },
    button: { alignSelf: 'stretch' },
  }));
  return (
    <View style={styles.wrap}>
      <AppText variant="title">Finly</AppText>
      <AppText variant="small" color="textMuted" align="center">Tus finanzas están bloqueadas.</AppText>
      <View style={styles.button}><Button label="Desbloquear" onPress={onUnlock} disabled={busy} /></View>
    </View>
  );
}
