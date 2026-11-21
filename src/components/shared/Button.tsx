import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { mix } from '../../utils/color';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  onPress: () => void;
  /** `secondary`: relleno surface2. `dangerTint`: texto de gasto sobre fondo teñido de gasto. */
  variant?: 'primary' | 'outline' | 'danger' | 'secondary' | 'dangerTint';
  disabled?: boolean;
  /** Ícono opcional a la izquierda del texto. */
  icon?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled, icon }: Props) {
  const styles = useThemedStyles((t) => ({
    base: { height: 56, borderRadius: t.radius[20], alignItems: 'center', justifyContent: 'center' },
    content: { flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    primary: { backgroundColor: t.colors.accent },
    secondary: { backgroundColor: t.colors.surface2 },
    dangerTint: { backgroundColor: mix(t.colors.surface, t.colors.expense, 0.16) },
    danger: { borderWidth: 1, borderColor: t.colors.expense, backgroundColor: t.colors.bg },
    outline: { borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.bg },
  }));
  const textColor = variant === 'primary' ? 'onAccent' : variant === 'danger' || variant === 'dangerTint' ? 'expense' : 'text';
  return (
    <PressableScale onPress={onPress} disabled={disabled} style={[styles.base, styles[variant], disabled ? { opacity: 0.4 } : null]}>
      <View style={styles.content}>
        {icon ? <Icon name={icon} size={18} color={textColor} /> : null}
        <AppText variant="button" color={textColor}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}
