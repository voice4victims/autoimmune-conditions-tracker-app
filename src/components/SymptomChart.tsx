import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useRetainedData } from '@/hooks/useRetainedData';
import SymptomHistoryDetails from './SymptomHistoryDetails';

const SymptomChart: React.FC = () => {
  const { childProfile, symptoms } = useRetainedData();

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-serif text-xl text-neutral-700 dark:text-neutral-200 mb-2">No Child Selected</p>
          <p className="font-sans text-[13px] text-neutral-400">Select a child profile to view symptom history</p>
        </CardContent>
      </Card>
    );
  }

  if (symptoms.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl mb-3">📈</p>
          <p className="font-serif text-xl text-neutral-700 dark:text-neutral-200 mb-2">No Symptoms Recorded</p>
          <p className="font-sans text-[13px] text-neutral-400">Start tracking symptoms to see history here</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...symptoms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardContent className="p-4">
        <p className="font-sans font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.07em] mb-3">
          Symptom History
        </p>
        <SymptomHistoryDetails symptoms={sorted} />
      </CardContent>
    </Card>
  );
};

export default SymptomChart;
