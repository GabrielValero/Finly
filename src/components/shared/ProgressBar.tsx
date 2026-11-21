import { View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { BarTone } from '../../utils/budgetDisplay';

interface Props {
  /** 0..1 */
  value: number;
  color?: BarTone;
  height?: number;
}

/** Barra de progreso de ancho completo. */
export function ProgressBar({ value, color = 'accent', height = 8 }: Props) {
  const theme = useTheme();
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <View style={{ height, borderRadius: theme.radius.full, backgroundColor: theme.colors.surface2, overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View style={{ height, width: `${pct}%`, borderRadius: theme.radius.full, backgroundColor: theme.colors[color] }} />
    </View>
  );
}
