import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useSubscription } from './useSubscription';
import { filterByRetention } from '@/lib/retentionGate';

export function useRetainedData() {
  const { symptoms, treatments, notes, ...rest } = useApp();
  const { isPro } = useSubscription();

  const retainedSymptoms = useMemo(
    () => filterByRetention(symptoms, (s) => s.date, isPro),
    [symptoms, isPro]
  );

  const retainedTreatments = useMemo(
    () =>
      filterByRetention(
        treatments,
        (t) => t.administration_date || (typeof t.created_at === 'string' ? t.created_at : new Date()),
        isPro
      ),
    [treatments, isPro]
  );

  const retainedNotes = useMemo(
    () =>
      filterByRetention(
        notes,
        (n) => n.date || (typeof n.created_at === 'string' ? n.created_at : new Date()),
        isPro
      ),
    [notes, isPro]
  );

  return { ...rest, symptoms: retainedSymptoms, treatments: retainedTreatments, notes: retainedNotes };
}
