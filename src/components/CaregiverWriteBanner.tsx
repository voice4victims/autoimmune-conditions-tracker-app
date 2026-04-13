import React from 'react';
import { useCaregiverStatus } from '@/hooks/useCaregiverStatus';
import { Eye } from 'lucide-react';

const CaregiverWriteBanner: React.FC = () => {
  const { isCaregiver, canWrite, upgradeMessage, loading } = useCaregiverStatus();

  if (loading || !isCaregiver || canWrite || !upgradeMessage) return null;

  return (
    <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
      <Eye className="w-4 h-4 text-blue-500 shrink-0" />
      <p className="font-sans text-[12px] text-blue-700 dark:text-blue-300 m-0 leading-snug">
        {upgradeMessage}
      </p>
    </div>
  );
};

export default CaregiverWriteBanner;
