import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useCaptureForm } from '../../../hooks/useCaptureForm';
import { useKeyboardVisible } from '../../../hooks/useKeyboardVisible';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { CategoryPickerModal } from '../../shared/CategoryPickerModal';
import { Icon } from '../../shared/Icon';
import { Keypad } from '../../shared/Keypad';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SelectRow } from '../../shared/SelectRow';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { DateTimeBox } from '../../shared/DateTimeBox';
import { Field } from '../../shared/Field';
import { CaptureRateSheet } from './CaptureRateSheet';
import { DetallesModal } from './DetallesModal';

export function CapturaView() {
  const params = useLocalSearchParams<{ editId?: string; duplicateId?: string }>();
  const vm = useCaptureForm({ editId: params.editId, duplicateId: params.duplicateId });
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [accountPicker, setAccountPicker] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [kindPicker, setKindPicker] = useState(false);
  const [categoryPicker, setCategoryPicker] = useState(false);
  // Con el teclado del sistema abierto (concepto) se oculta el teclado numérico para que quepa la pantalla;
  // vuelve en cuanto el teclado se cierra (por Atrás, «Listo» o tocando fuera), no solo al perder el foco.
  const typing = useKeyboardVisible();
  const styles = useThemedStyles((t) => ({
    body: { flex: 1, paddingHorizontal: t.space[16], gap: t.space[12] },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    close: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    kind: { flexDirection: 'row', alignItems: 'center', gap: t.space[8], height: 36, paddingHorizontal: t.space[16], borderRadius: t.radius.full, backgroundColor: t.colors.surface },
    center: { alignItems: 'center', gap: t.space[8], paddingHorizontal: t.space[8] },
    seg: { width: 140 },
    conceptBox: { minHeight: 48, borderRadius: t.radius[16], backgroundColor: t.colors.surface, paddingHorizontal: t.space[16], justifyContent: 'center' },
    categoryBox: { backgroundColor: t.colors.surface, borderRadius: t.radius[16], borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.space[16], paddingVertical: t.space[12], gap: t.space[4] },
    categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[8] },
    keypad: { marginTop: 'auto' },
  }));

  return (
    <ScreenTemplate>
      <View style={[styles.body, { paddingBottom: insets.bottom + theme.space[8] }]}>
        <View style={styles.topRow}>
          <PressableScale onPress={vm.close} style={styles.close} accessibilityLabel="Cerrar">
            <Icon name="close" size={20} />
          </PressableScale>
          <PressableScale onPress={() => setKindPicker(true)} style={styles.kind} accessibilityLabel="Tipo de movimiento">
            <AppText variant="label">{vm.kindLabel}</AppText>
            <Icon name="chevronDown" size={16} color="textMuted" />
          </PressableScale>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: theme.space[12] }}>
          <View style={styles.center}>
            <View style={styles.seg}>
              <Segmented
                options={[{ value: 'VES', label: 'Bs' }, { value: 'USD', label: 'USD' }]}
                value={vm.currency}
                onChange={vm.setCurrency}
              />
            </View>
            <AppText variant="display" fit>{vm.amountDisplay}</AppText>
            {vm.amountResult ? <AppText variant="bodyRegular" color={vm.equalsLabel ? 'accent' : 'expense'}>{vm.amountResult}</AppText> : null}
            {vm.preview ? <AppText variant="bodyRegular" color="textMuted">{vm.preview}</AppText> : null}
            {vm.rateLabel ? (
              <PressableScale onPress={vm.openRate}>
                <AppText variant="caption" color={vm.rateMissing ? 'expense' : 'accent'}>{vm.rateLabel}</AppText>
              </PressableScale>
            ) : null}
          </View>

          {vm.hasAccounts ? (
            <SelectRow label="CUENTA" value={vm.accountName} onPress={() => setAccountPicker(true)} />
          ) : (
            <Button label="Crear tu primera cuenta" onPress={vm.openNewAccount} variant="outline" />
          )}

          <Field
            label="CONCEPTO"
            value={vm.details.concept}
            onChangeText={vm.details.setConcept}
            placeholder="Ej. Mercado semanal"
            maxLength={120}
          />

          <DateTimeBox details={vm.details} />

          <PressableScale onPress={() => setCategoryPicker(true)} style={styles.categoryBox} accessibilityLabel="Elegir categoría">
            <AppText variant="label" color="textMuted">CATEGORÍA</AppText>
            <View style={styles.categoryRow}>
              <AppText variant="heading" color={vm.categoryLabel ? 'text' : 'textMuted'} numberOfLines={1}>{vm.categoryLabel ?? 'Elegir categoría'}</AppText>
              <Icon name="chevronDown" size={18} color="textMuted" />
            </View>
          </PressableScale>

          <PressableScale onPress={() => setDetailsOpen(true)} style={styles.conceptBox}>
            <AppText variant="bodyRegular" color={vm.hasTags ? 'text' : 'textMuted'} numberOfLines={1}>{vm.tagsLabel}</AppText>
          </PressableScale>

          {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
          <Button label={vm.isEdit ? 'Guardar cambios' : 'Guardar'} onPress={() => void vm.save()} disabled={!vm.canSave} />
        </ScrollView>

        {typing ? null : (
          <View style={styles.keypad}>
            <Keypad onKey={vm.pressKey} operators equals={vm.equalsLabel} />
          </View>
        )}
      </View>

      <CaptureRateSheet sheet={vm.rateSheet} />
      <DetallesModal
        basics={false}
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        details={vm.details}
        tags={{ list: vm.tags, toggle: vm.toggleTag, add: vm.addTag }}
      />

      <SheetModal visible={kindPicker} title="TIPO" onClose={() => setKindPicker(false)}>
        <OptionList
          options={vm.kindOptions}
          selected={vm.kind}
          onSelect={(value) => {
            setKindPicker(false);
            vm.selectKind(value);
          }}
        />
      </SheetModal>

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
