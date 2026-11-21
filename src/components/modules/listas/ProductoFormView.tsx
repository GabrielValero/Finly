import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useItemForm } from '../../../hooks/useItemForm';
import { useListRateEditor } from '../../../hooks/useListRate';
import { useThemedStyles } from '../../../hooks/useTheme';
import { UNITS, UNIT_LABEL, type ShopUnit } from '../../../utils/shopping';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { CategoryPickerModal } from '../../shared/CategoryPickerModal';
import { Card } from '../../shared/Card';
import { Chip } from '../../shared/Chip';
import { Field } from '../../shared/Field';
import { Icon } from '../../shared/Icon';
import { IconBadge } from '../../shared/IconBadge';
import { Keypad } from '../../shared/Keypad';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SettingsRow } from '../../shared/SettingsRow';
import { SheetModal } from '../../shared/SheetModal';
import { SwitchRow } from '../../shared/SwitchRow';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { ListRateSheet } from './ListRateSheet';

const UNIT_OPTIONS: { value: ShopUnit; label: string; hint: string }[] = [
  { value: 'und', label: 'Unidades', hint: 'und' },
  { value: 'kg', label: 'Kilogramos', hint: 'kg' },
  { value: 'g', label: 'Gramos', hint: 'g' },
  { value: 'l', label: 'Litros', hint: 'L' },
  { value: 'ml', label: 'Mililitros', hint: 'ml' },
];

