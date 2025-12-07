import { useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';

interface Reminder {
  id: string;
  medication_name: string;
  dosage?: string;
  times: string[];
  is_active: boolean;
}

interface UseReminderNotificationsProps {
  reminders: Reminder[];
  notificationsEnabled: boolean;
}

export const useReminderNotifications = ({
  reminders,
  notificationsEnabled
}: UseReminderNotificationsProps) => {
  const { permission, showNotification } = useNotifications();

  const scheduleNotification = useCallback((reminder: Reminder, time: string) => {
    if (!notificationsEnabled || !permission.granted || !reminder.is_active) {
      return;
    }

    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      const title = `Medication Reminder: ${reminder.medication_name}`;
      const body = reminder.dosage 
        ? `Time to take ${reminder.dosage} of ${reminder.medication_name}`
        : `Time to take ${reminder.medication_name}`;

      showNotification(title, {
        body,
        tag: `reminder-${reminder.id}-${time}`,
        requireInteraction: true,
        actions: [
          {
            action: 'taken',
            title: 'Mark as Taken'
          },
          {
            action: 'snooze',
            title: 'Snooze 10 min'
          }
        ]
      });

      // Schedule next day's notification
      setTimeout(() => {
        scheduleNotification(reminder, time);
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilNotification);
  }, [notificationsEnabled, permission.granted, showNotification]);

  const testNotification = useCallback(() => {
    if (!notificationsEnabled || !permission.granted) {
      return false;
    }

    showNotification('Test Notification', {
      body: 'This is a test notification to verify push notifications are working.',
      tag: 'test-notification'
    });
    return true;
  }, [notificationsEnabled, permission.granted, showNotification]);

  useEffect(() => {
    if (!notificationsEnabled || !permission.granted) {
      return;
    }

    // Schedule notifications for all active reminders
    reminders.forEach(reminder => {
      if (reminder.is_active) {
        reminder.times.forEach(time => {
          scheduleNotification(reminder, time);
        });
      }
    });
  }, [reminders, notificationsEnabled, permission.granted, scheduleNotification]);

  return {
    testNotification
  };
};

export default useReminderNotifications;