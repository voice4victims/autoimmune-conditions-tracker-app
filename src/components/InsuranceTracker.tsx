import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InsuranceData {
  provider: string;
  memberId: string;
  groupId: string;
  planName: string;
  phone: string;
  copay: string;
  deductible: string;
  outOfPocket: string;
  priorAuth: string;
  notes: string;
}

const BLANK: InsuranceData = {
  provider: '', memberId: '', groupId: '', planName: '',
  phone: '', copay: '', deductible: '', outOfPocket: '',
  priorAuth: '', notes: '',
};

const FieldWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="font-sans font-extrabold text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.07em]">
      {label}
    </label>
    {children}
  </div>
);

const InsuranceTracker: React.FC = () => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const [ins, setIns] = useState<InsuranceData>(BLANK);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && childProfile?.id) loadInsurance();
  }, [user?.uid, childProfile?.id]);

  const loadInsurance = async () => {
    if (!user?.uid || !childProfile?.id) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'insurance_info', `${user.uid}_${childProfile.id}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) setIns(snap.data() as InsuranceData);
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user?.uid || !childProfile?.id) return;
    try {
      const docRef = doc(db, 'insurance_info', `${user.uid}_${childProfile.id}`);
      await setDoc(docRef, {
        ...ins,
        user_id: user.uid,
        child_id: childProfile.id,
        updated_at: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
  };

  const update = (field: keyof InsuranceData, value: string) =>
    setIns(p => ({ ...p, [field]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <Card className="dark:bg-neutral-800 dark:border-neutral-700">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-xl text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <span className="text-2xl">🪪</span> Insurance Information
          </CardTitle>
          <p className="font-sans text-[13px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
            Store your insurance details, policy numbers, and pre-authorization information securely.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrap label="Insurance Provider">
              <Input
                value={ins.provider}
                onChange={e => update('provider', e.target.value)}
                placeholder="e.g. Blue Cross Blue Shield"
                className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
              />
            </FieldWrap>
            <FieldWrap label="Plan Name">
              <Input
                value={ins.planName}
                onChange={e => update('planName', e.target.value)}
                placeholder="e.g. PPO Gold 500"
                className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
              />
            </FieldWrap>
            <FieldWrap label="Member ID">
              <Input
                value={ins.memberId}
                onChange={e => update('memberId', e.target.value)}
                placeholder="e.g. XYZ123456789"
                className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
              />
            </FieldWrap>
            <FieldWrap label="Group ID">
              <Input
                value={ins.groupId}
                onChange={e => update('groupId', e.target.value)}
                placeholder="e.g. GRP-001234"
                className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
              />
            </FieldWrap>
            <FieldWrap label="Phone Number">
              <Input
                value={ins.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="e.g. 1-800-555-0199"
                className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
              />
            </FieldWrap>
            <FieldWrap label="Copay Amount">
              <Input
                value={ins.copay}
                onChange={e => update('copay', e.target.value)}
                placeholder="e.g. $30"
                className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
              />
            </FieldWrap>
            <FieldWrap label="Deductible">
              <Input
                value={ins.deductible}
                onChange={e => update('deductible', e.target.value)}
                placeholder="e.g. $1,500"
                className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
              />
            </FieldWrap>
            <FieldWrap label="Out-of-Pocket Maximum">
              <Input
                value={ins.outOfPocket}
                onChange={e => update('outOfPocket', e.target.value)}
                placeholder="e.g. $6,000"
                className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100"
              />
            </FieldWrap>
          </div>

          <FieldWrap label="Prior Authorization Notes">
            <textarea
              value={ins.priorAuth}
              onChange={e => update('priorAuth', e.target.value)}
              placeholder="Auth numbers, approval dates, valid through dates..."
              className="w-full font-sans text-[13px] text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl p-3 outline-none resize-none min-h-[80px] leading-relaxed"
            />
          </FieldWrap>

          <FieldWrap label="Additional Notes">
            <textarea
              value={ins.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Any additional insurance information..."
              className="w-full font-sans text-[13px] text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl p-3 outline-none resize-none min-h-[80px] leading-relaxed"
            />
          </FieldWrap>

          {saved ? (
            <div className="p-3.5 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800 text-center">
              <span className="font-sans font-extrabold text-sm text-green-600 dark:text-green-400">
                ✓ Insurance information saved
              </span>
            </div>
          ) : (
            <Button
              onClick={handleSave}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-sans font-extrabold text-sm py-3 rounded-xl"
            >
              Save Insurance Info
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InsuranceTracker;
