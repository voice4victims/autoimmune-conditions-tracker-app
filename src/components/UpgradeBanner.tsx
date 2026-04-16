import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown } from 'lucide-react';
import { isRevenueCatAvailable } from '@/lib/revenuecat';

interface UpgradeBannerProps {
  onUpgrade: () => void;
  compact?: boolean;
}

const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ onUpgrade, compact }) => {
  const { isPro, loading } = useSubscription();

  if (loading || isPro || !isRevenueCatAvailable()) return null;

  if (compact) {
    return (
      <button
        onClick={onUpgrade}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-white font-sans font-bold text-[11px] border-none cursor-pointer"
      >
        <Crown className="w-3 h-3" />
        Upgrade
      </button>
    );
  }

  return (
    <button
      onClick={onUpgrade}
      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-amber-200 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30 cursor-pointer text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
        <Crown className="w-4.5 h-4.5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-sans font-extrabold text-[13px] text-amber-800 dark:text-amber-200 m-0">
          Upgrade to Pro or Family
        </p>
        <p className="font-sans text-[11px] text-amber-600 dark:text-amber-400 m-0">
          Unlock all features & unlimited tracking
        </p>
      </div>
      <span className="text-amber-400 text-xs shrink-0">›</span>
    </button>
  );
};

export default UpgradeBanner;
