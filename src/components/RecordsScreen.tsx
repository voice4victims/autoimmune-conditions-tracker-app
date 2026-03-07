import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import FileManager from './FileManager';
import ProviderTracker from './ProviderTracker';
import EmailRecordsForm from './EmailRecordsForm';
import MedicalVisitTracker from './MedicalVisitTracker';

const RECORD_TABS = [
  { id: 'files', icon: '📁', label: 'Files' },
  { id: 'providers', icon: '👨‍⚕️', label: 'Providers' },
  { id: 'email', icon: '📧', label: 'Email' },
  { id: 'visits', icon: '🏥', label: 'Visits' },
];

interface RecordsScreenProps {
  initialTab?: string;
}

const RecordsScreen: React.FC<RecordsScreenProps> = ({ initialTab = 'files' }) => {
  const [tab, setTab] = useState(initialTab);
  const { childProfile } = useApp();

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white dark:bg-neutral-900 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.07em] text-neutral-400 mb-0.5">
          {childProfile?.name ?? 'Child'}
        </p>
        <h2 className="font-serif text-[22px] text-neutral-800 dark:text-neutral-100 m-0 tracking-[-0.2px]">Records</h2>
      </div>

      <div className="flex overflow-x-auto gap-1 px-4 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        {RECORD_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-sans font-extrabold text-[12px] cursor-pointer whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-primary-400 bg-primary-50 text-primary-600'
                : 'border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-400'
            )}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {tab === 'files' && <FileManager />}
        {tab === 'providers' && <ProviderTracker />}
        {tab === 'email' && <EmailRecordsForm />}
        {tab === 'visits' && <MedicalVisitTracker />}
      </div>
    </div>
  );
};

export default RecordsScreen;
