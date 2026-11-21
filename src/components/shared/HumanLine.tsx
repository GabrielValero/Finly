import { Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Segment } from '../../utils/humanVoice';
import { AppText, type TextVariant } from './AppText';
import type { ThemeColorKey } from '../../utils/theme';

interface Props {
  segments: readonly Segment[];
  variant?: TextVariant;
  color?: ThemeColorKey;
  numberOfLines?: number;
}

/** Frase en "voz humana": el dato clave en negrita y, si toca, con color semántico. */
export function HumanLine({ segments, variant = 'heading', color = 'text', numberOfLines }: Props) {
  const theme = useTheme();
  return (
    <AppText variant={variant} color={color} numberOfLines={numberOfLines}>
      {segments.map((s, i) => (
        <Text
          key={i}
          style={[s.bold ? { fontFamily: theme.font.sans.bold } : null, s.tone ? { color: theme.colors[s.tone] } : null]}
        >
          {s.text}
        </Text>
      ))}
    </AppText>
  );
}
