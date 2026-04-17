import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  Purchases,
  ENTITLEMENT_PRO,
  ENTITLEMENT_FAMILY,
  initRevenueCat,
  identifyUser,
  resetUser,
  isRevenueCatAvailable,
  computeRcId,
  isRcUserIdentified,
} from '@/lib/revenuecat';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PurchasesCallbackId,
} from '@revenuecat/purchases-capacitor';

export type SubscriptionTier = 'free' | 'pro' | 'family';

export interface SubscriptionState {
  tier: SubscriptionTier;
  isPro: boolean;
  isFamily: boolean;
  isTrialing: boolean;
  trialExpirationDate: string | null;
  loading: boolean;
  offerings: PurchasesOfferings | null;
  purchasePackage: (pkg: PurchasesPackage, onError?: (err: unknown) => void) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshOfferings: () => Promise<void>;
}

const defaultState: SubscriptionState = {
  tier: 'free',
  isPro: false,
  isFamily: false,
  isTrialing: false,
  trialExpirationDate: null,
  loading: true,
  offerings: null,
  purchasePackage: async () => false,
  restore: async () => false,
  refreshOfferings: async () => {},
};

export const SubscriptionContext = createContext<SubscriptionState>(defaultState);

function deriveTier(info: CustomerInfo): { tier: SubscriptionTier; isTrialing: boolean; trialExpirationDate: string | null } {
  const familyEnt = info.entitlements.active[ENTITLEMENT_FAMILY];
  if (familyEnt) {
    return { tier: 'family', isTrialing: familyEnt.periodType === 'TRIAL', trialExpirationDate: familyEnt.periodType === 'TRIAL' ? familyEnt.expirationDate ?? null : null };
  }
  const proEnt = info.entitlements.active[ENTITLEMENT_PRO];
  if (proEnt) {
    return { tier: 'pro', isTrialing: proEnt.periodType === 'TRIAL', trialExpirationDate: proEnt.periodType === 'TRIAL' ? proEnt.expirationDate ?? null : null };
  }
  return { tier: 'free', isTrialing: false, trialExpirationDate: null };
}

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialExpirationDate, setTrialExpirationDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const listenerIdRef = useRef<PurchasesCallbackId | null>(null);
  const initializedRef = useRef(false);
  const userRef = useRef(user);
  const identifyPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const ensureIdentified = useCallback(async (): Promise<void> => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    const expectedId = await computeRcId(currentUser.uid);
    if (await isRcUserIdentified(expectedId)) return;
    if (!identifyPromiseRef.current) {
      identifyPromiseRef.current = identifyUser(currentUser.uid).finally(() => {
        identifyPromiseRef.current = null;
      });
    }
    await identifyPromiseRef.current;
  }, []);

  const processCustomerInfo = useCallback((info: CustomerInfo) => {
    const derived = deriveTier(info);
    setTier(derived.tier);
    setIsTrialing(derived.isTrialing);
    setTrialExpirationDate(derived.trialExpirationDate);
  }, []);

  const selfHealFromCustomerInfo = useCallback(async (info: CustomerInfo): Promise<void> => {
    const hasActiveEntitlement =
      !!info.entitlements.active[ENTITLEMENT_PRO] ||
      !!info.entitlements.active[ENTITLEMENT_FAMILY];
    if (!hasActiveEntitlement) return;
    try {
      const { appUserID } = await Purchases.getAppUserID();
      if (appUserID.startsWith('$RCAnonymousID:')) {
        await ensureIdentified();
        await Purchases.restorePurchases().catch(() => {});
      }
    } catch {
      // no-op — best-effort self-heal
    }
  }, [ensureIdentified]);

  useEffect(() => {
    if (!isRevenueCatAvailable()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      const ok = await initRevenueCat();
      if (!ok || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      initializedRef.current = true;

      if (userRef.current) {
        await ensureIdentified();
      }

      try {
        const { customerInfo: info } = await Purchases.getCustomerInfo();
        if (!cancelled) {
          processCustomerInfo(info);
          await selfHealFromCustomerInfo(info);
        }
      } catch {
        // no-op
      }

      try {
        const off = await Purchases.getOfferings();
        if (!cancelled) setOfferings(off);
      } catch {
        // no-op
      }

      try {
        const { id } = await Purchases.addCustomerInfoUpdateListener((info) => {
          processCustomerInfo(info);
        });
        if (!cancelled) listenerIdRef.current = id;
      } catch {
        // no-op
      }

      if (!cancelled) setLoading(false);
    };

    init();

    return () => {
      cancelled = true;
      if (listenerIdRef.current) {
        Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: listenerIdRef.current }).catch(() => {});
        listenerIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;

    if (user) {
      (async () => {
        await ensureIdentified();
        try {
          const { customerInfo: info } = await Purchases.getCustomerInfo();
          processCustomerInfo(info);
          await selfHealFromCustomerInfo(info);
        } catch {
          // no-op
        }
      })();
    } else {
      resetUser();
      setTier('free');
      setIsTrialing(false);
      setTrialExpirationDate(null);
    }
  }, [user?.uid, ensureIdentified]);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const data = snap.data();
      if (!data?.subscriptionTier) return;

      const firestoreTier = data.subscriptionTier as SubscriptionTier;
      setTier((current) => {
        if (firestoreTier === 'family') return 'family';
        if (firestoreTier === 'pro' && current !== 'family') return 'pro';
        return current;
      });
    }, () => {});

    return unsub;
  }, [user?.uid]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage, onError?: (err: unknown) => void): Promise<boolean> => {
    try {
      await ensureIdentified();
      const { customerInfo: info } = await Purchases.purchasePackage({ aPackage: pkg });
      processCustomerInfo(info);
      const derived = deriveTier(info);
      return derived.tier !== 'free';
    } catch (err) {
      if (onError) onError(err);
      return false;
    }
  }, [processCustomerInfo, ensureIdentified]);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      await ensureIdentified();
      const { customerInfo: info } = await Purchases.restorePurchases();
      processCustomerInfo(info);
      const derived = deriveTier(info);
      return derived.tier !== 'free';
    } catch {
      return false;
    }
  }, [processCustomerInfo, ensureIdentified]);

  const refreshOfferings = useCallback(async () => {
    try {
      const off = await Purchases.getOfferings();
      setOfferings(off);
    } catch {
      // no-op
    }
  }, []);

  const isPro = tier === 'pro' || tier === 'family';
  const isFamily = tier === 'family';

  return (
    <SubscriptionContext.Provider
      value={{ tier, isPro, isFamily, isTrialing, trialExpirationDate, loading, offerings, purchasePackage, restore, refreshOfferings }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
