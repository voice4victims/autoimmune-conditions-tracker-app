import { useEffect, useCallback, useRef } from 'react';
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

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function notifIdFor(reminderId: string, time: string): number {
  return Math.abs(hashCode(`${reminderId}-${time}`)) % 2147483647;
}

export const useReminderNotifications = ({
  reminders,
  notificationsEnabled
}: UseReminderNotificationsProps) => {
  const { permission, showNotification } = useNotifications();
  const webTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleNotification = useCallback(async (reminder: Reminder, time: string) => {
    if (!notificationsEnabled || !permission.granted || !reminder.is_active) return;

    const [hours, minutes] = time.split(':').map(Number);
    const notifId = notifIdFor(reminder.id, time);

    const title = `Medication Reminder: ${reminder.medication_name}`;
    const body = reminder.dosage
      ? `Time to take ${reminder.dosage} of ${reminder.medication_name}`
      : `Time to take ${reminder.medication_name}`;

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: notifId }] }).catch(() => {});
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

    const existing = webTimeoutsRef.current.get(notifId);
    if (existing) clearTimeout(existing);

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    const timeUntilNotification = scheduledTime.getTime() - now.getTime();
    const handle = setTimeout(() => {
      showNotification(title, {
        body,
        tag: `reminder-${reminder.id}-${time}`,
        requireInteraction: true,
      });
      scheduleNotification(reminder, time);
    }, timeUntilNotification);
    webTimeoutsRef.current.set(notifId, handle);
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

    const desiredIds = new Set<number>();
    reminders.forEach(reminder => {
      if (reminder.is_active) {
        reminder.times.forEach(time => {
          desiredIds.add(notifIdFor(reminder.id, time));
        });
      }
    });

    const cancelStale = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const pending = await LocalNotifications.getPending();
          const toCancel = pending.notifications
            .filter(n => !desiredIds.has(n.id as number))
            .map(n => ({ id: n.id as number }));
          if (toCancel.length > 0) {
            await LocalNotifications.cancel({ notifications: toCancel });
          }
        } catch (error) {
          console.error('Failed to cancel stale notifications:', error);
        }
      } else {
        webTimeoutsRef.current.forEach((handle, id) => {
          if (!desiredIds.has(id)) {
            clearTimeout(handle);
            webTimeoutsRef.current.delete(id);
          }
        });
      }
    };

    cancelStale().then(() => {
      reminders.forEach(reminder => {
        if (reminder.is_active) {
          reminder.times.forEach(time => {
            scheduleNotification(reminder, time);
          });
        }
      });
    });
  }, [reminders, notificationsEnabled, permission.granted, scheduleNotification]);

  useEffect(() => {
    return () => {
      webTimeoutsRef.current.forEach(handle => clearTimeout(handle));
      webTimeoutsRef.current.clear();
    };
  }, []);

  return { testNotification };
};

export default useReminderNotifications;
