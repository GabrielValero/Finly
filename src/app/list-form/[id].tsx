import { useLocalSearchParams } from 'expo-router';
import { ListaFormView } from '../../components/modules/listas/ListaFormView';

export default function ListFormRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListaFormView id={id} />;
}
