import { View } from 'react-native';
import { useTheme, useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { IconBadge } from './IconBadge';
import { PressableScale } from './PressableScale';

export interface RowPresupuestoProps {
  icon: string;
  title: string;
  status: string;
  statusColor: 'income' | 'accent' | 'expense' | 'textMuted';
  amounts: string;
  progress: number;
  barColor: 'income' | 'accent' | 'expense' | 'surface2';
  onPress: () => void;
}

export function RowPresupuesto({ icon, title, status, statusColor, amounts, progress, barColor, onPress }: RowPresupuestoProps) {
  const styles = useThemedStyles((t) => ({
    wrap: { gap: t.space[8], paddingVertical: t.space[8] },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[16] },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    right: { maxWidth: '50%' },
    track: { height: 6, borderRadius: 3, backgroundColor: t.colors.surface2, overflow: 'hidden' },
  }));
  const theme = useTheme();
  return (
    <PressableScale onPress={onPress} style={styles.wrap}>
      <View style={styles.row}>
        <IconBadge icon={icon} />
        <View style={styles.texts}>
          <AppText variant="heading" numberOfLines={1}>{title}</AppText>
          <AppText variant="label" color={statusColor} numberOfLines={1}>{status}</AppText>
        </View>
        <View style={styles.right}>
          <AppText variant="amountMid" fit>{amounts}</AppText>
        </View>
      </View>
      <View style={styles.track}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors[barColor], width: `${Math.round(progress * 100)}%` }} />
      </View>
    </PressableScale>
  );
}
