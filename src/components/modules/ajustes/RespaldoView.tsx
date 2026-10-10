import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackupScreen } from '../../../hooks/useBackupScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Banner } from '../../shared/Banner';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { SettingsRow } from '../../shared/SettingsRow';
import { ScreenTemplate } from '../../template/ScreenTemplate';

export function RespaldoView() {
  const vm = useBackupScreen();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[16], gap: t.space[12] },
    list: { paddingVertical: 0, paddingHorizontal: t.space[16] },
    info: { gap: t.space[8] },
    footer: { paddingHorizontal: t.space[16], paddingBottom: t.space[16] + insets.bottom, gap: t.space[12] },
  }));
  return (
    <ScreenTemplate title="RESPALDO" left="back" onLeft={vm.back}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Banner text={vm.status.text} action={vm.status.hasBackup ? 'EXPORTAR' : 'RESPALDAR'} onPress={() => void vm.doExport()} />
        <Card style={styles.info}>
          <AppText variant="label" color="textMuted">Un solo archivo</AppText>
          <AppText variant="bodyRegular">Cuentas, movimientos, categorías, etiquetas, tasas y presupuestos. Guárdalo en Drive, WhatsApp o donde prefieras.</AppText>
        </Card>
        <Card style={styles.list}>
          {vm.rows.map((r, i) => (
            <SettingsRow key={r.label} label={r.label} value={String(r.value)} last={i === vm.rows.length - 1} />
          ))}
        </Card>
        {vm.error ? <AppText variant="small" color="expense">{vm.error}</AppText> : null}
      </ScrollView>
      <View style={styles.footer}>
        <AppText variant="small" color="textMuted">Restaurar reemplaza todos los datos actuales por los del archivo.</AppText>
        <Button label="Restaurar desde archivo" variant="outline" onPress={() => void vm.doRestore()} disabled={vm.busy} />
        <Button label="Exportar respaldo" onPress={() => void vm.doExport()} disabled={vm.busy} />
      </View>
    </ScreenTemplate>
  );
}
