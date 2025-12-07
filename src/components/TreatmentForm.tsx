import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from 'lucide-react';
import LabResultsOCR from './LabResultsOCR';
interface TreatmentFormProps {
  onAddTreatment: (treatment: any) => void;
}

const TreatmentForm: React.FC<TreatmentFormProps> = ({ onAddTreatment }) => {
  const [treatmentType, setTreatmentType] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [symptomsImproved, setSymptomsImproved] = useState(false);
  const [improvementNotes, setImprovementNotes] = useState('');

  const handleOCRData = (data: any) => {
    if (data.treatment_type) setTreatmentType(data.treatment_type);
    if (data.medication_name) setMedicationName(data.medication_name);
    if (data.dosage) setDosage(data.dosage);
    if (data.start_date) setDate(data.start_date);
    if (data.notes) setImprovementNotes(data.notes);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const treatment = {
      treatment_type: treatmentType,
      medication_name: medicationName,
      dosage,
      administration_date: date,
      administration_time: time,
      symptoms_improved: symptomsImproved,
      improvement_notes: improvementNotes
    };

    onAddTreatment(treatment);
    
    // Reset form
    setTreatmentType('');
    setMedicationName('');
    setDosage('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().slice(0, 5));
    setSymptomsImproved(false);
    setImprovementNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Add Treatment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <LabResultsOCR 
            onDataExtracted={handleOCRData}
            formType="treatments"
            title="Extract Treatment Data from Image"
          />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="treatmentType">Treatment Type</Label>
              <Select value={treatmentType} onValueChange={setTreatmentType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steroids">Steroids</SelectItem>
                  <SelectItem value="ivig">IVIG</SelectItem>
                  <SelectItem value="painkillers">Pain Killers</SelectItem>
                  <SelectItem value="antibiotics">Antibiotics</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="medicationName">Medication Name</Label>
              <Input
                id="medicationName"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                placeholder="e.g., Prednisone"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g., 10mg, 2 tablets"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date Given</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="time">Time Given</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="symptomsImproved"
              checked={symptomsImproved}
              onCheckedChange={setSymptomsImproved}
            />
            <Label htmlFor="symptomsImproved">Symptoms Improved</Label>
          </div>

          <div>
            <Label htmlFor="improvementNotes">Notes on Improvement</Label>
            <Textarea
              id="improvementNotes"
              value={improvementNotes}
              onChange={(e) => setImprovementNotes(e.target.value)}
              placeholder="Describe any changes in symptoms..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            Add Treatment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TreatmentForm;