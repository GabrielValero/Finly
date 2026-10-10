import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface Props<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/** Selector segmentado (Bs | USD, USD | VES). */
export function Segmented<T extends string>({ options, value, onChange, disabled }: Props<T>) {
  const styles = useThemedStyles((t) => ({
    track: { flexDirection: 'row', backgroundColor: t.colors.surface, borderRadius: t.radius.full, padding: t.space[4] },
    item: { flex: 1, height: 40, borderRadius: t.radius.full, alignItems: 'center', justifyContent: 'center' },
    active: { backgroundColor: t.colors.accent },
  }));
  return (
    <View style={styles.track}>
      {options.map((o) => (
        <PressableScale key={o.value} disabled={disabled} onPress={() => onChange(o.value)} style={[styles.item, o.value === value ? styles.active : null]}>
          <AppText variant="label" color={o.value === value ? 'onAccent' : 'textMuted'}>
            {o.label}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}
