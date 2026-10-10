import { Switch, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';

interface Props {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function SwitchRow({ label, hint, value, onChange }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    wrap: { gap: t.space[4] },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  }));
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppText variant="body">{label}</AppText>
        <Switch value={value} onValueChange={onChange} trackColor={{ false: theme.colors.surface2, true: theme.colors.accent }} thumbColor={theme.colors.text} />
      </View>
      {hint ? <AppText variant="small" color="textMuted">{hint}</AppText> : null}
    </View>
  );
}
