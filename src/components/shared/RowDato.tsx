import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';

interface Props {
  label: string;
  value: string;
  valueColor?: 'text' | 'accent' | 'income' | 'expense';
  last?: boolean;
}

export function RowDato({ label, value, valueColor = 'text', last }: Props) {
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: t.space[12], borderBottomWidth: 1, borderBottomColor: t.colors.border },
    last: { borderBottomWidth: 0 },
    value: { flexShrink: 1, marginLeft: t.space[16] },
  }));
  return (
    <View style={[styles.row, last ? styles.last : null]}>
      <AppText variant="label" color="textMuted">{label}</AppText>
      <View style={styles.value}>
        <AppText variant="body" color={valueColor} align="right" numberOfLines={2}>{value}</AppText>
      </View>
    </View>
  );
}
