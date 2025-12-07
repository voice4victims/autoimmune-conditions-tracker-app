import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus } from 'lucide-react';

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
  const [activityType, setActivityType] = useState<'screen_time' | 'outdoor' | 'indoor'>('screen_time');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName || !duration) return;

    onSubmit({
      activity_name: activityName,
      activity_type: activityType,
      duration_minutes: parseInt(duration),
      date,
      notes: notes || undefined
    });

    // Reset form
    setActivityName('');
    setDuration('');
    setNotes('');
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'screen_time': return 'Screen Time';
      case 'outdoor': return 'Outdoor Activity';
      case 'indoor': return 'Indoor Activity';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Log Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="activity-name">Activity Name</Label>
              <Input
                id="activity-name"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="e.g., iPad games, Soccer, Reading"
                required
              />
            </div>
            <div>
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select value={activityType} onValueChange={(value: 'screen_time' | 'outdoor' | 'indoor') => setActivityType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screen_time">Screen Time</SelectItem>
                  <SelectItem value="outdoor">Outdoor Activity</SelectItem>
                  <SelectItem value="indoor">Indoor Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
            />
          </div>
          
          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Log Activity
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ActivityForm;