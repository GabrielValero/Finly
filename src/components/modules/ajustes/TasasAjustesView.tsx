import { ScrollView, View } from 'react-native';
import { useRatesSettings } from '../../../hooks/useRatesSettings';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Segmented } from '../../shared/Segmented';
import { SwitchRow } from '../../shared/SwitchRow';
import { SettingsRow } from '../../shared/SettingsRow';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function TasasAjustesView() {
  const vm = useRatesSettings();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[12] },
    hero: { gap: t.space[8] },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    action: { alignSelf: 'flex-start' },
  }));
  return (
    <ScreenTemplate title="TASAS" left="back" onLeft={vm.back} bottomInset>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card highlight style={styles.hero}>
          <AppText variant="label" color="textMuted">Tasa de hoy</AppText>
          <AppText variant="display" fit>{vm.hero.value}</AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={2}>{vm.hero.caption}</AppText>
          <View style={styles.action}><Button label="Actualizar tasa" onPress={vm.update} /></View>
        </Card>
        <SwitchRow
          label="Actualizar BCV automáticamente"
          hint="Al abrir la app consulta la tasa oficial en dolarapi.com. Sin internet se queda con la última guardada."
          value={vm.autoRate}
          onChange={vm.setAutoRate}
        />
        <AppText variant="label" color="textMuted">Fuente por defecto</AppText>
        <Segmented options={[{ value: 'bcv', label: 'BCV' }, { value: 'manual', label: 'Manual' }]} value={vm.source} onChange={vm.setSource} />
        <AppText variant="small" color="textMuted">Es la tasa que se propone al registrar movimientos en Bs. Siempre puedes cambiarla en cada uno.</AppText>
        <AppText variant="label" color="textMuted">Historial</AppText>
        {vm.history.length === 0 ? (
          <AppText variant="small" color="textMuted">Cuando registres una tasa aparecerá aquí.</AppText>
        ) : (
          <Card style={styles.list}>
            {vm.history.map((r, i) => (
              <SettingsRow key={r.id} label={r.date} value={r.value} last={i === vm.history.length - 1} />
            ))}
          </Card>
        )}
        <AppText variant="small" color="textMuted">Los movimientos conservan la tasa del día en que se hicieron; cambiarla aquí no los modifica.</AppText>
      </ScrollView>
    </ScreenTemplate>
  );
}
