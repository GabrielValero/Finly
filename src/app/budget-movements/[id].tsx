import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ListaMovimientosView } from '../../components/modules/movimientos/ListaMovimientosView';

export default function BudgetMovementsRoute() {
  const { id, month } = useLocalSearchParams<{ id: string; month: string }>();
  const scope = useMemo(() => ({ type: 'budget' as const, id, month }), [id, month]);
  return <ListaMovimientosView scope={scope} />;
}
