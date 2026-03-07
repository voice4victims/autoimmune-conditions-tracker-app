import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const ACTIVITY_TYPES = ['Screen Time', 'Physical Activity', 'Social Interaction', 'School/Learning', 'Therapy', 'Outdoor Activity', 'Other'];

const FieldWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em]">
      {label}
    </label>
    {children}
  </div>
);

interface ActivityFormProps {
  onSubmit: (activity: {
    activity_name: string;
    activity_type: 'screen_time' | 'outdoor' | 'indoor';
    duration_minutes: number;
    date: string;
    notes?: string;
  }) => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ onSubmit }) => {
  const [activityName, setActivityName] = useState('');
  const [activityType, setActivityType] = useState('Screen Time');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const typeToValue = (t: string): 'screen_time' | 'outdoor' | 'indoor' => {
    if (t === 'Screen Time') return 'screen_time';
    if (t === 'Outdoor Activity') return 'outdoor';
    return 'indoor';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName || !duration) return;

    onSubmit({
      activity_name: activityName,
      activity_type: typeToValue(activityType),
      duration_minutes: parseInt(duration),
      date,
      notes: notes || undefined
    });

    setActivityName('');
    setDuration('');
    setNotes('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3.5">
        <h3 className="font-serif text-xl text-neutral-800 m-0">Log Activity</h3>

        <FieldWrap label="Activity Name">
          <Input value={activityName} onChange={(e) => setActivityName(e.target.value)} placeholder="e.g. 30 min walk, Lego time..." />
        </FieldWrap>

        <FieldWrap label="Activity Type">
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldWrap>

        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Duration (min)">
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
          </FieldWrap>
          <FieldWrap label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FieldWrap>
        </div>

        <FieldWrap label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any observations..." className="min-h-[68px] resize-none" />
        </FieldWrap>

        {saved ? (
          <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
            <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Activity logged</span>
          </div>
        ) : (
          <Button type="submit" className="w-full" onClick={handleSubmit} disabled={!activityName || !duration}>
            Log Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityForm;
