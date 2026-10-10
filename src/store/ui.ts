import { create } from 'zustand';
import { monthOf, toLocalIso } from '../utils/dates';

/** Estado efímero de UI (no persistido, no datos). */
interface UiState {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const useUi = create<UiState>()((set) => ({
  selectedMonth: monthOf(toLocalIso(new Date())),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
}));
