import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import LabResultsOCR from './LabResultsOCR';

const VITAL_TYPES = [
  { type: 'temperature', unit: '°F', label: 'Temperature' },
  { type: 'heart_rate', unit: 'bpm', label: 'Heart Rate' },
  { type: 'blood_pressure_systolic', unit: 'mmHg', label: 'Blood Pressure (Systolic)' },
  { type: 'blood_pressure_diastolic', unit: 'mmHg', label: 'Blood Pressure (Diastolic)' },
  { type: 'weight', unit: 'lbs', label: 'Weight' },
  { type: 'height', unit: 'inches', label: 'Height' },
  { type: 'oxygen_saturation', unit: '%', label: 'Oxygen Saturation' },
  { type: 'respiratory_rate', unit: 'breaths/min', label: 'Respiratory Rate' },
  { type: 'blood_sugar', unit: 'mg/dL', label: 'Blood Sugar' }
];

interface VitalSignFormProps {
  onVitalAdded: () => void;
}

const VitalSignForm: React.FC<VitalSignFormProps> = ({ onVitalAdded }) => {
  const [vitalType, setVitalType] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [customVitals, setCustomVitals] = useState<Array<{type: string, unit: string, label: string}>>([]);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const { toast } = useToast();
  const { childProfile } = useApp();
  const { user } = useAuth();

  const allVitals = [...VITAL_TYPES, ...customVitals];

  const handleAddCustomVital = () => {
    if (!customLabel || !customUnit) return;
    
    const customType = customLabel.toLowerCase().replace(/\s+/g, '_');
    const newVital = {
      type: customType,
      unit: customUnit,
      label: customLabel
    };
    
    setCustomVitals(prev => [...prev, newVital]);
    setCustomLabel('');
    setCustomUnit('');
    setShowCustomDialog(false);
    
    toast({
      title: 'Custom Vital Added',
      description: `${customLabel} has been added to your vital signs.`
    });
  };

  const handleLabDataExtracted = (labData: any) => {
    // Auto-populate form fields based on extracted lab data
    Object.entries(labData).forEach(([key, val]) => {
      if (val && typeof val === 'number' && VITAL_TYPES.find(v => v.type === key)) {
        setVitalType(key);
        setValue(val.toString());
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childProfile || !user || !vitalType || !value) return;

    setLoading(true);
    try {
      const vitalInfo = allVitals.find(v => v.type === vitalType);
      const { error } = await supabase
        .from('vital_signs')
        .insert({
          child_id: childProfile.id,
          user_id: user.id,
          vital_type: vitalType,
          value: parseFloat(value),
          unit: vitalInfo?.unit || '',
          notes: notes || null
        });

      if (error) throw error;

      toast({
        title: 'Vital Sign Added',
        description: `${vitalInfo?.label} recorded successfully.`
      });

      setVitalType('');
      setValue('');
      setNotes('');
      onVitalAdded();
    } catch (error) {
      console.error('Error adding vital sign:', error);
      toast({
        title: 'Error',
        description: 'Failed to add vital sign. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <LabResultsOCR onLabDataExtracted={handleLabDataExtracted} />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Record Vital Sign
            <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Custom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Vital Sign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custom-label">Vital Sign Name</Label>
                    <Input
                      id="custom-label"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="e.g., Blood Pressure"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-unit">Unit</Label>
                    <Input
                      id="custom-unit"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      placeholder="e.g., mmHg, mg/dL"
                    />
                  </div>
                  <Button onClick={handleAddCustomVital} disabled={!customLabel || !customUnit}>
                    Add Custom Vital
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vital-type">Vital Sign Type</Label>
            <Select value={vitalType} onValueChange={setVitalType}>
              <SelectTrigger>
                <SelectValue placeholder="Select vital sign type" />
              </SelectTrigger>
              <SelectContent>
                {allVitals.map(vital => (
                  <SelectItem key={vital.type} value={vital.type}>
                    {vital.label} ({vital.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              type="number"
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading || !vitalType || !value}>
            {loading ? 'Recording...' : 'Record Vital Sign'}
          </Button>
        </form>
      </CardContent>
      </Card>
    </div>
  );
};

export default VitalSignForm;