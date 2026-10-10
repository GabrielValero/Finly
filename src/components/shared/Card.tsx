import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';

interface Props {
  children: ReactNode;
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, highlight, style }: Props) {
  const styles = useThemedStyles((t) => ({
    card: { backgroundColor: t.colors.surface, borderRadius: t.radius[24], borderWidth: 1, borderColor: t.colors.border, padding: t.space[20] },
    highlight: { borderColor: t.colors.accent },
  }));
  return <View style={[styles.card, highlight ? styles.highlight : null, style]}>{children}</View>;
}
