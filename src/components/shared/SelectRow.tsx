import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  value: string;
  onPress: () => void;
}

export function SelectRow({ label, value, onPress }: Props) {
  const styles = useThemedStyles((t) => ({
    row: { height: 56, borderRadius: t.radius[16], backgroundColor: t.colors.surface, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    right: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
  }));
  return (
    <PressableScale onPress={onPress} style={styles.row}>
      <AppText variant="label" color="textMuted">{label}</AppText>
      <View style={styles.right}>
        <AppText variant="heading">{value}</AppText>
        <Icon name="chevronDown" size={18} color="textMuted" />
      </View>
    </PressableScale>
  );
}
