import { useState, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';

interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermissionState>({
    granted: false,
    denied: false,
    default: true
  });

  const idCounterRef = useRef(Date.now());

  useEffect(() => {
    const checkPermission = async () => {
      if (Capacitor.isNativePlatform()) {
        const [localResult, pushResult] = await Promise.all([
          LocalNotifications.checkPermissions(),
          PushNotifications.checkPermissions().catch(() => ({ receive: 'prompt' as const }))
        ]);
        const granted = localResult.display === 'granted' || pushResult.receive === 'granted';
        setPermission({
          granted,
          denied: localResult.display === 'denied' && pushResult.receive === 'denied',
          default: !granted && (localResult.display === 'prompt' || pushResult.receive === 'prompt')
        });
      } else if ('Notification' in window) {
        const currentPermission = Notification.permission;
        setPermission({
          granted: currentPermission === 'granted',
          denied: currentPermission === 'denied',
          default: currentPermission === 'default'
        });
      }
    };
    checkPermission();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const [localResult, pushResult] = await Promise.all([
          LocalNotifications.requestPermissions(),
          PushNotifications.requestPermissions().catch(() => ({ receive: 'denied' as const }))
        ]);
        const granted = localResult.display === 'granted' || pushResult.receive === 'granted';
        setPermission({ granted, denied: !granted, default: false });
        if (granted) {
          toast({ title: 'Success', description: 'Notifications enabled successfully' });
        } else {
          toast({ title: 'Permission Denied', description: 'Please enable notifications in device settings', variant: 'destructive' });
        }
        return granted;
      }

      if (!('Notification' in window)) {
        toast({ title: 'Not Supported', description: 'Notifications are not supported in this browser', variant: 'destructive' });
        return false;
      }

      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      setPermission({ granted, denied: result === 'denied', default: result === 'default' });

      if (granted) {
        toast({ title: 'Success', description: 'Notifications enabled successfully' });
      } else {
        toast({ title: 'Permission Denied', description: 'Please enable notifications in your browser settings', variant: 'destructive' });
      }
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!permission.granted) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [{
            title,
            body: options?.body || '',
            id: idCounterRef.current++,
            schedule: { at: new Date(Date.now() + 100) },
          }]
        });
        return;
      }

      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  return { permission, requestPermission, showNotification };
};

export default useNotifications;
