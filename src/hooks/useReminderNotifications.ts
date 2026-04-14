import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
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

  const scheduleNotification = useCallback(async (reminder: Reminder, time: string) => {
    if (!notificationsEnabled || !permission.granted || !reminder.is_active) return;

    const [hours, minutes] = time.split(':').map(Number);

    const title = `Medication Reminder: ${reminder.medication_name}`;
    const body = reminder.dosage
      ? `Time to take ${reminder.dosage} of ${reminder.medication_name}`
      : `Time to take ${reminder.medication_name}`;

    if (Capacitor.isNativePlatform()) {
      const notifId = Math.abs(hashCode(`${reminder.id}-${time}`)) % 2147483647;
      try {
        await LocalNotifications.schedule({
          notifications: [{
            title,
            body,
            id: notifId,
            schedule: {
              on: { hour: hours, minute: minutes },
              repeats: true,
            },
          }]
        });
      } catch (error) {
        console.error('Failed to schedule notification:', error);
      }
      return;
    }

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    const timeUntilNotification = scheduledTime.getTime() - now.getTime();
    setTimeout(() => {
      showNotification(title, {
        body,
        tag: `reminder-${reminder.id}-${time}`,
        requireInteraction: true,
      });
      setTimeout(() => scheduleNotification(reminder, time), 24 * 60 * 60 * 1000);
    }, timeUntilNotification);
  }, [notificationsEnabled, permission.granted, showNotification]);

  const testNotification = useCallback(() => {
    if (!notificationsEnabled || !permission.granted) return false;
    showNotification('Test Notification', {
      body: 'This is a test notification to verify push notifications are working.',
      tag: 'test-notification'
    });
    return true;
  }, [notificationsEnabled, permission.granted, showNotification]);

  useEffect(() => {
    if (!notificationsEnabled || !permission.granted) return;

    reminders.forEach(reminder => {
      if (reminder.is_active) {
        reminder.times.forEach(time => {
          scheduleNotification(reminder, time);
        });
      }
    });
  }, [reminders, notificationsEnabled, permission.granted, scheduleNotification]);

  return { testNotification };
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export default useReminderNotifications;
