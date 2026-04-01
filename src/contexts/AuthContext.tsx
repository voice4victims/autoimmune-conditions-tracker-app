
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { HIPAAComplianceService } from '@/lib/hipaaCompliance';
import { sessionManager } from '@/lib/security/sessionManager';
import { accessControlService } from '@/lib/security/accessControl';
import { getCachedSecure, setCachedSecure, removeCachedSecure } from '@/lib/secureStorageService';
import { authenticateWithBiometric } from '@/lib/biometricService';
import { initPushNotifications, setupPushListeners, removePushToken } from '@/lib/pushNotificationService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionId: string | null;
  signOut: () => Promise<void>;
  signInWithBiometrics: () => Promise<boolean>;
  demoMode: boolean;
  isSessionValid: boolean;
  elevateSession: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sessionId: null,
  signOut: async () => { },
  signInWithBiometrics: async () => false,
  demoMode: false,
  isSessionValid: false,
  elevateSession: async () => false,
  refreshSession: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const validationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signingOutRef = useRef(false);
  const pushCleanupRef = useRef<(() => void) | null>(null);

  const getClientInfo = () => {
    return {
      ipAddress: undefined,
      userAgent: navigator.userAgent,
      deviceFingerprint: generateDeviceFingerprint()
    };
  };

  const generateDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    const canvasFingerprint = canvas.toDataURL();

    const fingerprint = btoa(JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvasFingerprint.substring(0, 50)
    }));

    return fingerprint;
  };

  const clearValidationInterval = useCallback(() => {
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = null;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;

    try {
      clearValidationInterval();
      if (pushCleanupRef.current) {
        pushCleanupRef.current();
        pushCleanupRef.current = null;
      }

      if (user) {
        await removePushToken(user.uid).catch(() => {});
        await HIPAAComplianceService.logAccess(
          user.uid,
          'logout',
          'authentication',
          undefined,
          false,
          undefined,
          'User initiated logout'
        ).catch(() => {});
      }

      if (sessionIdRef.current) {
        await sessionManager.invalidateSession(sessionIdRef.current, 'User initiated logout').catch(() => {});
      }

      sessionIdRef.current = null;
      setSessionId(null);
      setIsSessionValid(false);
      removeCachedSecure('currentUserId');
      removeCachedSecure('currentSessionId');

      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      signingOutRef.current = false;
    }
  }, [user, clearValidationInterval]);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      setUser(firebaseUser);
      setDemoMode(firebaseUser?.isAnonymous || false);

      if (firebaseUser) {
        const existingSessionId = getCachedSecure('currentSessionId');
        const existingUserId = getCachedSecure('currentUserId');

        if (existingSessionId && existingUserId === firebaseUser.uid) {
          sessionIdRef.current = existingSessionId;
          setSessionId(existingSessionId);
          setIsSessionValid(true);
          startValidationInterval(firebaseUser.uid, existingSessionId);
          initPushNotifications(firebaseUser.uid).catch(() => {});
          pushCleanupRef.current = setupPushListeners();
        } else {
          try {
            const clientInfo = getClientInfo();
            const newSessionId = await sessionManager.createSession(
              firebaseUser,
              clientInfo.ipAddress,
              clientInfo.userAgent,
              clientInfo.deviceFingerprint,
              'standard'
            );

            if (!mounted) return;

            sessionIdRef.current = newSessionId;
            setSessionId(newSessionId);
            setIsSessionValid(true);

            setCachedSecure('currentUserId', firebaseUser.uid);
            setCachedSecure('currentSessionId', newSessionId);

            await HIPAAComplianceService.logAccess(
              firebaseUser.uid,
              'login',
              'authentication',
              undefined,
              false,
              undefined,
              firebaseUser.isAnonymous ? 'Anonymous login' : 'User login'
            ).catch(() => {});

            startValidationInterval(firebaseUser.uid, newSessionId);
            initPushNotifications(firebaseUser.uid).catch(() => {});
            pushCleanupRef.current = setupPushListeners();
          } catch (error) {
            console.error('Error creating secure session:', error);
            if (mounted) {
              sessionIdRef.current = null;
              setSessionId(null);
              setIsSessionValid(true);
            }
          }
        }
      } else {
        clearValidationInterval();
        const oldSessionId = sessionIdRef.current;
        sessionIdRef.current = null;
        setSessionId(null);
        setIsSessionValid(false);
        removeCachedSecure('currentUserId');
        removeCachedSecure('currentSessionId');

        if (oldSessionId) {
          await sessionManager.invalidateSession(oldSessionId, 'User logout').catch(() => {});
        }
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
      clearValidationInterval();
    };
  }, []);

  const startValidationInterval = (userId: string, sid: string) => {
    clearValidationInterval();

    const validate = async () => {
      if (signingOutRef.current) return;
      if (sessionIdRef.current !== sid) return;

      try {
        const clientInfo = getClientInfo();
        const validation = await sessionManager.validateSession(
          sid,
          userId,
          clientInfo.ipAddress,
          clientInfo.userAgent
        );

        if (sessionIdRef.current !== sid) return;

        if (validation.isValid) {
          setIsSessionValid(true);
        } else if (validation.reason === 'Session expired' || validation.reason === 'Session invalidated') {
          clearValidationInterval();
          await signOut();
        }
      } catch (error) {
        console.error('Session validation error:', error);
      }
    };

    validationIntervalRef.current = setInterval(validate, 30000);
  };

  const signInWithBiometrics = async (): Promise<boolean> => {
    try {
      const uid = await authenticateWithBiometric();
      if (!uid) return false;
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        return true;
      }
      if (currentUser && currentUser.uid !== uid) {
        return false;
      }
      return false;
    } catch (error) {
      console.error('Biometric sign-in failed:', error);
      return false;
    }
  };

  const elevateSession = async (): Promise<boolean> => {
    if (!user || !sessionIdRef.current) return false;

    try {
      const success = await sessionManager.elevateSessionSecurity(sessionIdRef.current, user.uid);
      return success;
    } catch (error) {
      console.error('Error elevating session:', error);
      return false;
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    if (!user || !sessionIdRef.current) return false;

    try {
      const clientInfo = getClientInfo();
      const validation = await sessionManager.validateSession(
        sessionIdRef.current,
        user.uid,
        clientInfo.ipAddress,
        clientInfo.userAgent
      );

      setIsSessionValid(validation.isValid);
      return validation.isValid;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      sessionId,
      signOut,
      signInWithBiometrics,
      demoMode,
      isSessionValid,
      elevateSession,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
