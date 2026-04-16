import React from 'react';
import { isRevenueCatAvailable } from '@/lib/revenuecat';
import { useSubscription } from '@/hooks/useSubscription';
import { FREE_RETENTION_DAYS } from '@/lib/retentionGate';

const RetentionBanner: React.FC = () => {
  const { isPro, loading } = useSubscription();

  if (loading || isPro || !isRevenueCatAvailable()) return null;

  return (
    <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
      <p className="font-sans text-[12px] text-amber-700 dark:text-amber-300 m-0 leading-snug">
        Showing last {FREE_RETENTION_DAYS} days. Upgrade to Pro or Family for unlimited history.
      </p>
      <button className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 font-sans font-extrabold text-[11px] text-white border-none cursor-pointer">
        Upgrade
      </button>
    </div>
  );
};

export default RetentionBanner;