export function ProductoFormView({ id, listId }: { id: string; listId: string }) {
  const vm = useItemForm(id, listId);
  const rateEditor = useListRateEditor(listId);
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const [unitSheet, setUnitSheet] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    box: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], paddingVertical: t.space[12], gap: t.space[4] },
    boxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[8] },
    boxHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[8] },
    currency: { width: 120 },
    qtyRow: { flexDirection: 'row', gap: t.space[12], alignItems: 'stretch' },
    qty: { flex: 1, minWidth: 0 },
    unit: { width: 120 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
    flex: { flex: 1, minWidth: 0 },
    more: { alignSelf: 'flex-start', paddingVertical: t.space[8] },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    switchBox: { paddingVertical: t.space[12] },
    undoRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[12], minHeight: 49 },
    divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
    footer: { paddingHorizontal: t.space[16], paddingTop: t.space[8], paddingBottom: t.space[16] + Math.max(insets.bottom, t.space[8]) },
  }));
  if (vm.notFound) {
    return (
      <ScreenTemplate title={vm.title} titleBold left="close" onLeft={vm.close}>
        <View style={styles.scroll}><AppText variant="small" color="textMuted">Este producto ya no existe.</AppText></View>
      </ScreenTemplate>
    );
  }
  const priceTitle = vm.isWish ? `${vm.priceTitle} (objetivo)` : vm.priceTitle;
  const showMore = moreOpen || vm.hasExtras;
  return (
    <ScreenTemplate title={vm.title} titleBold left="close" onLeft={vm.close}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Producto" value={vm.name} onChangeText={vm.setName} placeholder="Ej. Harina PAN" maxLength={80} autoFocus={vm.isNew} />

        <View style={styles.qtyRow}>
          <View style={styles.qty}>
            <Field label="Cantidad" value={vm.quantity} onChangeText={vm.setQuantity} keyboardType="decimal-pad" placeholder="1" maxLength={9} />
          </View>
          <PressableScale onPress={() => setUnitSheet(true)} style={[styles.box, styles.unit]} accessibilityLabel="Cambiar unidad">
            <AppText variant="label" color="textMuted">Unidad</AppText>
            <View style={styles.boxRow}>
              <AppText variant="body">{UNIT_LABEL[vm.unit]}</AppText>
              <Icon name="chevronDown" size={16} color="textMuted" />
            </View>
          </PressableScale>
        </View>

        <View style={styles.box}>
          <View style={styles.boxHead}>
            <View style={styles.flex}><AppText variant="label" color="textMuted" numberOfLines={1}>{priceTitle}</AppText></View>
            <View style={styles.currency}>
              <Segmented small onSurface options={[{ value: 'USD', label: 'USD' }, { value: 'VES', label: 'Bs' }]} value={vm.currency} onChange={vm.setCurrency} />
            </View>
          </View>
          <PressableScale onPress={() => setKeypad(true)} accessibilityLabel="Editar precio">
            <AppText variant="balance" color={vm.price.minor > 0 ? 'text' : 'textMuted'} fit>{vm.priceLabel}</AppText>
          </PressableScale>
        </View>
        {vm.currency === 'VES' ? (
          <PressableScale onPress={rateEditor.openSheet} accessibilityLabel="Cambiar tasa">
            <AppText variant="small" color="textMuted">
              Se convierte a USD con {rateEditor.label}. <AppText variant="label" color="accent">Cambiar tasa</AppText>
            </AppText>
          </PressableScale>
        ) : null}

        <Card style={styles.list}>
          <View style={styles.switchBox}>
            <SwitchRow label="Lleva IVA (16 %)" value={vm.taxable} onChange={vm.setTaxable} />
          </View>
        </Card>
        <AppText variant="small" color="textMuted">El precio que escribes es SIN IVA; si lo activas, se suma el 16 % al total.</AppText>

        {vm.lineTotal ? (
          <Card>
            <AppText variant="label" color="textMuted">Total de la línea</AppText>
            <AppText variant="balance" color="accent" fit>{vm.lineTotal.amount}</AppText>
            {vm.lineTotal.note ? <AppText variant="caption" color="textMuted">{vm.lineTotal.note}</AppText> : null}
          </Card>
        ) : null}

        <PressableScale onPress={() => setPicker(true)} style={styles.box} accessibilityLabel="Elegir categoría">
          <AppText variant="label" color="textMuted">Categoría</AppText>
          <View style={styles.boxRow}>
            {vm.categoryLabel || vm.inheritedLabel ? <IconBadge icon={vm.categoryIcon} size={32} tint={vm.categoryColor} /> : null}
            <View style={styles.flex}>
              <AppText variant="body" color={vm.categoryLabel ? 'text' : 'textMuted'} numberOfLines={1}>
                {vm.categoryLabel ?? (vm.inheritedLabel ? `Hereda: ${vm.inheritedLabel}` : 'Hereda la de la lista')}
              </AppText>
            </View>
            <Icon name="chevronRight" size={18} color="textMuted" />
          </View>
        </PressableScale>

        {showMore ? (
          <>
            {vm.isWish ? (
              <>
                <AppText variant="label" color="textMuted">Prioridad (opcional)</AppText>
                <View style={styles.chips}>
                  {([['high', 'Alta'], ['medium', 'Media'], ['low', 'Baja']] as const).map(([value, label]) => (
                    <Chip key={value} label={label} shape="tile" selected={vm.priority === value} onPress={() => vm.setPriority(vm.priority === value ? null : value)} />
                  ))}
                </View>
              </>
            ) : null}
            <Field label="Nota (opcional)" value={vm.note} onChangeText={vm.setNote} placeholder="Marca, tienda, enlace…" maxLength={200} />
          </>
        ) : (
          <PressableScale onPress={() => setMoreOpen(true)} style={styles.more} accessibilityLabel="Mostrar más opciones">
            <AppText variant="label" color="accent">{vm.isWish ? '+ Prioridad y nota' : '+ Nota'}</AppText>
          </PressableScale>
        )}

        {vm.isPurchased || !vm.isNew ? (
          <Card style={styles.list}>
            {vm.isPurchased ? (
              <PressableScale onPress={vm.confirmUndo} style={[styles.undoRow, styles.divider]} accessibilityLabel="Deshacer compra">
                <Icon name="undo" size={18} color="accent" />
                <AppText variant="bodyRegular" color="accent">Deshacer compra</AppText>
              </PressableScale>
            ) : null}
            {!vm.isNew ? <SettingsRow label="Quitar de la lista" danger onPress={vm.confirmDelete} last /> : null}
          </Card>
        ) : null}
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
      <SheetModal visible={unitSheet} title="UNIDAD DE MEDIDA" onClose={() => setUnitSheet(false)}>
        <OptionList
          options={UNIT_OPTIONS.filter((o) => UNITS.includes(o.value))}
          selected={vm.unit}
          onSelect={(u) => {
            vm.setUnit(u as ShopUnit);
            setUnitSheet(false);
          }}
        />
      </SheetModal>
      <ListRateSheet editor={rateEditor} />
      <SheetModal visible={keypad} title={priceTitle.toUpperCase()} onClose={() => setKeypad(false)}>
        <Segmented options={[{ value: 'USD', label: 'USD' }, { value: 'VES', label: 'Bs' }]} value={vm.currency} onChange={vm.setCurrency} onSurface />
        <AppText variant="display" align="center">{vm.price.display}</AppText>
        <Keypad onKey={vm.price.press} />
        <Button label="Listo" onPress={() => setKeypad(false)} />
      </SheetModal>
    </ScreenTemplate>
  );
}
