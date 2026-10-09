import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface Props {
  text: string;
  action: string;
  onPress: () => void;
}

/** Aviso con punto de color y acción (p. ej. tasa desactualizada). */
export function Banner({ text, action, onPress }: Props) {
  const styles = useThemedStyles((t) => ({
    wrap: { height: 44, borderRadius: t.radius[16], backgroundColor: t.colors.surface, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent },
    text: { flex: 1 },
  }));
  return (
    <PressableScale onPress={onPress} style={styles.wrap}>
      <View style={styles.dot} />
      <View style={styles.text}><AppText variant="bodyRegular" numberOfLines={1}>{text}</AppText></View>
      <AppText variant="label" color="accent">{action}</AppText>
    </PressableScale>
  );
}
