import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CreditCard } from 'lucide-react';

const InsuranceManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    planName: '',
    memberId: '',
    groupId: '',
    phone: '',
    copay: '',
    deductible: '',
    outOfPocket: '',
    priorAuth: '',
    notes: '',
  });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getDoc(doc(db, 'insurance_info', user.uid))
      .then(snap => {
        if (snap.exists()) {
          setFormData(prev => ({ ...prev, ...snap.data() }));
        }
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load insurance info', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'insurance_info', user.uid), { ...formData, updated_at: new Date().toISOString() }, { merge: true });
      toast({ title: 'Saved', description: 'Insurance information updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save insurance info', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(p => ({ ...p, [field]: e.target.value }));

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading insurance information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Insurance Information</h3>
        <p className="text-gray-600">Store your family's insurance details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Insurance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Insurance Provider</Label>
              <Input value={formData.provider} onChange={set('provider')} placeholder="e.g. Blue Cross" />
            </div>
            <div>
              <Label>Plan Name</Label>
              <Input value={formData.planName} onChange={set('planName')} placeholder="e.g. PPO Gold" />
            </div>
            <div>
              <Label>Member ID</Label>
              <Input value={formData.memberId} onChange={set('memberId')} placeholder="Member ID" />
            </div>
            <div>
              <Label>Group ID</Label>
              <Input value={formData.groupId} onChange={set('groupId')} placeholder="Group number" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={formData.phone} onChange={set('phone')} placeholder="Customer service #" />
            </div>
            <div>
              <Label>Copay</Label>
              <Input value={formData.copay} onChange={set('copay')} placeholder="e.g. $30" />
            </div>
            <div>
              <Label>Deductible</Label>
              <Input value={formData.deductible} onChange={set('deductible')} placeholder="e.g. $1,500" />
            </div>
            <div>
              <Label>Out-of-Pocket Max</Label>
              <Input value={formData.outOfPocket} onChange={set('outOfPocket')} placeholder="e.g. $5,000" />
            </div>
          </div>
          <div>
            <Label>Prior Authorization Notes</Label>
            <Textarea value={formData.priorAuth} onChange={set('priorAuth')} placeholder="Prior auth details, reference numbers..." />
          </div>
          <div>
            <Label>Additional Notes</Label>
            <Textarea value={formData.notes} onChange={set('notes')} placeholder="Any additional insurance notes..." />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Insurance Info'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsuranceManager;
