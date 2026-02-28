import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bell } from 'lucide-react';
import { medicationService } from '@/lib/firebaseService';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import ReminderForm from './ReminderForm';
import ReminderList from './ReminderList';
import NotificationSettings from './NotificationSettings';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';

interface Reminder {
  id: string;
  medication_name: string;
  dosage?: string;
  frequency: string;
  times: string[];
  start_date: string;
  end_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

const MedicationReminders: React.FC = () => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Initialize notifications
  useReminderNotifications(reminders);

  useEffect(() => {
    if (childProfile && user) {
      fetchReminders();
    }
  }, [childProfile, user]);

  const fetchReminders = async () => {
    if (!childProfile || !user) return;

    try {
      const reminders = await medicationService.getReminders(user.uid, childProfile.id);
      setReminders(reminders as Reminder[]);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load medication reminders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReminder = async (reminderData: any) => {
    if (!childProfile || !user) return;

    try {
      if (editingReminder) {
        await medicationService.updateReminder(editingReminder.id, {
          ...reminderData,
          child_id: childProfile.id,
          user_id: user.uid
        });
        toast({
          title: 'Success',
          description: 'Medication reminder updated successfully'
        });
      } else {
        await medicationService.addReminder({
          ...reminderData,
          child_id: childProfile.id,
          user_id: user.uid,
          is_active: true
        });
        toast({
          title: 'Success',
          description: 'Medication reminder created successfully'
        });
      }

      setShowForm(false);
      setEditingReminder(null);
      fetchReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to save medication reminder',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await medicationService.deleteReminder(reminderId);
      toast({
        title: 'Success',
        description: 'Medication reminder deleted successfully'
      });
      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete medication reminder',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await medicationService.updateReminder(id, { is_active: isActive });
      toast({
        title: 'Success',
        description: `Reminder ${isActive ? 'activated' : 'deactivated'} successfully`
      });
      fetchReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reminder',
        variant: 'destructive'
      });
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingReminder(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-4">Loading medication reminders...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Medication Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Set up reminders for medications and supplements
            </p>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </div>

          {showForm && (
            <div className="mb-6">
              <ReminderForm
                reminder={editingReminder}
                onSave={handleSaveReminder}
                onCancel={handleCancelEdit}
              />
            </div>
          )}

          <ReminderList
            reminders={reminders}
            onEdit={handleEditReminder}
            onDelete={handleDeleteReminder}
            onToggleActive={handleToggleActive}
          />
        </CardContent>
      </Card>

      <NotificationSettings />
    </div>
  );
};

export default MedicationReminders;