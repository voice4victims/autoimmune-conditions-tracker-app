import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Loader2, FlaskConical, CheckCircle, Crown } from 'lucide-react';

const BetaProgram: React.FC = () => {
  const { user } = useAuth();
  const { isPro, isFamily, tier } = useSubscription();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const redeemFn = httpsCallable<{ code: string }, { tier: string }>(functions, 'redeemBetaCode');
      await redeemFn({ code: code.trim() });
      setRedeemed(true);
      setCode('');
    } catch (err: any) {
      const msg = err?.message || 'Failed to redeem code';
      if (msg.includes('already been redeemed')) {
        setError('This code has already been used.');
      } else if (msg.includes('already have beta access')) {
        setError('You already have beta access.');
      } else if (msg.includes('Invalid beta code')) {
        setError('Invalid code. Please check and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (redeemed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 mb-2">
          Welcome to the Beta!
        </h2>
        <p className="font-sans text-[13px] text-neutral-500 dark:text-neutral-400 text-center max-w-xs mb-4">
          You're in! Pro features are now unlocked. In 7 days, you'll automatically upgrade to the Family plan — permanently, no charges.
        </p>
        <Badge className="bg-primary-500 text-white border-0 font-bold text-[12px] px-3 py-1">
          <Crown className="w-3 h-3 mr-1" />
          Pro Plan (Family in 7 days)
        </Badge>
        <p className="font-sans text-[11px] text-neutral-400 mt-6 text-center">
          Refresh the app to see Pro features unlocked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="w-5 h-5 text-primary-500" />
            Beta Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-sans text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Have a beta invitation code? Enter it below to start your beta journey. You'll get Pro access immediately, then upgrade to Family automatically after 7 days — permanently, as a thank you for early feedback.
          </p>

          {(isPro || isFamily) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <p className="font-sans text-[12px] text-green-700 dark:text-green-300 m-0">
                You already have {tier === 'family' ? 'Family' : 'Pro'} access.
              </p>
            </div>
          )}

          <form onSubmit={handleRedeem} className="space-y-3">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="XXXX-XXXX"
              className="font-mono text-center text-lg tracking-widest"
              maxLength={9}
              disabled={loading}
            />

            {error && (
              <p className="font-sans text-[12px] text-red-500 m-0">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length < 9}
              className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-sans font-bold text-[13px] border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Redeem Code'
              )}
            </button>
          </form>

          <p className="font-sans text-[11px] text-neutral-400 text-center">
            Limited to 10 beta testers. Codes are single-use.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BetaProgram;
