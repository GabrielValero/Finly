import { useState } from 'react';
import { dayOf, formatDateTimeLong, shiftDay, timeOf, toLocalIso, withDay, withTime } from '../utils/dates';

/** Concepto + fecha/hora de un movimiento (compartido por captura y transferencia). */
export function useMovementDetails() {
  const [concept, setConcept] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => toLocalIso(new Date()));

  return {
    concept,
    setConcept,
    occurredAt,
    setOccurredAt,
    day: dayOf(occurredAt),
    setDay: (day: string) => setOccurredAt((iso) => withDay(iso, day)),
    dateLabel: formatDateTimeLong(occurredAt),
    /** Solo la hora, "HH:mm" (24 h). */
    time: timeOf(occurredAt),
    setTime: (time: string) => setOccurredAt((iso) => withTime(iso, time)),
    shiftDate: (delta: number) => setOccurredAt((iso) => shiftDay(iso, delta)),
    resetDateToNow: () => setOccurredAt(toLocalIso(new Date())),
  };
}
