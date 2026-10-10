import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { IconBadge } from './IconBadge';
import { PressableScale } from './PressableScale';

export interface RowMovimientoProps {
  icon: string;
  title: string;
  subtitle: string;
  amount: string;
  tone: 'default' | 'income';
  caption: string | null;
  onPress: () => void;
}

export function RowMovimiento({ icon, title, subtitle, amount, tone, caption, onPress }: RowMovimientoProps) {
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[16], paddingVertical: t.space[8] },
    texts: { flex: 1, gap: t.space[4], minWidth: 0 },
    right: { alignItems: 'flex-end', gap: t.space[4], maxWidth: '45%' },
  }));
  return (
    <PressableScale onPress={onPress} style={styles.row}>
      <IconBadge icon={icon} />
      <View style={styles.texts}>
        <AppText variant="heading" numberOfLines={1}>{title}</AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={1}>{subtitle}</AppText>
      </View>
      <View style={styles.right}>
        <AppText variant="amount" color={tone === 'income' ? 'income' : 'text'} fit>{amount}</AppText>
        {caption ? <AppText variant="small" color="textMuted" numberOfLines={1}>{caption}</AppText> : null}
      </View>
    </PressableScale>
  );
}
