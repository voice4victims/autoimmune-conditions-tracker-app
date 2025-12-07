import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, History, Trash2 } from 'lucide-react';

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
    improvement_notes: ''
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
      await addTreatment(formData);
      setFormData({
        treatment_type: '',
        medication_name: '',
        dosage: '',
        administration_date: new Date().toISOString().split('T')[0],
        administration_time: '',
        symptoms_improved: false,
        improvement_notes: ''
      });
      toast({ title: 'Success', description: 'Treatment recorded successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to record treatment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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
                  <Label htmlFor="treatment_type">Treatment Type</Label>
                  <Select value={formData.treatment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, treatment_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select treatment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="antibiotic">Antibiotic</SelectItem>
                      <SelectItem value="supplement">Supplement</SelectItem>
                      <SelectItem value="therapy">Therapy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="medication_name">Medication/Treatment Name</Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 250mg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="administration_date">Date</Label>
                    <Input
                      id="administration_date"
                      type="date"
                      value={formData.administration_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, administration_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="administration_time">Time</Label>
                    <Input
                      id="administration_time"
                      type="time"
                      value={formData.administration_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, administration_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="improvement_notes">Notes</Label>
                  <Textarea
                    id="improvement_notes"
                    value={formData.improvement_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, improvement_notes: e.target.value }))}
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
                        <div className="text-sm text-gray-500">
                          {treatment.administration_date}
                        </div>
                      </div>
                      {treatment.dosage && (
                        <div className="text-sm mb-2">Dosage: {treatment.dosage}</div>
                      )}
                      {treatment.improvement_notes && (
                        <div className="text-sm text-gray-600">
                          Notes: {treatment.improvement_notes}
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

export default TreatmentTracker;