import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MenuItem } from '../../hooks/useHomeMenu';
import { useThemedStyles } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { ModalSafeArea } from './ModalSafeArea';
import { PressableScale } from './PressableScale';

interface Props {
  visible: boolean;
  items: readonly MenuItem[];
  onClose: () => void;
}

/** Panel lateral con los módulos de la app (se abre desde la hamburguesa del Home). */
export function MenuDrawer({ visible, items, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <ModalSafeArea>
        <Drawer items={items} onClose={onClose} />
      </ModalSafeArea>
    </Modal>
  );
}

function Drawer({ items, onClose }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row' },
    panel: { width: '78%', maxWidth: 340, backgroundColor: t.colors.bg, borderRightWidth: 1, borderRightColor: t.colors.border, paddingHorizontal: t.space[16], gap: t.space[4] },
    title: { paddingVertical: t.space[16] },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[16], minHeight: 52, paddingHorizontal: t.space[12], borderRadius: t.radius[16] },
    rest: { flex: 1 },
  }));
  return (
      <View style={styles.backdrop}>
        <View style={[styles.panel, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.title}><AppText variant="title">Finly</AppText></View>
          {items.map((item) => (
            <PressableScale
              key={item.key}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={styles.row}
              accessibilityLabel={item.label}
            >
              <Icon name={item.icon} size={22} color="accent" />
              <AppText variant="body">{item.label}</AppText>
            </PressableScale>
          ))}
        </View>
        <Pressable style={styles.rest} onPress={onClose} accessibilityLabel="Cerrar menú" />
      </View>
  );
}
