import { View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { mix } from '../../utils/color';
import type { StatusTone } from '../../utils/budgetDisplay';
import { AppText } from './AppText';

/** Insignia de estado: texto en el color semántico sobre un fondo teñido del mismo color. */
export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  const theme = useTheme();
  const background = tone === 'textMuted' ? theme.colors.surface2 : mix(theme.colors.surface, theme.colors[tone], 0.16);
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: theme.space[8], height: 22, borderRadius: theme.radius[8], backgroundColor: background, justifyContent: 'center' }}>
      <AppText variant="label" color={tone} numberOfLines={1}>{label}</AppText>
    </View>
  );
}
