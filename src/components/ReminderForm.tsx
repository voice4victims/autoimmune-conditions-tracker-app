import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';

interface ReminderFormProps {
  onSubmit: (reminder: any) => void;
  onCancel: () => void;
  existingReminder?: any;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ onSubmit, onCancel, existingReminder }) => {
  const [medicationName, setMedicationName] = useState(existingReminder?.medication_name || '');
  const [dosage, setDosage] = useState(existingReminder?.dosage || '');
  const [frequency, setFrequency] = useState(existingReminder?.frequency || 'daily');
  const [times, setTimes] = useState<string[]>(existingReminder?.times || ['']);
  const [startDate, setStartDate] = useState(existingReminder?.start_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(existingReminder?.end_date || '');
  const [notes, setNotes] = useState(existingReminder?.notes || '');

  const addTime = () => {
    setTimes([...times, '']);
  };

  const removeTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validTimes = times.filter(time => time.trim() !== '');
    if (validTimes.length === 0) {
      alert('Please add at least one reminder time');
      return;
    }
    
    onSubmit({
      medication_name: medicationName,
      dosage,
      frequency,
      times: validTimes,
      start_date: startDate,
      end_date: endDate || null,
      notes
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingReminder ? 'Edit' : 'Add'} Medication Reminder</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="medication">Medication Name *</Label>
            <Input
              id="medication"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g., 10mg, 1 tablet"
            />
          </div>

          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="as-needed">As Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Reminder Times *</Label>
            {times.map((time, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => updateTime(index, e.target.value)}
                  className="flex-1"
                />
                {times.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTime(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTime}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Time
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or instructions"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {existingReminder ? 'Update' : 'Create'} Reminder
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReminderForm;