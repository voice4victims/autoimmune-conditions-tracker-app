import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { LAB_TEST_TYPES } from '@/types/pandas';
import { Plus, History, FlaskConical } from 'lucide-react';

interface LabResultDoc {
  id: string;
  test: string;
  value: string;
  unit: string;
  referenceRange?: string;
  date: string;
  flag: string;
  notes?: string;
  child_id: string;
  user_id: string;
}

const FLAG_COLORS: Record<string, string> = {
  normal: 'bg-green-100 text-green-800',
  borderline: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
  low: 'bg-blue-100 text-blue-800',
};

const LabValuesTracker: React.FC = () => {
  const { user } = useAuth();
  const { childProfile } = useApp();
  const { toast } = useToast();
  const [results, setResults] = useState<LabResultDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    test: '',
    value: '',
    unit: '',
    referenceRange: '',
    date: new Date().toISOString().split('T')[0],
    flag: 'normal',
    notes: '',
  });

  const fetchResults = async () => {
    if (!user || !childProfile) return;
    try {
      const q = query(
        collection(db, 'lab_results'),
        where('user_id', '==', user.uid),
        where('child_id', '==', childProfile.id),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      setResults(snap.docs.map(d => ({ id: d.id, ...d.data() } as LabResultDoc)));
    } catch {
      toast({ title: 'Error', description: 'Failed to load lab results', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchResults();
  }, [user, childProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !childProfile || !formData.test || !formData.value) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'lab_results'), {
        ...formData,
        user_id: user.uid,
        child_id: childProfile.id,
        created_at: serverTimestamp(),
      });
      setFormData({ test: '', value: '', unit: '', referenceRange: '', date: new Date().toISOString().split('T')[0], flag: 'normal', notes: '' });
      toast({ title: 'Success', description: 'Lab result saved' });
      await fetchResults();
    } catch {
      toast({ title: 'Error', description: 'Failed to save lab result', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FlaskConical className="w-12 h-12 text-gray-400 mb-2" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Child Selected</h3>
          <p className="text-gray-500 text-center">Select a child to track lab values</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Lab Values Tracker</h3>
        <p className="text-gray-600">Track lab results for {childProfile.name}</p>
      </div>

      <Tabs defaultValue="add" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Result
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History ({results.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Record Lab Result</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Test Type</Label>
                  <Select value={formData.test} onValueChange={v => setFormData(p => ({ ...p, test: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                    <SelectContent>
                      {LAB_TEST_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Value</Label>
                    <Input value={formData.value} onChange={e => setFormData(p => ({ ...p, value: e.target.value }))} placeholder="e.g. 200" required />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input value={formData.unit} onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. IU/mL" />
                  </div>
                </div>
                <div>
                  <Label>Reference Range</Label>
                  <Input value={formData.referenceRange} onChange={e => setFormData(p => ({ ...p, referenceRange: e.target.value }))} placeholder="e.g. 0-200 IU/mL" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Flag</Label>
                    <Select value={formData.flag} onValueChange={v => setFormData(p => ({ ...p, flag: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="borderline">Borderline</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Lab Result'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Lab History</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No lab results recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {results.map(r => (
                    <div key={r.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{r.test}</span>
                        <Badge className={FLAG_COLORS[r.flag] || 'bg-gray-100 text-gray-800'}>{r.flag}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {r.value} {r.unit} {r.referenceRange && `(ref: ${r.referenceRange})`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{r.date}</div>
                      {r.notes && <div className="text-xs text-gray-600 mt-2">{r.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LabValuesTracker;
