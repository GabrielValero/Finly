import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme, useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';

interface Props extends Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'maxLength' | 'autoFocus' | 'keyboardType' | 'returnKeyType' | 'onSubmitEditing' | 'onBlur' | 'onFocus'> {
  label: string;
  error?: boolean;
}

/** Campo de texto con etiqueta en mayúsculas, dentro de una tarjeta. */
export function Field({ label, error, onFocus, onBlur, ...input }: Props) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useThemedStyles((t) => ({
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], paddingVertical: t.space[12], gap: t.space[4] },
    boxFocus: { borderColor: t.colors.accent },
    boxError: { borderColor: t.colors.expense },
    input: { color: t.colors.text, fontFamily: t.font.sans.medium, fontSize: 16, padding: 0 },
  }));
  return (
    <View style={[styles.box, focused ? styles.boxFocus : null, error ? styles.boxError : null]}>
      <AppText variant="label" color="textMuted">{label}</AppText>
      <TextInput
        {...input}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={theme.colors.textMuted} style={styles.input} />
    </View>
  );
}
