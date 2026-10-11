import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useItemForm } from '../../../hooks/useItemForm';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { CategoryPickerModal } from '../../shared/CategoryPickerModal';
import { Card } from '../../shared/Card';
import { Field } from '../../shared/Field';
import { Icon } from '../../shared/Icon';
import { Keypad } from '../../shared/Keypad';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SettingsRow } from '../../shared/SettingsRow';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function ProductoFormView({ id, listId }: { id: string; listId: string }) {
  const vm = useItemForm(id, listId);
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], paddingVertical: t.space[12], gap: t.space[4] },
    boxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[8] },
    flex: { flex: 1, minWidth: 0 },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    footer: { paddingHorizontal: t.space[16], paddingBottom: t.space[16] + insets.bottom },
  }));
  if (vm.notFound) {
    return (
      <ScreenTemplate title={vm.title} left="close" onLeft={vm.close}>
        <View style={styles.scroll}><AppText variant="small" color="textMuted">Este producto ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }
  const priceTitle = vm.isWish ? 'Precio objetivo (por unidad)' : 'Precio (por unidad)';
  return (
    <ScreenTemplate title={vm.title} left="close" onLeft={vm.close}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Producto" value={vm.name} onChangeText={vm.setName} placeholder="Ej. Harina PAN" maxLength={80} autoFocus={vm.isNew} />
        <Field label="Cantidad" value={vm.quantity} onChangeText={vm.setQuantity} keyboardType="decimal-pad" placeholder="1" maxLength={9} />

        <AppText variant="label" color="textMuted">Moneda del precio</AppText>
        <Segmented options={[{ value: 'USD', label: 'USD' }, { value: 'VES', label: 'Bs' }]} value={vm.currency} onChange={vm.setCurrency} />
        <PressableScale onPress={() => setKeypad(true)} style={styles.box}>
          <AppText variant="label" color="textMuted">{priceTitle}</AppText>
          <AppText variant="heading">{vm.priceLabel}</AppText>
        </PressableScale>
        {vm.currency === 'VES' ? <AppText variant="small" color="textMuted">El total de la lista siempre se muestra en USD, convertido con la tasa de la lista.</AppText> : null}

        <PressableScale onPress={() => setPicker(true)} style={styles.box}>
          <AppText variant="label" color="textMuted">Categoría</AppText>
          <View style={styles.boxRow}>
            <View style={styles.flex}>
              <AppText variant="body" color={vm.categoryLabel ? 'text' : 'textMuted'} numberOfLines={1}>
                {vm.categoryLabel ?? (vm.inheritedLabel ? `Hereda: ${vm.inheritedLabel}` : 'Hereda la de la lista')}
              </AppText>
            </View>
            <Icon name="chevronRight" size={18} color="textMuted" />
          </View>
        </PressableScale>

        {vm.isWish ? (
          <>
            <AppText variant="label" color="textMuted">Prioridad</AppText>
            <Segmented
              options={[{ value: 'high', label: 'Alta' }, { value: 'medium', label: 'Media' }, { value: 'low', label: 'Baja' }]}
              value={vm.priority ?? 'medium'}
              onChange={vm.setPriority}
            />
          </>
        ) : null}
        <Field label="Nota (opcional)" value={vm.note} onChangeText={vm.setNote} placeholder="Marca, tienda, enlace…" maxLength={200} />

        {!vm.isNew ? <Card style={styles.list}><SettingsRow label="Quitar de la lista" danger onPress={vm.confirmDelete} last /></Card> : null}
        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}><Button label="Guardar" onPress={() => void vm.save()} disabled={!vm.canSave} /></View>

      <CategoryPickerModal
        visible={picker}
        categories={vm.pickerCategories}
        selectedId={vm.categoryId}
        onClear={() => {
          vm.clearCategory();
          setPicker(false);
        }}
        onSelect={(c) => {
          vm.selectCategory(c);
          setPicker(false);
        }}
        onClose={() => setPicker(false)}
        onNew={() => {
          setPicker(false);
          vm.openNewCategory();
        }}
        onNewSub={(parentId) => {
          setPicker(false);
          vm.openNewSubcategory(parentId);
        }}
      />
      <SheetModal visible={keypad} title={`${priceTitle.toUpperCase()} · ${vm.currency === 'USD' ? 'USD' : 'BS'}`} onClose={() => setKeypad(false)}>
        <AppText variant="display" align="center">{vm.price.display}</AppText>
        <Keypad onKey={vm.price.press} />
        <Button label="Listo" onPress={() => setKeypad(false)} />
      </SheetModal>
    </ScreenTemplate>
  );
}
