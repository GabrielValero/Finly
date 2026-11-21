import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCaptureForm } from '../../../hooks/useCaptureForm';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { CategoryPickerModal } from '../../shared/CategoryPickerModal';
import { Chip } from '../../shared/Chip';
import { FormSheet } from '../../shared/FormSheet';
import { Keypad } from '../../shared/Keypad';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { parseKindParam } from '../../../utils/captureChips';
import { CaptureRateSheet } from './CaptureRateSheet';
import { DetallesModal } from './DetallesModal';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'VES', label: 'Bs' },
] as const;

export function CapturaView() {
  const params = useLocalSearchParams<{ editId?: string; duplicateId?: string; kind?: string }>();
  const vm = useCaptureForm({ editId: params.editId, duplicateId: params.duplicateId, kind: parseKindParam(params.kind) });
  const [accountPicker, setAccountPicker] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [categoryPicker, setCategoryPicker] = useState(false);
  const styles = useThemedStyles((t) => ({
    scroll: { flex: 1 },
    scrollContent: { gap: t.space[12] },
    center: { alignItems: 'center', gap: t.space[4] },
    seg: { width: 132 },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: t.space[8], maxWidth: '100%' },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    categoryRow: { gap: t.space[8], paddingRight: t.space[16] },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space[8] },
    footer: { gap: t.space[8] },
  }));

  const concept = vm.details.concept.trim();

  return (
    <ScreenTemplate>
      <FormSheet title={vm.title} onClose={vm.close}>
        <Segmented options={vm.kindOptions} value={vm.kind} onChange={vm.selectKind} onSurface />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.center}>
            <View style={styles.seg}>
              <Segmented options={CURRENCY_OPTIONS} value={vm.currency} onChange={vm.setCurrency} onSurface />
            </View>
            {vm.expression ? <AppText variant="bodyRegular" color="textMuted">{vm.expression}</AppText> : null}
            <View style={styles.amountRow}>
              <AppText variant="amountMid" color="textMuted">{vm.currencyPrefix}</AppText>
              <AppText variant="display" fit>{vm.amountDisplay}</AppText>
            </View>
            {vm.invalidOperation ? <AppText variant="small" color="expense">Operación inválida</AppText> : null}
            {vm.summary ? <AppText variant="small" color="textMuted">{vm.summary}</AppText> : null}
          </View>

          <View style={styles.sectionHead}>
            <AppText variant="label" color="textMuted">CATEGORÍA</AppText>
            <PressableScale onPress={() => setCategoryPicker(true)} accessibilityLabel="Ver todas las categorías">
              <AppText variant="label" color="accent">VER TODAS</AppText>
            </PressableScale>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow} keyboardShouldPersistTaps="handled">
            {vm.categoryChips.map((c) => (
              <Chip key={c.id} shape="tile" label={c.label} selected={c.selected} tint={c.color} onPress={() => vm.pickChipCategory(c.id)} />
            ))}
          </ScrollView>

          <View style={styles.wrap}>
            {vm.hasAccounts ? (
              <Chip shape="tile" label={vm.accountName} onPress={() => setAccountPicker(true)} />
            ) : (
              <Chip shape="tile" label="Crear tu primera cuenta" onPress={vm.openNewAccount} />
            )}
            {vm.rateChip ? <Chip shape="tile" label={vm.rateChip} onPress={vm.isEdit ? undefined : vm.openRate} /> : null}
            <Chip shape="tile" label={vm.details.dateChip} onPress={() => setDetailsOpen(true)} />
            <Chip shape="tile" label={concept === '' ? 'Concepto' : concept} accessibilityLabel={`Concepto: ${concept === '' ? 'sin definir' : concept}`} onPress={() => setDetailsOpen(true)} />
            <Chip shape="tile" label={vm.tagsChip} onPress={() => setDetailsOpen(true)} />
          </View>

          {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Keypad onKey={vm.pressKey} operators equals={vm.equalsLabel} compact />
          <Button label={vm.saveLabel} onPress={() => void vm.save()} disabled={!vm.canSave} />
        </View>
      </FormSheet>

      <CaptureRateSheet sheet={vm.rateSheet} />
      <DetallesModal
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        details={vm.details}
        tags={{ list: vm.tags, toggle: vm.toggleTag, add: vm.addTag }}
      />

      <CategoryPickerModal
        visible={categoryPicker}
        categories={vm.pickerCategories}
        selectedId={vm.selectedCategoryValue}
        onSelect={(id) => {
          vm.selectAnyCategory(id);
          setCategoryPicker(false);
        }}
        onClose={() => setCategoryPicker(false)}
        onNew={() => {
          setCategoryPicker(false);
          vm.openNewCategory();
        }}
        onNewSub={(parentId) => {
          setCategoryPicker(false);
          vm.openNewSubcategoryOf(parentId);
        }}
      />

      <SheetModal visible={accountPicker} title="CUENTA" onClose={() => setAccountPicker(false)}>
        <OptionList
          options={vm.accounts}
          selected={vm.accountId}
          onSelect={(id) => {
            vm.selectAccount(id);
            setAccountPicker(false);
          }}
        />
      </SheetModal>
    </ScreenTemplate>
  );
}
