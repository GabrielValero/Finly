import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}

/** Fila de ajustes: etiqueta, valor a la derecha y chevron cuando es navegable. */
export function SettingsRow({ label, value, onPress, danger, last }: Props) {
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[12], minHeight: 49, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    last: { borderBottomWidth: 0 },
    label: { flex: 1, minWidth: 0 },
    value: { flexShrink: 1, maxWidth: '55%' },
  }));
  const content = (
    <>
      <View style={styles.label}><AppText variant="bodyRegular" color={danger ? 'expense' : 'text'} numberOfLines={1}>{label}</AppText></View>
      {value ? <View style={styles.value}><AppText variant="caption" color="textMuted" numberOfLines={1} align="right">{value}</AppText></View> : null}
      {onPress ? <Icon name="chevronRight" size={18} color="textMuted" /> : null}
    </>
  );
  if (!onPress) return <View style={[styles.row, last ? styles.last : null]}>{content}</View>;
  return <PressableScale onPress={onPress} style={[styles.row, last ? styles.last : null]}>{content}</PressableScale>;
}
