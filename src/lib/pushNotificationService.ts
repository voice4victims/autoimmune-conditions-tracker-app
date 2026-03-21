import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

let pushToken: string | null = null;

export function getPushToken(): string | null {
  return pushToken;
}

export async function initPushNotifications(userId: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      return null;
    }

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', async (token: Token) => {
        pushToken = token.value;
        await savePushToken(userId, token.value);
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
        resolve(null);
      });

      PushNotifications.register();
    });
  } catch (error) {
    console.error('Failed to init push notifications:', error);
    return null;
  }
}

async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const platform = Capacitor.getPlatform();
    await setDoc(doc(db, 'push_tokens', userId), {
      token,
      platform,
      updated_at: Timestamp.now(),
      user_id: userId
    }, { merge: true });
  } catch (error) {
    console.error('Failed to save push token:', error);
  }
}

export function setupPushListeners(onNotification?: (notification: PushNotificationSchema) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  const receivedListener = PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      onNotification?.(notification);
    }
  );

  const actionListener = PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: ActionPerformed) => {
      const data = action.notification.data;
      if (data?.route) {
        window.location.hash = data.route;
      }
    }
  );

  return () => {
    receivedListener.then(l => l.remove());
    actionListener.then(l => l.remove());
  };
}

export async function removePushToken(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await setDoc(doc(db, 'push_tokens', userId), {
      token: null,
      updated_at: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to remove push token:', error);
  }
}
