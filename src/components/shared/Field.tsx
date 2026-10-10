import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme, useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';

interface Props extends Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'maxLength' | 'autoFocus' | 'keyboardType' | 'returnKeyType' | 'onSubmitEditing' | 'onBlur'> {
  label: string;
  error?: boolean;
}

/** Campo de texto con etiqueta en mayúsculas, dentro de una tarjeta. */
export function Field({ label, error, ...input }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], paddingVertical: t.space[12], gap: t.space[4] },
    boxError: { borderColor: t.colors.expense },
    input: { color: t.colors.text, fontFamily: t.font.sans.medium, fontSize: 16, padding: 0 },
  }));
  return (
    <View style={[styles.box, error ? styles.boxError : null]}>
      <AppText variant="label" color="textMuted">{label}</AppText>
      <TextInput {...input} placeholderTextColor={theme.colors.textMuted} style={styles.input} />
    </View>
  );
}
