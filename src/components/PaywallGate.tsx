import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Crown, CheckCircle } from 'lucide-react';
import { isRevenueCatAvailable } from '@/lib/revenuecat';

interface PaywallGateProps {
  children: React.ReactNode;
  feature?: string;
  requireFamily?: boolean;
}

const PRO_PERKS = [
  'Unlimited data retention & history',
  'Unlimited child profiles',
  'Medical records vault & patient profile',
  'Advanced analytics & pattern insights',
  'Provider sharing via magic links',
  'CSV & PDF data exports',
  '5 GB document storage',
];

const FAMILY_PERKS = [
  'Everything in Pro',
  'Unlimited caregivers',
  'Named role assignments',
  '10 GB document storage',
];

const PaywallGate: React.FC<PaywallGateProps> = ({ children, feature, requireFamily }) => {
  const { isPro, isFamily, loading, offerings, purchasePackage, restore } = useSubscription();
  const [restoring, setRestoring] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  const hasAccess = requireFamily ? isFamily : isPro;
  if (hasAccess || !isRevenueCatAvailable()) return <>{children}</>;

  const packages = offerings?.current?.availablePackages ?? [];
  const perks = requireFamily ? FAMILY_PERKS : PRO_PERKS;
  const tierLabel = requireFamily ? 'Family' : 'Pro';

  const handlePurchase = async (pkg: typeof packages[0]) => {
    setPurchasing(pkg.identifier);
    await purchasePackage(pkg);
    setPurchasing(null);
  };

  const handleRestore = async () => {
    setRestoring(true);
    await restore();
    setRestoring(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-serif text-xl text-neutral-800 dark:text-neutral-100">
            Upgrade to {tierLabel}
          </h2>
          {feature && (
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
              <Lock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              {feature} requires a {tierLabel} subscription
            </p>
          )}
        </div>

        <div className="space-y-2">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span className="font-sans text-[13px] text-neutral-700 dark:text-neutral-300">{perk}</span>
            </div>
          ))}
        </div>

        {packages.length > 0 ? (
          <div className="space-y-2.5">
            {packages.map((pkg) => (
              <Card key={pkg.identifier} className="p-0 overflow-hidden">
                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={!!purchasing}
                  className="w-full p-4 flex items-center justify-between bg-transparent border-none cursor-pointer disabled:opacity-60"
                >
                  <div className="text-left">
                    <p className="font-sans font-bold text-[14px] text-neutral-800 dark:text-neutral-100 m-0">
                      {pkg.product.title}
                    </p>
                    <p className="font-sans text-[12px] text-neutral-500 m-0">
                      {pkg.product.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {purchasing === pkg.identifier && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    )}
                    <Badge className="bg-primary-500 text-white border-0 font-bold text-[12px]">
                      {pkg.product.priceString}
                    </Badge>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-4 text-center">
            <p className="font-sans text-[13px] text-neutral-500 m-0">
              No plans available right now. Check back soon.
            </p>
          </Card>
        )}

        <p className="font-sans text-[11px] text-center text-neutral-400">
          Start with a 14-day free trial. Cancel anytime.
        </p>

        <button
          onClick={handleRestore}
          disabled={restoring}
          className="w-full font-sans text-[13px] font-semibold text-primary-500 bg-transparent border-none cursor-pointer py-2 disabled:opacity-50"
        >
          {restoring ? 'Restoring...' : 'Restore Purchases'}
        </button>
      </div>
    </div>
  );
};

export default PaywallGate;
