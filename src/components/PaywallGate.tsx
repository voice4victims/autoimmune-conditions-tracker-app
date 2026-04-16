import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Crown, CheckCircle } from 'lucide-react';
import { isRevenueCatAvailable } from '@/lib/revenuecat';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';

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
  'Everything in Pro included',
  'Unlimited caregivers with named roles',
  'Family shared dashboard',
  'Emergency provider access links',
  '10 GB document storage',
];

const isPkgPro = (pkg: PurchasesPackage): boolean => {
  const title = (pkg.product.title || '').toLowerCase();
  const id = (pkg.product.identifier || '').toLowerCase();
  return title.includes('pro') || id.includes('pro');
};

const isPkgFamily = (pkg: PurchasesPackage): boolean => {
  const title = (pkg.product.title || '').toLowerCase();
  const id = (pkg.product.identifier || '').toLowerCase();
  return title.includes('family') || id.includes('family');
};

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

  const allPackages = offerings?.current?.availablePackages ?? [];
  const proPackages = allPackages.filter(isPkgPro);
  const familyPackages = allPackages.filter(isPkgFamily);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(pkg.identifier);
    await purchasePackage(pkg);
    setPurchasing(null);
  };

  const handleRestore = async () => {
    setRestoring(true);
    await restore();
    setRestoring(false);
  };

  const renderPackage = (pkg: PurchasesPackage) => {
    const title = pkg.product.title
      .replace(/\s*\(com\.pandastracker\.app[^)]*\)\s*/gi, '')
      .trim();
    const isAnnual = title.toLowerCase().includes('annual') ||
      pkg.product.identifier?.toLowerCase().includes('annual');
    const periodLabel = isAnnual ? 'Annual' : 'Monthly';
    return (
      <Card key={pkg.identifier} className="p-0 overflow-hidden">
        <button
          onClick={() => handlePurchase(pkg)}
          disabled={!!purchasing}
          className="w-full p-3.5 flex items-center justify-between bg-transparent border-none cursor-pointer disabled:opacity-60"
        >
          <div className="text-left min-w-0 flex-1 mr-3">
            <p className="font-sans font-bold text-[14px] text-neutral-800 dark:text-neutral-100 m-0">
              {periodLabel}
            </p>
            <p className="font-sans text-[11px] text-neutral-500 m-0">
              {isAnnual ? '14-day free trial' : 'Cancel anytime'}
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
    );
  };

  const showProSection = !requireFamily;
  const showFamilySection = true;

  return (
    <div className="flex-1 flex flex-col items-center p-6 pb-24 overflow-y-auto">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-serif text-xl text-neutral-800 dark:text-neutral-100">
            Upgrade Your Plan
          </h2>
          {feature && (
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
              <Lock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              {feature} requires {requireFamily ? 'a Family' : 'a Pro'} subscription
            </p>
          )}
        </div>

        {showProSection && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h3 className="font-sans font-bold text-[15px] text-neutral-800 dark:text-neutral-100 m-0">
                Pro
              </h3>
            </div>

            <div className="space-y-1.5">
              {PRO_PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-2.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <span className="font-sans text-[12px] text-neutral-600 dark:text-neutral-300">{perk}</span>
                </div>
              ))}
            </div>

            {proPackages.length > 0 ? (
              <div className="space-y-2">
                {proPackages.map(renderPackage)}
              </div>
            ) : (
              <Card className="p-3 text-center">
                <p className="font-sans text-[12px] text-neutral-500 m-0">
                  Pro plans loading...
                </p>
              </Card>
            )}
          </div>
        )}

        {showFamilySection && (
          <div className="space-y-3">
            {showProSection && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-5" />
            )}

            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h3 className="font-sans font-bold text-[15px] text-neutral-800 dark:text-neutral-100 m-0">
                Family
              </h3>
            </div>

            <div className="space-y-1.5">
              {FAMILY_PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-2.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <span className="font-sans text-[12px] text-neutral-600 dark:text-neutral-300">{perk}</span>
                </div>
              ))}
            </div>

            {familyPackages.length > 0 ? (
              <div className="space-y-2">
                {familyPackages.map(renderPackage)}
              </div>
            ) : (
              <Card className="p-3 text-center">
                <p className="font-sans text-[12px] text-neutral-500 m-0">
                  Family plans loading...
                </p>
              </Card>
            )}
          </div>
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
