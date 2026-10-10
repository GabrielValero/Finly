import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, icon, selected, onPress }: Props) {
  const styles = useThemedStyles((t) => ({
    wrap: { width: 52, alignItems: 'center', gap: t.space[4] },
    box: { width: 52, height: 52, borderRadius: t.radius[16], backgroundColor: t.colors.surface2, borderWidth: 2, borderColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    boxSelected: { borderColor: t.colors.accent },
  }));
  return (
    <PressableScale onPress={onPress} style={styles.wrap} accessibilityLabel={label}>
      <View style={[styles.box, selected ? styles.boxSelected : null]}>
        <Icon name={icon} size={24} color={selected ? 'accent' : 'text'} />
      </View>
      <AppText variant="small" color={selected ? 'accent' : 'textMuted'} numberOfLines={1}>
        {label}
      </AppText>
    </PressableScale>
  );
}
