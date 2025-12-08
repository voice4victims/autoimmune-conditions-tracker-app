import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Activity, List, Trash2 } from 'lucide-react';
import { setSecureItem, getSecureItem } from '@/lib/encryption';

interface VitalSign {
  id: string;
  temperature?: number;
  heart_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  weight?: number;
  height?: number;
  date: string;
  notes?: string;
  created_at: string;
}

const VitalSignsTracker: React.FC = () => {
  const { childProfile } = useApp();
  const { toast } = useToast();
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    temperature: '',
    heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    weight: '',
    height: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (childProfile) {
      fetchVitals();
    }
  }, [childProfile]);

  const fetchVitals = async () => {
    if (!childProfile) return;
    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('child_id', childProfile.id)
        .order('date', { ascending: false });
      if (error) throw error;
      setVitals(data || []);
    } catch (error) {
      console.log('Loading vitals from secure storage:', error);
      const key = `pandas-vitals-${childProfile.id}`;
      const stored = getSecureItem<VitalSign[]>(key);
      setVitals(stored || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childProfile) return;

    const newVital = {
      id: Date.now().toString(),
      child_id: childProfile.id,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : undefined,
      blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : undefined,
      blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      date: formData.date,
      notes: formData.notes,
      created_at: new Date().toISOString()
    };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vital_signs')
        .insert([newVital])
        .select()
        .single();
      if (error) throw error;
      setVitals(prev => [data, ...prev]);
    } catch (error) {
      console.log('Saving vital to secure storage:', error);
      setVitals(prev => [newVital, ...prev]);
      const key = `pandas-vitals-${childProfile.id}`;
      const stored = getSecureItem<VitalSign[]>(key) || [];
      stored.unshift(newVital);
      setSecureItem(key, stored);
    } finally {
      setLoading(false);
    }

    setFormData({
      temperature: '',
      heart_rate: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      weight: '',
      height: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });

    toast({ title: 'Success', description: 'Vital signs recorded successfully' });
  };

  const handleDelete = async (vitalId: string) => {
    try {
      const { error } = await supabase
        .from('vital_signs')
        .delete()
        .eq('id', vitalId);
      if (error) throw error;
    } catch (error) {
      console.log('Deleting vital from secure storage:', error);
    }

    setVitals(prev => {
      const updated = prev.filter(vital => vital.id !== vitalId);
      if (childProfile) {
        const key = `pandas-vitals-${childProfile.id}`;
        setSecureItem(key, updated);
      }
      return updated;
    });

    toast({ title: 'Success', description: 'Vital sign deleted successfully' });
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Child Selected</h3>
          <p className="text-gray-500 text-center">Please select a child to track vital signs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Vital Signs Tracker</h3>
        <p className="text-gray-600">Monitor and track vital signs for {childProfile.name}</p>
      </div>

      <Tabs defaultValue="record" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="record" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Record
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record">
          <Card>
            <CardHeader>
              <CardTitle>Record Vital Signs</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="temperature">Temperature (°F)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                      placeholder="98.6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heart_rate">Heart Rate (BPM)</Label>
                    <Input
                      id="heart_rate"
                      type="number"
                      value={formData.heart_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, heart_rate: e.target.value }))}
                      placeholder="80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (inches)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                      placeholder="48"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Recording...' : 'Record Vital Signs'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs History</CardTitle>
            </CardHeader>
            <CardContent>
              {vitals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No vital signs recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {vitals.map((vital) => (
                    <div key={vital.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{vital.date}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vital.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {vital.temperature && <div>Temp: {vital.temperature}°F</div>}
                        {vital.heart_rate && <div>HR: {vital.heart_rate} BPM</div>}
                        {vital.weight && <div>Weight: {vital.weight} lbs</div>}
                        {vital.height && <div>Height: {vital.height} in</div>}
                      </div>
                      {vital.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          Notes: {vital.notes}
                        </div>
                      )}
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

export default VitalSignsTracker;