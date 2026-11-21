import type { ReactNode } from 'react';
import { Pressable, type AccessibilityRole, type AccessibilityState, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  children: ReactNode;
}

/** Pressable con feedback de opacidad al tocar. */
export function PressableScale({ onPress, disabled, style, accessibilityLabel, accessibilityRole = 'button', accessibilityState, children }: Props) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [style, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}
    >
      {children}
    </Pressable>
  );
}
