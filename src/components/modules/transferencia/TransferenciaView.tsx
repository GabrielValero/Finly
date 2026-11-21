import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTransferForm } from '../../../hooks/useTransferForm';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { CategoryPickerModal } from '../../shared/CategoryPickerModal';
import { Chip } from '../../shared/Chip';
import { FormSheet } from '../../shared/FormSheet';
import { Icon } from '../../shared/Icon';
import { Keypad } from '../../shared/Keypad';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { DetallesModal } from '../captura/DetallesModal';

export function TransferenciaView() {
  const vm = useTransferForm();
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { flex: 1 },
    scrollContent: { gap: t.space[8] },
    box: { backgroundColor: t.colors.surface2, borderRadius: t.radius[20], borderWidth: 1, borderColor: t.colors.border, padding: t.space[12], gap: t.space[4] },
    boxActive: { borderColor: t.colors.accent, borderWidth: 2 },
    boxHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[12] },
    selector: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], flexShrink: 1, minWidth: 0 },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: t.space[8] },
    swapRow: { alignItems: 'center', marginVertical: -t.space[8], zIndex: 1 },
    swap: { width: 36, height: 36, borderRadius: t.radius.full, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[16], padding: t.space[24] },
    footer: { gap: t.space[8] },
  }));

  if (!vm.hasEnoughAccounts) {
    return (
      <ScreenTemplate title="TRANSFERENCIA" left="close" onLeft={vm.close}>
        <View style={styles.empty}>
          <AppText variant="bodyRegular" color="textMuted" align="center">Necesitas al menos dos cuentas para transferir.</AppText>
          <Button label="Crear cuenta" onPress={vm.openNewAccount} />
        </View>
      </ScreenTemplate>
    );
  }

  const concept = vm.details.concept.trim();

  return (
    <ScreenTemplate>
      <FormSheet title="Nuevo movimiento" onClose={vm.close}>
        <Segmented options={vm.kindOptions} value="transfer" onChange={vm.selectKind} onSurface />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <PressableScale onPress={() => vm.setActive('from')} style={[styles.box, vm.active === 'from' ? styles.boxActive : null]}>
            <View style={styles.boxHead}>
              <AppText variant="label" color="textMuted">DESDE</AppText>
              <PressableScale onPress={() => setPicker('from')} style={styles.selector} accessibilityLabel="Elegir cuenta de origen">
                <AppText variant="heading" numberOfLines={1}>{vm.fromLabel}</AppText>
                <Icon name="chevronDown" size={16} color="textMuted" />
              </PressableScale>
            </View>
            {vm.active === 'from' && vm.expression ? <AppText variant="bodyRegular" color="textMuted">{vm.expression}</AppText> : null}
            <AppText variant="balance" fit>{vm.fromAmount}</AppText>
            {vm.fromBalance ? (
              <View style={styles.balanceRow}>
                <AppText variant="caption" color="textMuted">{vm.fromBalance.current}</AppText>
                {vm.fromBalance.after ? <AppText variant="caption" color={vm.fromBalance.negative ? 'expense' : 'textMuted'}>{vm.fromBalance.after}</AppText> : null}
              </View>
            ) : null}
          </PressableScale>

          <View style={styles.swapRow}>
            <PressableScale onPress={vm.swap} style={styles.swap} accessibilityLabel="Invertir"><Icon name="swap" size={18} color="accent" /></PressableScale>
          </View>

          <PressableScale onPress={() => vm.setActive('to')} style={[styles.box, vm.active === 'to' && !vm.sameCurrency ? styles.boxActive : null]}>
            <View style={styles.boxHead}>
              <AppText variant="label" color="textMuted">HACIA</AppText>
              <PressableScale onPress={() => setPicker('to')} style={styles.selector} accessibilityLabel="Elegir cuenta de destino">
                <AppText variant="heading" numberOfLines={1}>{vm.toLabel}</AppText>
                <Icon name="chevronDown" size={16} color="textMuted" />
              </PressableScale>
            </View>
            {vm.active === 'to' && !vm.sameCurrency && vm.expression ? <AppText variant="bodyRegular" color="textMuted">{vm.expression}</AppText> : null}
            <AppText variant="balance" fit>{vm.toAmount}</AppText>
            {vm.toBalance ? (
              <View style={styles.balanceRow}>
                <AppText variant="caption" color="textMuted">{vm.toBalance.current}</AppText>
                {vm.toBalance.after ? <AppText variant="caption" color="textMuted">{vm.toBalance.after}</AppText> : null}
              </View>
            ) : null}
            {vm.convertHint ? <AppText variant="caption" color="textMuted">{vm.convertHint}</AppText> : null}
          </PressableScale>

          {vm.rateCard ? <AppText variant="caption" color="textMuted" align="center">{vm.rateCard.note}</AppText> : null}

          <View style={styles.wrap}>
            {vm.rateChip ? <Chip shape="tile" label={vm.rateChip} /> : null}
            <Chip shape="tile" label={vm.details.dateChip} onPress={() => setDetailsOpen(true)} />
            <Chip shape="tile" label={concept === '' ? 'Concepto' : concept} accessibilityLabel={`Concepto: ${concept === '' ? 'sin definir' : concept}`} onPress={() => setDetailsOpen(true)} />
            <Chip shape="tile" label={vm.categoryLabel ?? 'Categoría'} onPress={() => setCategoryOpen(true)} />
          </View>
          {vm.categoryLabel ? <AppText variant="small" color="textMuted">Cuenta como gasto en el presupuesto. Si luego gastas ese dinero con la misma categoría, se contaría dos veces.</AppText> : null}

          {vm.invalidOperation ? <AppText variant="small" color="expense">Operación inválida</AppText> : null}
          {vm.warning ? <AppText variant="small" color="warning">{vm.warning}</AppText> : null}
          {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Keypad onKey={vm.pressKey} operators equals={vm.equalsLabel} compact />
          <Button label="Transferir" onPress={() => void vm.save()} disabled={!vm.canSave} />
        </View>
      </FormSheet>

      <SheetModal visible={picker !== null} title={picker === 'from' ? 'DESDE' : 'HACIA'} onClose={() => setPicker(null)}>
        <OptionList
          options={picker === 'from' ? vm.fromOptions : vm.toOptions}
          selected={picker === 'from' ? vm.fromId : vm.toId}
          onSelect={(id) => {
            if (picker === 'from') vm.selectFrom(id);
            else vm.selectTo(id);
            setPicker(null);
          }}
        />
      </SheetModal>
      <CategoryPickerModal
        visible={categoryOpen}
        categories={vm.pickerCategories}
        selectedId={vm.selectedCategoryId}
        onSelect={(id) => {
          vm.selectCategory(id);
          setCategoryOpen(false);
        }}
        onClear={() => {
          vm.clearCategory();
          setCategoryOpen(false);
        }}
        onClose={() => setCategoryOpen(false)}
        onNew={() => {
          setCategoryOpen(false);
          vm.openNewCategory();
        }}
        onNewSub={(parentId) => {
          setCategoryOpen(false);
          vm.openNewSubcategoryOf(parentId);
        }}
      />
      <DetallesModal visible={detailsOpen} onClose={() => setDetailsOpen(false)} details={vm.details} />
    </ScreenTemplate>
  );
}
