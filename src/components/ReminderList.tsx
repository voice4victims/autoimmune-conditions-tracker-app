import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Clock, Calendar } from 'lucide-react';

interface Reminder {
  id: string;
  medication_name: string;
  dosage?: string;
  frequency: string;
  times: string[];
  start_date: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
}

interface ReminderListProps {
  reminders: Reminder[];
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const ReminderList: React.FC<ReminderListProps> = ({ reminders, onEdit, onDelete, onToggleActive }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (reminders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Medication Reminders
          </h3>
          <p className="text-gray-500 text-center">
            Add your first medication reminder to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <Card key={reminder.id} className={`${!reminder.is_active ? 'opacity-60' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{reminder.medication_name}</CardTitle>
                {reminder.dosage && (
                  <p className="text-sm text-gray-600 mt-1">{reminder.dosage}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant={reminder.is_active ? 'default' : 'secondary'}>
                  {reminder.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{reminder.frequency}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {reminder.times.map(time => formatTime(time)).join(', ')}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {formatDate(reminder.start_date)}
                  {reminder.end_date && ` - ${formatDate(reminder.end_date)}`}
                </span>
              </div>
              
              {reminder.notes && (
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {reminder.notes}
                </p>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(reminder)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={reminder.is_active ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => onToggleActive(reminder.id, !reminder.is_active)}
                >
                  {reminder.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(reminder.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReminderList;