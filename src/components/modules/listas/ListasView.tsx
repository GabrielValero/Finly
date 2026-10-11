import { ScrollView, View } from 'react-native';
import { useListsScreen } from '../../../hooks/useListsScreen';
import { useThemedStyles } from '../../../hooks/useTheme';
import { AppText } from '../../shared/AppText';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { Fab } from '../../shared/Fab';
import { RowLista } from '../../shared/RowLista';

/** Contenido de la sección "Listas" dentro de la pestaña Presupuesto. */
export function ListasView() {
  const vm = useListsScreen();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.space[16], paddingBottom: 120, gap: t.space[8] },
    section: { paddingTop: t.space[12] },
    empty: { alignItems: 'center', gap: t.space[12] },
  }));
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {vm.isEmpty ? (
          <Card>
            <View style={styles.empty}>
              <AppText variant="heading" align="center">Aún no tienes listas</AppText>
              <AppText variant="small" color="textMuted" align="center">
                Crea una lista de Mercado para ir al súper con un límite y marcar lo que metes al carrito, o una de Deseos para lo que quieres comprar más adelante. Los totales son en USD; cada producto puede estar en USD o Bs.
              </AppText>
              <Button label="Crear una lista" onPress={vm.newList} />
            </View>
          </Card>
        ) : (
          <>
            {vm.open.map((r) => (
              <RowLista key={r.id} title={r.title} kindLabel={r.kindLabel} subtitle={r.subtitle} amount={r.amount} progress={r.progress} state={r.state} showBar={r.showBar} onPress={() => vm.openList(r.id)} />
            ))}
            {vm.done.length > 0 ? (
              <>
                <View style={styles.section}><AppText variant="label" color="textMuted">Completadas</AppText></View>
                {vm.done.map((r) => (
                  <RowLista key={r.id} title={r.title} kindLabel={r.kindLabel} subtitle={r.subtitle} amount={r.amount} progress={r.progress} state={r.state} showBar={r.showBar} onPress={() => vm.openList(r.id)} />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
      <Fab onPress={vm.newList} label="Nueva lista" />
    </View>
  );
}
