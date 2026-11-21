import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import type { BarTone, StatusTone } from '../../utils/budgetDisplay';
import { AppText } from './AppText';
import { IconBadge } from './IconBadge';
import { PressableScale } from './PressableScale';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';

export interface RowPresupuestoProps {
  icon: string;
  /** Color de la categoría (dato) para teñir el ícono. */
  color?: string | null;
  title: string;
  status: string;
  statusColor: StatusTone;
  amounts: string;
  progress: number;
  barColor: BarTone;
  onPress: () => void;
}

/** Partida del presupuesto: ícono, nombre, insignia de estado, "$real / $plan" y barra de ancho completo. */
export function RowPresupuesto({ icon, color = null, title, status, statusColor, amounts, progress, barColor, onPress }: RowPresupuestoProps) {
  const styles = useThemedStyles((t) => ({
    wrap: { gap: t.space[12], paddingVertical: t.space[12] },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[12] },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    right: { maxWidth: '50%' },
  }));
  return (
    <PressableScale onPress={onPress} style={styles.wrap}>
      <View style={styles.row}>
        <IconBadge icon={icon} size={40} tint={color} />
        <View style={styles.texts}>
          <AppText variant="heading" numberOfLines={1}>{title}</AppText>
          <StatusBadge label={status} tone={statusColor} />
        </View>
        <View style={styles.right}>
          <AppText variant="amount" fit>{amounts}</AppText>
        </View>
      </View>
      <ProgressBar value={progress} color={barColor} height={6} />
    </PressableScale>
  );
}
