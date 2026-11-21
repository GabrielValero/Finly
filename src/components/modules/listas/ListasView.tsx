import { ScrollView, View } from 'react-native';
import { useListsScreen, type ListRowVm } from '../../../hooks/useListsScreen';
import { useTheme, useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Icon } from '../../shared/Icon';
import { IconBadge } from '../../shared/IconBadge';
import { PressableScale } from '../../shared/PressableScale';
import { RowLista } from '../../shared/RowLista';

/** Contenido de la sección "Listas" dentro de la pestaña Presupuesto. */
export function ListasView() {
  const vm = useListsScreen();
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: t.space[32], gap: t.space[12] },
    historyHead: { flexDirection: 'row', alignItems: 'center', gap: t.space[4], paddingTop: t.space[8] },
    empty: { alignItems: 'center', gap: t.space[12] },
    emptyIcon: { marginBottom: t.space[4] },
  }));
  const card = (r: ListRowVm) => (
    <RowLista key={r.id} title={r.title} kindLabel={r.kindLabel} subtitle={r.subtitle} amount={r.amount} progress={r.progress} state={r.state} showBar={r.showBar} color={r.color} icon={r.icon} limitText={r.limitText} dim={r.dim} onPress={() => vm.openList(r.id)} />
  );
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {vm.isEmpty ? (
          <Card>
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><IconBadge icon="cart" size={64} tint={theme.colors.accent} color="accent" /></View>
              <AppText variant="subtitle" align="center">Aún no tienes listas</AppText>
              <AppText variant="small" color="textMuted" align="center">
                Arma la lista del mercado, marca lo que vas metiendo al carrito y al pagar registro el gasto por ti. También sirve para guardar lo que quieres comprar más adelante.
              </AppText>
              <Button label="Crear una lista" onPress={vm.newList} />
            </View>
          </Card>
        ) : (
          <>
            {vm.open.map(card)}
            <Button label="Nueva lista" icon="plus" variant="secondary" onPress={vm.newList} />
            {vm.history.length > 0 ? (
              <>
                <PressableScale onPress={vm.toggleHistory} style={styles.historyHead} accessibilityLabel={vm.historyOpen ? 'Ocultar historial' : 'Mostrar historial'}>
                  <AppText variant="label" color="textMuted">Historial ({vm.history.length})</AppText>
                  <Icon name={vm.historyOpen ? 'chevronUp' : 'chevronDown'} size={16} color="textMuted" />
                </PressableScale>
                {vm.historyOpen ? vm.history.map(card) : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
