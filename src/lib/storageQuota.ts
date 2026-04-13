import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { isRevenueCatAvailable } from './revenuecat';
import type { SubscriptionTier } from '@/contexts/SubscriptionContext';

const QUOTA_BYTES: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 5 * 1024 * 1024 * 1024,
  family: 10 * 1024 * 1024 * 1024,
};

export function getStorageQuota(tier: SubscriptionTier): number {
  if (!isRevenueCatAvailable()) return Infinity;
  return QUOTA_BYTES[tier];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function getCurrentUsage(userId: string): Promise<number> {
  const q = query(collection(db, 'file_uploads'), where('user_id', '==', userId));
  const snap = await getDocs(q);
  let total = 0;
  snap.forEach(doc => {
    const data = doc.data();
    total += data.file_size || 0;
  });
  return total;
}
