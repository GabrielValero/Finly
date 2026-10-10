import { useLocalSearchParams } from 'expo-router';
import { CategoriaFormView } from '../../components/modules/categorias/CategoriaFormView';

export default function CategoryRoute() {
  const { id, kind, parentId, pick } = useLocalSearchParams<{ id: string; kind?: string; parentId?: string; pick?: string }>();
  return <CategoriaFormView id={id} kind={kind} parentId={parentId} pick={pick} />;
}
