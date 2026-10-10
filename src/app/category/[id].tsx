import { useLocalSearchParams } from 'expo-router';
import { CategoriaFormView } from '../../components/modules/categorias/CategoriaFormView';

export default function CategoryRoute() {
  const { id, kind, parentId } = useLocalSearchParams<{ id: string; kind?: string; parentId?: string }>();
  return <CategoriaFormView id={id} kind={kind} parentId={parentId} />;
}
