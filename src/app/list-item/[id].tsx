import { useLocalSearchParams } from 'expo-router';
import { ProductoFormView } from '../../components/modules/listas/ProductoFormView';

export default function ListItemRoute() {
  const { id, listId } = useLocalSearchParams<{ id: string; listId: string }>();
  return <ProductoFormView id={id} listId={listId} />;
}
