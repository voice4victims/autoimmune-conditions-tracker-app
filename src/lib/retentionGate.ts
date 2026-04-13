import { isRevenueCatAvailable } from './revenuecat';

const FREE_RETENTION_DAYS = 30;

export function getRetentionCutoff(isPro: boolean): Date | null {
  if (isPro || !isRevenueCatAvailable()) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FREE_RETENTION_DAYS);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

export function filterByRetention<T>(
  items: T[],
  dateAccessor: (item: T) => string | Date,
  isPro: boolean
): T[] {
  const cutoff = getRetentionCutoff(isPro);
  if (!cutoff) return items;
  return items.filter((item) => {
    const d = dateAccessor(item);
    return new Date(d) >= cutoff;
  });
}

export { FREE_RETENTION_DAYS };
