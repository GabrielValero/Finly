import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useCaptureForm } from '../../../hooks/useCaptureForm';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { CategoryChip } from '../../shared/CategoryChip';
import { Icon } from '../../shared/Icon';
import { Keypad } from '../../shared/Keypad';
import { OptionList } from '../../shared/OptionList';
import { PressableScale } from '../../shared/PressableScale';
import { Segmented } from '../../shared/Segmented';
import { SelectRow } from '../../shared/SelectRow';
import { SheetModal } from '../../shared/SheetModal';
import { ScreenTemplate } from '../../template/ScreenTemplate';
import { DetallesModal } from './DetallesModal';

export function CapturaView() {
  const params = useLocalSearchParams<{ editId?: string; duplicateId?: string }>();
  const vm = useCaptureForm({ editId: params.editId, duplicateId: params.duplicateId });
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [accountPicker, setAccountPicker] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const styles = useThemedStyles((t) => ({
    body: { flex: 1, paddingHorizontal: t.space[16], gap: t.space[12] },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    close: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    kind: { flexDirection: 'row', alignItems: 'center', gap: t.space[8], height: 36, paddingHorizontal: t.space[16], borderRadius: t.radius.full, backgroundColor: t.colors.surface },
    center: { alignItems: 'center', gap: t.space[8] },
    seg: { width: 140 },
    chips: { gap: t.space[8], paddingRight: t.space[16] },
    conceptBox: { minHeight: 48, borderRadius: t.radius[16], backgroundColor: t.colors.surface, paddingHorizontal: t.space[16], justifyContent: 'center' },
    subLabel: { paddingTop: t.space[4] },
    keypad: { marginTop: 'auto' },
  }));

  return (
    <ScreenTemplate>
      <View style={[styles.body, { paddingBottom: insets.bottom + theme.space[8] }]}>
        <View style={styles.topRow}>
          <PressableScale onPress={vm.close} style={styles.close} accessibilityLabel="Cerrar">
            <Icon name="close" size={20} />
          </PressableScale>
          <PressableScale onPress={() => vm.setKind(vm.kind === 'expense' ? 'income' : 'expense')} style={styles.kind}>
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
            <AppText variant="display">{vm.amountDisplay}</AppText>
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {vm.categories.map((c) => (
              <CategoryChip key={c.id} label={c.name} icon={c.icon} selected={c.id === vm.categoryId} onPress={() => vm.selectCategory(c.id)} />
            ))}
          </ScrollView>

          {vm.subcategories.length > 0 ? (
            <View style={styles.subLabel}>
              <AppText variant="label" color="textMuted">SUBCATEGORÍA (OPCIONAL)</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {vm.subcategories.map((c) => (
                  <CategoryChip key={c.id} label={c.name} icon={c.icon} selected={c.id === vm.subcategoryId} onPress={() => vm.selectSubcategory(c.id)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <PressableScale onPress={() => setDetailsOpen(true)} style={styles.conceptBox}>
            <AppText variant="bodyRegular" color={vm.hasDetails ? 'text' : 'textMuted'} numberOfLines={1}>{vm.detailsLabel}</AppText>
          </PressableScale>

          {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
          <Button label={vm.isEdit ? 'Guardar cambios' : 'Guardar'} onPress={() => void vm.save()} disabled={!vm.canSave} />
        </ScrollView>

        <View style={styles.keypad}>
          <Keypad onKey={vm.pressKey} />
        </View>
      </View>

      <DetallesModal
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        details={vm.details}
        tags={{ list: vm.tags, toggle: vm.toggleTag, add: vm.addTag }}
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
