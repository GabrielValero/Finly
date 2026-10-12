import { useRouter } from 'expo-router';
import { useUi } from '../store/ui';

export interface MenuItem {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
}

/** Accesos del menú (hamburguesa) del Home. Cada módulo nuevo se añade aquí. */
export function useHomeMenu(): MenuItem[] {
  const router = useRouter();
  const setSection = useUi((s) => s.setPresupuestoSection);
  return [
    {
      key: 'lists',
      label: 'Listas de compras',
      icon: 'cart',
      onPress: () => {
        setSection('lists');
        router.navigate('/presupuesto');
      },
    },
    { key: 'categories', label: 'Categorías', icon: 'folder', onPress: () => router.push('/categories') },
    { key: 'rates', label: 'Tasas', icon: 'dollar', onPress: () => router.push('/settings/rates') },
    { key: 'backup', label: 'Respaldo', icon: 'download', onPress: () => router.push('/settings/backup') },
    { key: 'settings', label: 'Ajustes', icon: 'sliders', onPress: () => router.navigate('/ajustes') },
  ];
}
