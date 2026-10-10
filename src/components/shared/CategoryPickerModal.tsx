import { Modal, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategoryPicker } from '../../hooks/useCategoryPicker';
import { useTheme, useThemedStyles } from '../../hooks/useTheme';
import type { PickerCategory, PickerRow } from '../../utils/categoryPicker';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { IconBadge } from './IconBadge';
import { PressableScale } from './PressableScale';

interface Props {
  visible: boolean;
  categories: readonly PickerCategory[];
  selectedId: string | null;
  /** Categorías que se ven pero no se pueden elegir (p. ej. ya planificadas). */
  disabledIds?: readonly string[];
  disabledHint?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** Si se pasa, aparece "Sin categoría" para quitar la elegida. */
  onClear?: () => void;
  /** Botón "+" del encabezado: nueva categoría. */
  onNew: () => void;
  /** Fila "+ Nueva subcategoría" de un grupo abierto. */
  onNewSub: (parentId: string) => void;
}

/** Selector de categorías a pantalla completa: búsqueda, grupos que se abren y alta de categorías/subcategorías. */
export function CategoryPickerModal({ visible, ...rest }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={rest.onClose} statusBarTranslucent>
      {visible ? <PickerBody {...rest} /> : null}
    </Modal>
  );
}

function Radio({ selected }: { selected: boolean }) {
  const styles = useThemedStyles((t) => ({
    ring: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' },
    on: { borderColor: t.colors.accent, backgroundColor: t.colors.accent },
  }));
  return <View style={[styles.ring, selected ? styles.on : null]}>{selected ? <Icon name="check" size={14} color="onAccent" /> : null}</View>;
}

function PickerBody({ categories, selectedId, disabledIds, disabledHint, onSelect, onClear, onClose, onNew, onNewSub }: Omit<Props, 'visible'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const vm = useCategoryPicker({ categories, selectedId, disabledIds });
  const styles = useThemedStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top },
    header: { height: 56, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    round: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    add: { backgroundColor: t.colors.accent },
    search: { marginHorizontal: t.space[16], marginBottom: t.space[12], height: 48, borderRadius: t.radius.full, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], flexDirection: 'row', alignItems: 'center', gap: t.space[8] },
    input: { flex: 1, color: t.colors.text, fontFamily: t.font.sans.medium, fontSize: 16, padding: 0 },
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32] + insets.bottom, gap: t.space[12] },
    card: { paddingHorizontal: t.space[16], paddingVertical: t.space[4] },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.space[16], paddingVertical: t.space[12] },
    inner: { flexDirection: 'row', alignItems: 'center', gap: t.space[16] },
    child: { paddingLeft: t.space[32] },
    texts: { flex: 1, minWidth: 0, gap: 2 },
    chevron: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, backgroundColor: t.colors.border },
    addSub: { flexDirection: 'row', alignItems: 'center', gap: t.space[8], paddingVertical: t.space[12], paddingLeft: t.space[32] + t.space[8] },
    empty: { alignItems: 'center', gap: t.space[16], paddingVertical: t.space[32] },
    disabled: { opacity: 0.4 },
    clear: { alignSelf: 'flex-start', paddingVertical: t.space[4] },
  }));

  // El separador arranca donde empieza el texto de la fila (como en el diseño de referencia).
  const dividerInset = (row: PickerRow) => (row.type === 'child' ? 32 + 36 + 16 : row.type === 'addSub' ? 32 + 8 : 44 + 16);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <PressableScale onPress={onClose} style={styles.round} accessibilityLabel="Cerrar">
          <Icon name="close" size={20} />
        </PressableScale>
        <AppText variant="heading">Categoría</AppText>
        <PressableScale onPress={onNew} style={[styles.round, styles.add]} accessibilityLabel="Nueva categoría">
          <Icon name="plus" size={20} color="onAccent" />
        </PressableScale>
      </View>

      <View style={styles.search}>
        <Icon name="search" size={18} color="textMuted" />
        <TextInput
          value={vm.query}
          onChangeText={vm.setQuery}
          placeholder="Buscar categoría"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
        />
        {vm.searching ? (
          <PressableScale onPress={() => vm.setQuery('')} accessibilityLabel="Borrar búsqueda">
            <Icon name="close" size={18} color="textMuted" />
          </PressableScale>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {onClear && selectedId ? (
          <PressableScale onPress={onClear} style={styles.clear} accessibilityLabel="Quitar categoría">
            <AppText variant="small" color="expense">Quitar categoría</AppText>
          </PressableScale>
        ) : null}
        {vm.rows.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="small" color="textMuted" align="center">{vm.searching ? `Sin resultados para “${vm.query.trim()}”` : 'Aún no hay categorías de este tipo'}</AppText>
            <Button label="Crear categoría" variant="outline" onPress={onNew} />
          </View>
        ) : (
          <Card style={styles.card}>
            {vm.rows.map((row, i) => {
              const divider = i > 0 ? <View style={[styles.divider, { marginLeft: dividerInset(row) }]} /> : null;
              if (row.type === 'addSub') {
                return (
                  <View key={`add-${row.parentId}`}>
                    {divider}
                    <PressableScale onPress={() => onNewSub(row.parentId)} style={styles.addSub} accessibilityLabel={`Nueva subcategoría en ${row.parentName}`}>
                      <Icon name="plus" size={16} color="accent" />
                      <AppText variant="small" color="accent" numberOfLines={1}>Nueva subcategoría en {row.parentName}</AppText>
                    </PressableScale>
                  </View>
                );
              }
              const isChild = row.type === 'child';
              return (
                <View key={row.id}>
                  {divider}
                  <View style={[styles.row, isChild ? styles.child : null, row.disabled ? styles.disabled : null]}>
                    <PressableScale onPress={() => (row.disabled ? undefined : onSelect(row.id))} style={styles.texts} accessibilityLabel={row.name}>
                      <View style={styles.inner}>
                        <IconBadge icon={row.icon} size={isChild ? 36 : 44} />
                        <View style={styles.texts}>
                          <AppText variant="heading" numberOfLines={1}>{row.name}</AppText>
                          {row.disabled && disabledHint ? <AppText variant="caption" color="textMuted">{disabledHint}</AppText> : null}
                        </View>
                      </View>
                    </PressableScale>
                    {row.type === 'parent' && row.expandable ? (
                      <PressableScale onPress={() => vm.toggle(row.id)} style={styles.chevron} accessibilityLabel={row.expanded ? `Cerrar ${row.name}` : `Abrir ${row.name}`}>
                        <Icon name={row.expanded ? 'chevronUp' : 'chevronDown'} size={20} color="textMuted" />
                      </PressableScale>
                    ) : null}
                    <Radio selected={row.selected} />
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
