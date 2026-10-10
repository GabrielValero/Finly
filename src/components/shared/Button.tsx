import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled }: Props) {
  const styles = useThemedStyles((t) => ({
    base: { height: 56, borderRadius: t.radius[20], alignItems: 'center', justifyContent: 'center' },
    primary: { backgroundColor: t.colors.accent },
    danger: { borderWidth: 1, borderColor: t.colors.expense, backgroundColor: t.colors.bg },
    outline: { borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.bg },
  }));
  const textColor = variant === 'primary' ? 'onAccent' : variant === 'danger' ? 'expense' : 'text';
  return (
    <PressableScale onPress={onPress} disabled={disabled} style={[styles.base, styles[variant], disabled ? { opacity: 0.4 } : null]}>
      <AppText variant="button" color={textColor}>
        {label}
      </AppText>
    </PressableScale>
  );
}
