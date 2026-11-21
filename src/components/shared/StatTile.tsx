import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import type { ThemeColorKey } from '../../utils/theme';
import { AppText } from './AppText';

interface Props {
  label: string;
  value: string;
  tone?: ThemeColorKey;
  /** Segunda línea pequeña (p. ej. el equivalente en la otra moneda). */
  note?: string | null;
}

/** Ficha de dato: etiqueta en mayúsculas y monto, sobre surface2. Van en fila, de a dos. */
export function StatTile({ label, value, tone = 'text', note }: Props) {
  const styles = useThemedStyles((t) => ({
    tile: { flex: 1, minWidth: 0, gap: t.space[4], padding: t.space[12], borderRadius: t.radius[16], backgroundColor: t.colors.surface2 },
  }));
  return (
    <View style={styles.tile}>
      <AppText variant="label" color="textMuted" numberOfLines={1}>{label}</AppText>
      <AppText variant="amount" color={tone} fit>{value}</AppText>
      {note ? <AppText variant="caption" color="textMuted" numberOfLines={1}>{note}</AppText> : null}
    </View>
  );
}
