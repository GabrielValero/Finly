import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ListaMovimientosView } from '../../components/modules/movimientos/ListaMovimientosView';

export default function AccountMovementsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scope = useMemo(() => ({ type: 'account' as const, id }), [id]);
  return <ListaMovimientosView scope={scope} />;
}
