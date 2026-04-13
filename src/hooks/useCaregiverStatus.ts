import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { db, functions } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { isRevenueCatAvailable } from '@/lib/revenuecat';

interface CaregiverStatus {
  isCaregiver: boolean;
  canWrite: boolean;
  role: string | null;
  ownerTier: string | null;
  loading: boolean;
  logEntry: (childId: string, collectionName: string, data: Record<string, unknown>) => Promise<string | null>;
  upgradeMessage: string | null;
}

export function useCaregiverStatus(): CaregiverStatus {
  const { user } = useAuth();
  const { childProfile } = useApp();
  const [isCaregiver, setIsCaregiver] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [ownerTier, setOwnerTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !childProfile) {
      setIsCaregiver(false);
      setCanWrite(false);
      setRole(null);
      setOwnerTier(null);
      setLoading(false);
      return;
    }

    if ((childProfile as any).userId === user.uid) {
      setIsCaregiver(false);
      setCanWrite(true);
      setRole(null);
      setOwnerTier(null);
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      setLoading(true);
      try {
        const ownerUid = (childProfile as any).userId;
        const accessDocId = `${ownerUid}_${user.uid}`;
        const accessDoc = await getDoc(doc(db, 'family_access', accessDocId));

        if (accessDoc.exists() && accessDoc.data().is_active) {
          const accessData = accessDoc.data();
          setIsCaregiver(true);
          setRole(accessData.role);

          const writeRoles = ['caregiver', 'admin', 'parent'];
          const hasWriteRole = writeRoles.includes(accessData.role);

          const ownerDoc = await getDoc(doc(db, 'users', ownerUid));
          const tier = ownerDoc.data()?.subscriptionTier || 'free';
          setOwnerTier(tier);

          setCanWrite(hasWriteRole && tier !== 'free');
        } else {
          setIsCaregiver(false);
          setCanWrite(false);
        }
      } catch {
        setIsCaregiver(false);
        setCanWrite(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user?.uid, childProfile?.id]);

  const logEntry = async (
    childId: string,
    collectionName: string,
    data: Record<string, unknown>
  ): Promise<string | null> => {
    try {
      const fn = httpsCallable<
        { childId: string; collectionName: string; data: Record<string, unknown> },
        { id: string }
      >(functions, 'caregiverLogEntry');
      const result = await fn({ childId, collectionName, data });
      return result.data.id;
    } catch {
      return null;
    }
  };

  let upgradeMessage: string | null = null;
  if (isCaregiver && !canWrite && isRevenueCatAvailable()) {
    if (role === 'viewer') {
      upgradeMessage = 'Your access is view-only. The account owner can upgrade to Pro to enable logging.';
    } else if (ownerTier === 'free') {
      upgradeMessage = 'Logging is not available on the free plan. The account owner needs to upgrade to Pro.';
    }
  }

  return { isCaregiver, canWrite, role, ownerTier, loading, logEntry, upgradeMessage };
}
