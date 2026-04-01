import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { vitalSignsService, enhancedVitalSignsService } from '@/lib/firebaseService';
import { setSecureItem, getSecureItem } from '@/lib/encryption';

const VITAL_TYPES = ['Temperature', 'Heart Rate', 'Blood Pressure', 'Weight', 'Other'];

const FieldWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em]">
      {label}
    </label>
    {children}
  </div>
);

interface VitalSign {
  id: string;
  vital_type?: string;
  temperature?: number;
  heart_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  weight?: number;
  height?: number;
  value?: string;
  date: string;
  time?: string;
  notes?: string;
  created_at: string;
}

const VitalSignsTracker: React.FC = () => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [vType, setVType] = useState('Temperature');
  const [vVal, setVVal] = useState('');
  const [vDate, setVDate] = useState(new Date().toISOString().split('T')[0]);
  const [vTime, setVTime] = useState('');

  useEffect(() => {
    if (childProfile) fetchVitals();
  }, [childProfile]);

  const fetchVitals = async () => {
    if (!childProfile) return;
    try {
      const data = await vitalSignsService.getVitalSigns(user?.uid || '', childProfile.id);
      setVitals(data);
    } catch (error) {
      const key = `pandas-vitals-${childProfile.id}`;
      const stored = await getSecureItem<VitalSign[]>(key);
      setVitals(stored || []);
    }
  };

  const handleSubmit = async () => {
    if (!childProfile || !vVal) return;

    const newVital: Record<string, any> = {
      id: Date.now().toString(),
      child_id: childProfile.id,
      user_id: user?.uid || '',
      vital_type: vType,
      value: vVal,
      date: vDate,
      time: vTime,
      created_at: new Date().toISOString()
    };

    if (vType === 'Temperature') newVital.temperature = parseFloat(vVal);
    else if (vType === 'Heart Rate') newVital.heart_rate = parseInt(vVal);
    else if (vType === 'Weight') newVital.weight = parseFloat(vVal);

    try {
      setLoading(true);
      await vitalSignsService.addVitalSigns(newVital);
      setVitals((prev) => [newVital as VitalSign, ...prev]);
    } catch (error) {
      setVitals((prev) => [newVital as VitalSign, ...prev]);
      const key = `pandas-vitals-${childProfile.id}`;
      const stored = await getSecureItem<VitalSign[]>(key) || [];
      stored.unshift(newVital as VitalSign);
      await setSecureItem(key, stored);
    } finally {
      setLoading(false);
    }

    setVVal('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = async (vitalId: string) => {
    try {
      await enhancedVitalSignsService.deleteVitalSigns(vitalId);
    } catch (error) {}

    const updated = vitals.filter((v) => v.id !== vitalId);
    setVitals(updated);
    if (childProfile) {
      const key = `pandas-vitals-${childProfile.id}`;
      await setSecureItem(key, updated);
    }
    toast({ title: 'Deleted', description: 'Vital sign removed' });
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl mb-3">❤️</p>
          <p className="font-serif text-xl text-neutral-700 dark:text-neutral-200 mb-2">No Child Selected</p>
          <p className="font-sans text-[13px] text-neutral-400">Please select a child to track vital signs</p>
        </CardContent>
      </Card>
    );
  }

  const getPlaceholder = () => {
    if (vType === 'Temperature') return 'e.g. 98.6';
    if (vType === 'Blood Pressure') return 'e.g. 110/70';
    if (vType === 'Heart Rate') return 'e.g. 80';
    if (vType === 'Weight') return 'e.g. 50';
    return 'Enter value';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3.5">
          <h3 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 m-0">Vital Signs</h3>

          <FieldWrap label="Vital Type">
            <Select value={vType} onValueChange={setVType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VITAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldWrap>

          <FieldWrap label="Value">
            <Input value={vVal} onChange={(e) => setVVal(e.target.value)} placeholder={getPlaceholder()} />
          </FieldWrap>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Date">
              <Input type="date" value={vDate} onChange={(e) => setVDate(e.target.value)} />
            </FieldWrap>
            <FieldWrap label="Time">
              <Input type="time" value={vTime} onChange={(e) => setVTime(e.target.value)} />
            </FieldWrap>
          </div>

          {saved ? (
            <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
              <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Vital recorded</span>
            </div>
          ) : (
            <Button className="w-full" onClick={handleSubmit} disabled={loading || !vVal}>
              {loading ? 'Recording...' : 'Record Vital'}
            </Button>
          )}
        </CardContent>
      </Card>

      {vitals.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="font-sans font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.07em] mb-3">
              Vital Signs History
            </p>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {vitals.map((v) => (
                <div key={v.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-sans font-extrabold text-[13px] text-neutral-800 dark:text-neutral-100">
                      {v.vital_type || 'Vital'}: {v.value || [
                        v.temperature && `${v.temperature}°F`,
                        v.heart_rate && `${v.heart_rate} BPM`,
                        v.weight && `${v.weight} lbs`,
                        v.height && `${v.height} in`,
                        v.blood_pressure_systolic && `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}`,
                      ].filter(Boolean).join(', ')}
                    </span>
                    <p className="font-sans text-[11px] text-neutral-400 mt-0.5">{v.date}{v.time ? ` · ${v.time}` : ''}</p>
                    {v.notes && <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 italic">{v.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="text-[11px] text-danger-500 bg-danger-50 border border-danger-200 rounded-lg px-2 py-1 font-bold cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VitalSignsTracker;
