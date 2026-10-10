import { useCallback, useState } from 'react';
import { dayOf, formatDateTimeLong, isValidTime, shiftDay, timeOf, toLocalIso, withDay, withTime } from '../utils/dates';

/** Concepto + fecha/hora de un movimiento (compartido por captura y transferencia). */
export function useMovementDetails() {
  const [concept, setConcept] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => toLocalIso(new Date()));
  const [timeDraft, setTimeDraft] = useState<string | null>(null);

  const commitTime = useCallback((text: string) => {
    if (isValidTime(text)) setOccurredAt((iso) => withTime(iso, text));
    setTimeDraft(null);
  }, []);

  return {
    concept,
    setConcept,
    occurredAt,
    setOccurredAt,
    day: dayOf(occurredAt),
    setDay: (day: string) => setOccurredAt((iso) => withDay(iso, day)),
    dateLabel: formatDateTimeLong(occurredAt),
    shiftDate: (delta: number) => setOccurredAt((iso) => shiftDay(iso, delta)),
    resetDateToNow: () => setOccurredAt(toLocalIso(new Date())),
    timeText: timeDraft ?? timeOf(occurredAt),
    timeInvalid: timeDraft !== null && !isValidTime(timeDraft),
    setTimeText: setTimeDraft,
    commitTime,
  };
}
