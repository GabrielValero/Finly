import { create } from 'zustand';
import { monthOf, toLocalIso } from '../utils/dates';

/** Estado efímero de UI (no persistido, no datos). */
interface UiState {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  /** Categoría recién creada desde un selector (captura/planificar): la pantalla que la pidió la elige y lo limpia. */
  createdCategoryId: string | null;
  setCreatedCategoryId: (id: string | null) => void;
}

export const useUi = create<UiState>()((set) => ({
  selectedMonth: monthOf(toLocalIso(new Date())),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  createdCategoryId: null,
  setCreatedCategoryId: (createdCategoryId) => set({ createdCategoryId }),
}));
