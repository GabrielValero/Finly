import type { ReactNode } from 'react';
import { Text, type TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeColorKey } from '../../utils/theme';

export type TextVariant =
  | 'display' | 'balance' | 'title' | 'heading' | 'body' | 'bodyRegular' | 'small' | 'label' | 'amount' | 'amountMid' | 'caption' | 'button';

interface Props {
  variant?: TextVariant;
  color?: ThemeColorKey;
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
  children: ReactNode;
}

/** Texto con la tipografía del diseño (Geist / Geist Mono) y colores semánticos del tema. */
export function AppText({ variant = 'body', color = 'text', align, numberOfLines, children }: Props) {
  const t = useTheme();
  const { sans, mono } = t.font;
  const variants: Record<TextVariant, TextStyle> = {
    display: { fontFamily: mono.bold, fontSize: 52, letterSpacing: -1 },
    balance: { fontFamily: mono.bold, fontSize: 38, letterSpacing: -0.5 },
    title: { fontFamily: sans.bold, fontSize: 28 },
    heading: { fontFamily: sans.medium, fontSize: 17 },
    body: { fontFamily: sans.medium, fontSize: 16 },
    bodyRegular: { fontFamily: sans.regular, fontSize: 15 },
    small: { fontFamily: sans.regular, fontSize: 13 },
    label: { fontFamily: mono.medium, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase' },
    amount: { fontFamily: mono.bold, fontSize: 16 },
    amountMid: { fontFamily: mono.bold, fontSize: 24 },
    caption: { fontFamily: mono.regular, fontSize: 11 },
    button: { fontFamily: sans.bold, fontSize: 17 },
  };
  return (
    <Text numberOfLines={numberOfLines} style={[variants[variant], { color: t.colors[color] }, align ? { textAlign: align } : null]}>
      {children}
    </Text>
  );
}
