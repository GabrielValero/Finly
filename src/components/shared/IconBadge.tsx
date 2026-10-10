import { View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import type { ThemeColorKey } from '../../utils/theme';
import { Icon } from './Icon';

interface Props {
  icon: string;
  size?: number;
  color?: ThemeColorKey;
}

/** Cuadrado redondeado con ícono (filas de movimiento, cuentas, detalle). */
export function IconBadge({ icon, size = 48, color = 'text' }: Props) {
  const styles = useThemedStyles((t) => ({
    box: { width: size, height: size, borderRadius: t.radius[12], backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
  }));
  return (
    <View style={styles.box}>
      <Icon name={icon} size={Math.round(size * 0.46)} color={color} />
    </View>
  );
}
