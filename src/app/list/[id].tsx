import { useLocalSearchParams } from 'expo-router';
import { ListaDetalleView } from '../../components/modules/listas/ListaDetalleView';

export default function ListRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListaDetalleView id={id} />;
}
