import { View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { mix } from '../../utils/color';
import type { ThemeColorKey } from '../../utils/theme';
import { Icon } from './Icon';

interface Props {
  icon: string;
  size?: number;
  color?: ThemeColorKey;
  /** Color de categoría (dato): tiñe el cuadrado y el ícono. */
  tint?: string | null;
}

/** Cuadrado redondeado con ícono (filas de movimiento, cuentas, detalle). */
export function IconBadge({ icon, size = 48, color = 'text', tint = null }: Props) {
  const t = useTheme();
  const background = tint ? mix(t.colors.surface, tint, 0.18) : t.colors.surface2;
  return (
    <View style={{ width: size, height: size, borderRadius: t.radius[12], backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={Math.round(size * 0.46)} color={color} tint={tint} />
    </View>
  );
}
