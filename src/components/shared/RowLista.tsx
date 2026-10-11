import { View } from 'react-native';
import { useTheme, useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface Props {
  title: string;
  kindLabel: string;
  subtitle: string;
  amount: string;
  progress: number;
  state: 'none' | 'ok' | 'near' | 'over';
  showBar: boolean;
  onPress: () => void;
}

/** Fila de una lista de compras: nombre, tipo, pendientes y total en USD (con barra si tiene límite). */
export function RowLista({ title, kindLabel, subtitle, amount, progress, state, showBar, onPress }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    wrap: { gap: t.space[8], paddingVertical: t.space[12], paddingHorizontal: t.space[16], backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[12] },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    right: { maxWidth: '45%' },
    track: { height: 6, borderRadius: 3, backgroundColor: t.colors.surface2, overflow: 'hidden' },
  }));
  const bar = state === 'over' ? theme.colors.expense : state === 'near' ? theme.colors.accent : theme.colors.income;
  return (
    <PressableScale onPress={onPress} style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.texts}>
          <AppText variant="heading" numberOfLines={1}>{title}</AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>{kindLabel} · {subtitle}</AppText>
        </View>
        {amount ? <View style={styles.right}><AppText variant="amountMid" fit>{amount}</AppText></View> : null}
      </View>
      {showBar ? (
        <View style={styles.track}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: bar, width: `${Math.round(progress * 100)}%` }} />
        </View>
      ) : null}
    </PressableScale>
  );
}
