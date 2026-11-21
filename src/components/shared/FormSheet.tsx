import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Pantalla de captura (movimiento / transferencia): botón de cerrar, título y una hoja con asa que ocupa el resto. Va dentro de `ScreenTemplate` (que aporta fondo y safe area superior). */
export function FormSheet({ title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    root: { flex: 1 },
    header: { height: 56, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    round: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    spacer: { width: 40 },
    sheet: {
      flex: 1,
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: t.radius[24],
      borderTopRightRadius: t.radius[24],
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: t.colors.border,
      paddingHorizontal: t.space[16],
      paddingTop: t.space[8],
      paddingBottom: insets.bottom + t.space[8],
      gap: t.space[12],
    },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.border },
  }));
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <PressableScale onPress={onClose} style={styles.round} accessibilityLabel="Cerrar">
          <Icon name="close" size={20} />
        </PressableScale>
        <AppText variant="subtitle">{title}</AppText>
        <View style={styles.spacer} />
      </View>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {children}
      </View>
    </View>
  );
}
