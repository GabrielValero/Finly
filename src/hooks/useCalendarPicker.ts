import { useEffect, useMemo, useState } from 'react';
import { addMonths, dayOf, MONTH_NAMES, monthGrid, monthOf, toLocalIso } from '../utils/dates';

const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

/** Estado del calendario: navegación por mes y selector rápido de mes/año. */
export function useCalendarPicker(selectedDay: string, open: boolean) {
  const [viewMonth, setViewMonth] = useState(monthOf(selectedDay));
  const [mode, setMode] = useState<'days' | 'months'>('days');

  // Cada vez que se abre, parte del día seleccionado.
  useEffect(() => {
    if (open) {
      setViewMonth(monthOf(selectedDay));
      setMode('days');
    }
  }, [open, selectedDay]);

  const today = dayOf(toLocalIso(new Date()));
  const [yearText, monthText] = viewMonth.split('-') as [string, string];
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  const weeks = useMemo(
    () => monthGrid(viewMonth).map((week) => week.map((day) => (day ? { day, label: String(Number(day.slice(8))), selected: day === selectedDay, today: day === today } : null))),
    [viewMonth, selectedDay, today],
  );

  return {
    mode,
    title: `${MONTH_NAMES[monthIndex]} ${year}`,
    toggleMode: () => setMode((m) => (m === 'days' ? 'months' : 'days')),
    prevMonth: () => setViewMonth((m) => addMonths(m, -1)),
    nextMonth: () => setViewMonth((m) => addMonths(m, 1)),
    weeks,
    year,
    prevYear: () => setViewMonth((m) => addMonths(m, -12)),
    nextYear: () => setViewMonth((m) => addMonths(m, 12)),
    months: MONTH_SHORT.map((label, i) => ({ index: i, label, selected: i === monthIndex })),
    pickMonth: (index: number) => {
      setViewMonth(`${yearText}-${String(index + 1).padStart(2, '0')}`);
      setMode('days');
    },
    goToday: () => {
      setViewMonth(monthOf(today));
      setMode('days');
    },
    today,
  };
}
