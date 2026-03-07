import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import SymptomTracker from './SymptomTracker';
import TriggerTracker from './TriggerTracker';
import ActivityTracker from './ActivityTracker';
import FoodDiaryTracker from './FoodDiaryTracker';
import VitalSignsTracker from './VitalSignsTracker';
import TreatmentTracker from './TreatmentTracker';

const LOG_TABS = [
  { id: 'symptoms', icon: '🔍', label: 'Symptoms' },
  { id: 'triggers', icon: '⚠️', label: 'Triggers' },
  { id: 'activity', icon: '🏃', label: 'Activity' },
  { id: 'food', icon: '🍎', label: 'Food' },
  { id: 'vitals', icon: '❤️', label: 'Vitals' },
  { id: 'treatment', icon: '💊', label: 'Treatment' },
];

interface LogScreenProps {
  initialTab?: string;
}

const LogScreen: React.FC<LogScreenProps> = ({ initialTab = 'symptoms' }) => {
  const [tab, setTab] = useState(initialTab);

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  const { addSymptom, customSymptoms, addCustomSymptom, childProfile } = useApp();

  const handleAddSymptom = async (symptom: any) => {
    await addSymptom(symptom);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white dark:bg-neutral-900 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.07em] text-neutral-400 mb-0.5">
          Tracking {childProfile?.name ? `· ${childProfile.name}` : ''}
        </p>
        <h2 className="font-serif text-[22px] text-neutral-800 dark:text-neutral-100 m-0 tracking-[-0.2px]">Log Entry</h2>
      </div>

      <div className="flex overflow-x-auto gap-1 px-4 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        {LOG_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-sans font-extrabold text-[12px] cursor-pointer whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-primary-400 bg-primary-50 text-primary-600'
                : 'border-neutral-200 bg-transparent text-neutral-400'
            )}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {tab === 'symptoms' && (
          <SymptomTracker
            onAddSymptom={handleAddSymptom}
            customSymptoms={customSymptoms}
            onAddCustomSymptom={addCustomSymptom}
          />
        )}
        {tab === 'triggers' && <TriggerTracker />}
        {tab === 'activity' && <ActivityTracker />}
        {tab === 'food' && <FoodDiaryTracker />}
        {tab === 'vitals' && <VitalSignsTracker />}
        {tab === 'treatment' && <TreatmentTracker />}
      </div>
    </div>
  );
};

export default LogScreen;
