import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';

interface Props {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Hoja inferior para selectores y teclados. */
export function SheetModal({ visible, title, onClose, children }: Props) {
  const styles = useThemedStyles((t) => ({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: t.colors.surface, borderTopLeftRadius: t.radius[24], borderTopRightRadius: t.radius[24], padding: t.space[16], paddingBottom: t.space[32], gap: t.space[12], maxHeight: '80%' },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.border },
  }));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          {title ? <AppText variant="label" color="textMuted">{title}</AppText> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
