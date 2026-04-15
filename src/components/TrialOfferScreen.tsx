import React, { useState } from 'react';
import { Crown, Check, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';

interface TrialOfferScreenProps {
  onDone: () => void;
}

const FEATURES = [
  'Unlimited symptom & treatment history',
  'Medical records vault',
  'Advanced analytics & insights',
  'Provider sharing via magic links',
  'CSV & PDF exports',
  'Up to 3 caregivers with log access',
];

const formatPrice = (pkg: PurchasesPackage): string => {
  const product = pkg.product;
  return product.priceString || `$${product.price}`;
};

const getPeriodLabel = (identifier: string): string => {
  if (identifier.includes('annual')) return '/year';
  return '/month';
};

const TrialOfferScreen: React.FC<TrialOfferScreenProps> = ({ onDone }) => {
  const { offerings, purchasePackage } = useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const trialOffering = offerings?.all?.['trial_offer'];
  const packages = trialOffering?.availablePackages ?? [];

  const monthlyPkg = packages.find(
    (p) => p.identifier === '$rc_monthly' || p.identifier === 'monthly'
  );
  const annualPkg = packages.find(
    (p) => p.identifier === '$rc_annual' || p.identifier === 'annual'
  );

  const displayPackages = [annualPkg, monthlyPkg].filter(Boolean) as PurchasesPackage[];

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(pkg.identifier);
    try {
      await purchasePackage(pkg);
    } catch {
      // silent
    } finally {
      setPurchasing(null);
      onDone();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center px-6 overflow-y-auto pt-[var(--sat)] pb-[var(--sab)]"
      style={{ background: 'linear-gradient(135deg, #176F91, #573F9E)' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center py-12">
        <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mb-6">
          <Crown className="w-8 h-8 text-amber-300" />
        </div>

        <h1 className="font-serif text-[26px] text-white text-center mb-2 leading-tight">
          Start Your Free Trial
        </h1>
        <p className="font-sans text-[14px] text-white/70 text-center mb-8">
          Try all Pro features free for 14 days
        </p>

        <div className="w-full space-y-3 mb-8">
          {FEATURES.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald-300" />
              </div>
              <span className="font-sans text-[13px] text-white/90 leading-snug">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {displayPackages.length > 0 ? (
          <div className="w-full space-y-3 mb-6">
            {displayPackages.map((pkg) => {
              const isAnnual = pkg.identifier.includes('annual');
              return (
                <button
                  key={pkg.identifier}
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasing !== null}
                  className={`w-full rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer border transition-all ${
                    isAnnual
                      ? 'bg-white text-neutral-900 border-white/30'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                  } ${purchasing === pkg.identifier ? 'opacity-70' : ''}`}
                >
                  <div className="text-left">
                    <p className={`font-sans font-bold text-[14px] ${isAnnual ? 'text-neutral-900' : 'text-white'}`}>
                      {isAnnual ? 'Annual' : 'Monthly'}
                    </p>
                    <p className={`font-sans text-[11px] ${isAnnual ? 'text-neutral-500' : 'text-white/60'}`}>
                      14-day free trial
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {purchasing === pkg.identifier && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <span className={`font-sans font-bold text-[15px] ${isAnnual ? 'text-neutral-900' : 'text-white'}`}>
                      {formatPrice(pkg)}{getPeriodLabel(pkg.identifier)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-white/10 border border-white/20 px-5 py-4 mb-6">
            <p className="font-sans text-[13px] text-white/70 text-center">
              Trial packages loading...
            </p>
          </div>
        )}

        <button
          onClick={onDone}
          disabled={purchasing !== null}
          className="font-sans font-semibold text-[13px] text-white/50 bg-transparent border-none cursor-pointer py-3 px-6 hover:text-white/70 transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default TrialOfferScreen;
