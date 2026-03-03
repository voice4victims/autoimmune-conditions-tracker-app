import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, History } from 'lucide-react';
import { TREATMENT_SIDE_EFFECTS } from '@/types/pandas';

const HELP_LABELS = ['No help', 'Slight', 'Moderate', 'Good', 'Excellent'];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  discontinued: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};

const TreatmentTracker: React.FC = () => {
  const { childProfile, treatments, addTreatment, loadTreatments } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    treatment_type: '',
    medication_name: '',
    dosage: '',
    administration_date: new Date().toISOString().split('T')[0],
    administration_time: '',
    symptoms_improved: false,
    improvement_notes: '',
    status: 'active' as string,
    helpRating: undefined as number | undefined,
    worsenedPans: false,
    sideEffects: [] as string[],
    failReason: '',
    endDate: '',
  });

  useEffect(() => {
    if (childProfile) {
      loadTreatments();
    }
  }, [childProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childProfile) return;

    try {
      setLoading(true);
      const payload: Record<string, unknown> = { ...formData };
      if (formData.sideEffects.length === 0) delete payload.sideEffects;
      if (!formData.failReason) delete payload.failReason;
      if (!formData.endDate) delete payload.endDate;
      if (formData.helpRating === undefined) delete payload.helpRating;

      await addTreatment(payload);
      setFormData({
        treatment_type: '',
        medication_name: '',
        dosage: '',
        administration_date: new Date().toISOString().split('T')[0],
        administration_time: '',
        symptoms_improved: false,
        improvement_notes: '',
        status: 'active',
        helpRating: undefined,
        worsenedPans: false,
        sideEffects: [],
        failReason: '',
        endDate: '',
      });
      toast({ title: 'Success', description: 'Treatment recorded successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to record treatment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSideEffect = (effect: string) => {
    setFormData(prev => ({
      ...prev,
      sideEffects: prev.sideEffects.includes(effect)
        ? prev.sideEffects.filter(e => e !== effect)
        : [...prev.sideEffects, effect],
    }));
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Child Selected</h3>
          <p className="text-gray-500 text-center">Please select a child to track treatments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Treatment Tracker</h3>
        <p className="text-gray-600">Track treatments for {childProfile.name}</p>
      </div>

      <Tabs defaultValue="add" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Treatment
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Record Treatment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Treatment Type</Label>
                  <Select value={formData.treatment_type} onValueChange={v => setFormData(p => ({ ...p, treatment_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select treatment type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="antibiotic">Antibiotic</SelectItem>
                      <SelectItem value="anti-inflammatory">Anti-Inflammatory</SelectItem>
                      <SelectItem value="immunotherapy">Immunotherapy</SelectItem>
                      <SelectItem value="supplement">Supplement</SelectItem>
                      <SelectItem value="psychiatric">Psychiatric Medication</SelectItem>
                      <SelectItem value="behavioral-therapy">Behavioral Therapy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Medication/Treatment Name</Label>
                  <Input
                    value={formData.medication_name}
                    onChange={e => setFormData(p => ({ ...p, medication_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Dosage</Label>
                  <Input
                    value={formData.dosage}
                    onChange={e => setFormData(p => ({ ...p, dosage: e.target.value }))}
                    placeholder="e.g., 250mg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={formData.administration_date} onChange={e => setFormData(p => ({ ...p, administration_date: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" value={formData.administration_time} onChange={e => setFormData(p => ({ ...p, administration_time: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">How much did this help? (0-4)</Label>
                  <div className="flex gap-1">
                    {HELP_LABELS.map((label, i) => (
                      <Button
                        key={i}
                        type="button"
                        variant={formData.helpRating === i ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setFormData(p => ({ ...p, helpRating: i }))}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="worsenedPans"
                    checked={formData.worsenedPans}
                    onCheckedChange={v => setFormData(p => ({ ...p, worsenedPans: !!v }))}
                  />
                  <Label htmlFor="worsenedPans" className="text-sm">Worsened PANS/PANDAS symptoms?</Label>
                </div>

                <div>
                  <Label className="mb-2 block">Side Effects</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TREATMENT_SIDE_EFFECTS.map(effect => (
                      <div key={effect} className="flex items-center gap-2">
                        <Checkbox
                          id={`se-${effect}`}
                          checked={formData.sideEffects.includes(effect)}
                          onCheckedChange={() => toggleSideEffect(effect)}
                        />
                        <Label htmlFor={`se-${effect}`} className="text-xs font-normal">{effect}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.status === 'failed' && (
                  <div>
                    <Label>Reason for Failure</Label>
                    <Textarea
                      value={formData.failReason}
                      onChange={e => setFormData(p => ({ ...p, failReason: e.target.value }))}
                      placeholder="Why was this treatment stopped?"
                    />
                  </div>
                )}

                {formData.status !== 'active' && (
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                )}

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.improvement_notes}
                    onChange={e => setFormData(p => ({ ...p, improvement_notes: e.target.value }))}
                    placeholder="Any notes about the treatment..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Recording...' : 'Record Treatment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Treatment History</CardTitle>
            </CardHeader>
            <CardContent>
              {treatments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No treatments recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {treatments.map((treatment) => (
                    <div key={treatment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{treatment.medication_name}</div>
                          <div className="text-sm text-gray-600">{treatment.treatment_type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {treatment.status && (
                            <Badge className={STATUS_COLORS[treatment.status] || 'bg-gray-100 text-gray-800'}>
                              {treatment.status}
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">{treatment.administration_date}</span>
                        </div>
                      </div>
                      {treatment.dosage && (
                        <div className="text-sm mb-1">Dosage: {treatment.dosage}</div>
                      )}
                      {treatment.helpRating !== undefined && (
                        <div className="text-sm mb-1">
                          Effectiveness: {HELP_LABELS[treatment.helpRating] || treatment.helpRating}
                        </div>
                      )}
                      {treatment.worsenedPans && (
                        <Badge variant="destructive" className="text-xs mb-1">Worsened PANS</Badge>
                      )}
                      {treatment.sideEffects && treatment.sideEffects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {treatment.sideEffects.map(se => (
                            <Badge key={se} variant="outline" className="text-xs">{se}</Badge>
                          ))}
                        </div>
                      )}
                      {treatment.failReason && (
                        <div className="text-sm text-red-600 mt-1">Failure reason: {treatment.failReason}</div>
                      )}
                      {treatment.endDate && (
                        <div className="text-xs text-gray-500 mt-1">Ended: {treatment.endDate}</div>
                      )}
                      {treatment.improvement_notes && (
                        <div className="text-sm text-gray-600 mt-1">Notes: {treatment.improvement_notes}</div>
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

export default TreatmentTracker;
