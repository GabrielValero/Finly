import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export function CapturaView() {
  const vm = useCaptureForm();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [accountPicker, setAccountPicker] = useState(false);
  const [conceptOpen, setConceptOpen] = useState(false);
  const styles = useThemedStyles((t) => ({
    body: { flex: 1, paddingHorizontal: t.space[16], gap: t.space[12] },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    close: { width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
    kind: { flexDirection: 'row', alignItems: 'center', gap: t.space[8], height: 36, paddingHorizontal: t.space[16], borderRadius: t.radius.full, backgroundColor: t.colors.surface },
    center: { alignItems: 'center', gap: t.space[8] },
    seg: { width: 140 },
    chips: { gap: t.space[8], paddingRight: t.space[16] },
    conceptBox: { minHeight: 48, borderRadius: t.radius[16], backgroundColor: t.colors.surface, paddingHorizontal: t.space[16], justifyContent: 'center' },
    input: { color: t.colors.text, fontFamily: t.font.sans.regular, fontSize: 16, paddingVertical: t.space[12] },
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

          <PressableScale onPress={() => setConceptOpen(true)} style={styles.conceptBox}>
            {conceptOpen ? (
              <TextInput
                autoFocus
                value={vm.concept}
                onChangeText={vm.setConcept}
                placeholder="Concepto"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                maxLength={120}
                returnKeyType="done"
                onSubmitEditing={() => setConceptOpen(false)}
              />
            ) : (
              <AppText variant="bodyRegular" color="textMuted">{vm.concept ? vm.concept : '+  Concepto (opcional)'}</AppText>
            )}
          </PressableScale>

          {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
          <Button label="Guardar" onPress={() => void vm.save()} disabled={!vm.canSave} />
        </ScrollView>

        <View style={styles.keypad}>
          <Keypad onKey={vm.pressKey} />
        </View>
      </View>

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
