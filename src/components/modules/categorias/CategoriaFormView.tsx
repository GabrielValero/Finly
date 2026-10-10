import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategoryForm } from '../../../hooks/useCategoryForm';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Field } from '../../shared/Field';
import { CATEGORY_ICON_KEYS, Icon } from '../../shared/Icon';
import { IconBadge } from '../../shared/IconBadge';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SelectRow } from '../../shared/SelectRow';
import { SheetModal } from '../../shared/SheetModal';
import { SwitchRow } from '../../shared/SwitchRow';
import { ScreenTemplate } from '../../template/ScreenTemplate';

interface Props {
  id: string;
  kind?: string;
  parentId?: string;
  pick?: string;
}

/** Crear / editar categoría o subcategoría (pantalla 11 del diseño). */
export function CategoriaFormView({ id, kind, parentId, pick }: Props) {
  const vm = useCategoryForm({ id, kind, parentId, pick });
  const insets = useSafeAreaInsets();
  const [parentPicker, setParentPicker] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32] + insets.bottom, gap: t.space[12] },
    preview: { flexDirection: 'row', alignItems: 'center', gap: t.space[16] },
    texts: { flex: 1, gap: t.space[4] },
    icons: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
    iconBtn: { width: 52, height: 52, borderRadius: t.radius[16], backgroundColor: t.colors.surface2, borderWidth: 2, borderColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' },
    iconSelected: { borderColor: t.colors.accent },
    archive: { alignItems: 'center', paddingVertical: t.space[12] },
    center: { padding: t.space[24], alignItems: 'center' },
  }));

  if (vm.notFound) {
    return (
      <ScreenTemplate title="CATEGORÍA" left="close" onLeft={vm.close}>
        <View style={styles.center}><AppText variant="body" color="textMuted">Esta categoría ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title={vm.title} left="close" onLeft={vm.close}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={styles.preview}>
            <IconBadge icon={vm.icon} />
            <View style={styles.texts}>
              <AppText variant="heading" numberOfLines={1}>{vm.previewName}</AppText>
              <AppText variant="caption" color="textMuted" numberOfLines={1}>{vm.previewSub}</AppText>
            </View>
          </View>
        </Card>

        <Field label="NOMBRE" value={vm.name} onChangeText={vm.setName} placeholder="Ej. Restaurantes" maxLength={40} />

        <AppText variant="label" color="textMuted">TIPO</AppText>
        <Segmented options={[{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }]} value={vm.kind} onChange={vm.setKind} disabled={vm.kindLocked} />

        {vm.canNest ? <SelectRow label="DENTRO DE" value={vm.parentLabel} onPress={() => setParentPicker(true)} /> : null}
        <AppText variant="small" color="textMuted">Máximo 2 niveles: una subcategoría no puede tener otras dentro.</AppText>

        <AppText variant="label" color="textMuted">ICONO</AppText>
        <View style={styles.icons}>
          {CATEGORY_ICON_KEYS.map((k) => (
            <PressableScale key={k} onPress={() => vm.setIcon(k)} style={[styles.iconBtn, k === vm.icon ? styles.iconSelected : null]} accessibilityLabel={k}>
              <Icon name={k} size={24} color={k === vm.icon ? 'accent' : 'text'} />
            </PressableScale>
          ))}
        </View>

        <SwitchRow label="No cuenta en reportes" hint="Para movimientos como Préstamos: se guardan, pero no suman a gastos ni ingresos." value={vm.exclude} onChange={vm.setExclude} />

        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
        {vm.canArchive ? (
          <PressableScale onPress={vm.confirmArchive} style={styles.archive}><AppText variant="body" color="expense">Archivar categoría</AppText></PressableScale>
        ) : null}
        <Button label="Guardar" onPress={() => void vm.save()} disabled={!vm.canSave} />
      </ScrollView>

      <SheetModal visible={parentPicker} title="DENTRO DE" onClose={() => setParentPicker(false)}>
        <OptionList
          options={vm.parentOptions}
          selected={vm.parentId ?? ''}
          onSelect={(value) => {
            vm.setParentId(value);
            setParentPicker(false);
          }}
        />
      </SheetModal>
    </ScreenTemplate>
  );
}
