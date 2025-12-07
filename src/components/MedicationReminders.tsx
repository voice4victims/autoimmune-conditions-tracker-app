import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
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
  is_active: boolean;
  notes?: string;
}

const MedicationReminders: React.FC = () => {
  const { childProfile } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const { testNotification } = useReminderNotifications({
    reminders,
    notificationsEnabled
  });

  useEffect(() => {
    if (childProfile) {
      fetchReminders();
      // Load notification preference from localStorage
      const savedPref = localStorage.getItem(`notifications-${childProfile.id}`);
      setNotificationsEnabled(savedPref === 'true');
    }
  }, [childProfile]);

  const fetchReminders = async () => {
    if (!childProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('child_id', childProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReminders(data || []);
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

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (childProfile) {
      localStorage.setItem(`notifications-${childProfile.id}`, enabled.toString());
    }
    
    if (enabled) {
      toast({
        title: 'Notifications Enabled',
        description: 'You will receive push notifications for active reminders'
      });
      // Test notification
      setTimeout(() => {
        testNotification();
      }, 1000);
    } else {
      toast({
        title: 'Notifications Disabled',
        description: 'Push notifications have been turned off'
      });
    }
  };

  const handleSubmit = async (reminderData: any) => {
    if (!childProfile) return;

    try {
      if (editingReminder) {
        const { error } = await supabase
          .from('medication_reminders')
          .update({
            ...reminderData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReminder.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Medication reminder updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('medication_reminders')
          .insert({
            ...reminderData,
            child_id: childProfile.id
          });

        if (error) throw error;
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

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
      const { error } = await supabase
        .from('medication_reminders')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: `Reminder ${isActive ? 'activated' : 'deactivated'} successfully`
      });
      fetchReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reminder status',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReminder(null);
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Bell className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Child Selected
          </h3>
          <p className="text-gray-500 text-center">
            Please select a child to manage medication reminders
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showForm) {
    return (
      <ReminderForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        existingReminder={editingReminder}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Medication Reminders
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </div>
        </CardHeader>
      </Card>

      <NotificationSettings
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
      />

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading reminders...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ReminderList
          reminders={reminders}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}
    </div>
  );
};

export default MedicationReminders;