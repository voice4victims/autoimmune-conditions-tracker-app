
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { HIPAAComplianceService } from '@/lib/hipaaCompliance';
import { sessionManager } from '@/lib/security/sessionManager';
import { accessControlService } from '@/lib/security/accessControl';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionId: string | null;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
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
  signInAsGuest: async () => { },
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

  // Get client information for session management
  const getClientInfo = () => {
    return {
      ipAddress: undefined, // Will be determined server-side
      userAgent: navigator.userAgent,
      deviceFingerprint: generateDeviceFingerprint()
    };
  };

  const generateDeviceFingerprint = (): string => {
    // Simple device fingerprinting (in production, use a more sophisticated approach)
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
      canvas: canvasFingerprint.substring(0, 50) // Truncate for storage
    }));

    return fingerprint;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setDemoMode(user?.isAnonymous || false);

      if (user) {
        try {
          // Create secure session
          const clientInfo = getClientInfo();
          const newSessionId = await sessionManager.createSession(
            user,
            clientInfo.ipAddress,
            clientInfo.userAgent,
            clientInfo.deviceFingerprint,
            'standard'
          );

          setSessionId(newSessionId);
          setIsSessionValid(true);

          // HIPAA Audit Logging
          await HIPAAComplianceService.logAccess(
            user.uid,
            'login',
            'authentication',
            undefined,
            false,
            undefined,
            user.isAnonymous ? 'Anonymous login' : 'User login'
          );

          // Store session info for session management
          localStorage.setItem('currentUserId', user.uid);
          localStorage.setItem('currentSessionId', newSessionId);

          // Start session validation interval
          startSessionValidation(user.uid, newSessionId);

        } catch (error) {
          console.error('Error creating secure session:', error);
          setIsSessionValid(false);
        }
      } else {
        // Clear session on logout
        if (sessionId) {
          await sessionManager.invalidateSession(sessionId, 'User logout');
        }
        setSessionId(null);
        setIsSessionValid(false);
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentSessionId');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Session validation interval
  const startSessionValidation = (userId: string, sessionId: string) => {
    const validateSession = async () => {
      try {
        const clientInfo = getClientInfo();
        const validation = await sessionManager.validateSession(
          sessionId,
          userId,
          clientInfo.ipAddress,
          clientInfo.userAgent
        );

        setIsSessionValid(validation.isValid);

        if (!validation.isValid) {
          // Session invalid, force logout
          await signOut();

          if (validation.requiresReauth) {
            // Redirect to login with message about security
            window.location.href = '/login?reason=security';
          }
        }
      } catch (error) {
        console.error('Session validation error:', error);
        setIsSessionValid(false);
      }
    };

    // Validate session every 30 seconds
    const interval = setInterval(validateSession, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  };

  const signOut = async () => {
    try {
      // HIPAA Audit Logging
      if (user) {
        await HIPAAComplianceService.logAccess(
          user.uid,
          'logout',
          'authentication',
          undefined,
          false,
          undefined,
          'User initiated logout'
        );
      }

      // Invalidate session
      if (sessionId) {
        await sessionManager.invalidateSession(sessionId, 'User initiated logout');
      }

      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Error signing in as guest: ", error);
    }
  };

  const elevateSession = async (): Promise<boolean> => {
    if (!user || !sessionId) return false;

    try {
      const success = await sessionManager.elevateSessionSecurity(sessionId, user.uid);
      return success;
    } catch (error) {
      console.error('Error elevating session:', error);
      return false;
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    if (!user || !sessionId) return false;

    try {
      const clientInfo = getClientInfo();
      const validation = await sessionManager.validateSession(
        sessionId,
        user.uid,
        clientInfo.ipAddress,
        clientInfo.userAgent
      );

      setIsSessionValid(validation.isValid);
      return validation.isValid;
    } catch (error) {
      console.error('Error refreshing session:', error);
      setIsSessionValid(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      sessionId,
      signOut,
      signInAsGuest,
      demoMode,
      isSessionValid,
      elevateSession,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
