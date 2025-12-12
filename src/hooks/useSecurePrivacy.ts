/**
 * OWASP A01:2025 - Secure Privacy Operations Hook
 * 
 * This hook provides secure access to privacy operations with comprehensive
 * authorization checks and proper error handling.
 * 
 * CRITICAL: This hook MUST be used for all privacy-related operations.
 * Direct service access bypasses security controls.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { securePrivacyService, SecureOperationContext } from '@/lib/security/securePrivacyService';
import { PrivacySettings, ConsentType, DeletionScope, TemporaryAccess } from '@/types/privacy';

export interface SecurePrivacyOperationResult<T = any> {
    data?: T;
    error?: string;
    loading: boolean;
    requiresAdditionalAuth?: boolean;
    requiresConfirmation?: boolean;
}

export interface UseSecurePrivacyReturn {
    // Privacy settings operations
    getPrivacySettings: () => Promise<SecurePrivacyOperationResult<PrivacySettings>>;
    updatePrivacySettings: (
        settings: Partial<PrivacySettings>,
        currentSettings?: PrivacySettings
    ) => Promise<SecurePrivacyOperationResult<void>>;

    // Consent operations
    revokeConsent: (consentType: ConsentType) => Promise<SecurePrivacyOperationResult<void>>;

    // Data deletion operations
    requestDataDeletion: (
        deletionScope: DeletionScope,
        reason?: string
    ) => Promise<SecurePrivacyOperationResult<string>>;
    getDeletionRequests: () => Promise<SecurePrivacyOperationResult<any[]>>;

    // Access management operations
    grantTemporaryAccess: (
        accessConfig: Omit<TemporaryAccess, 'id' | 'grantedAt' | 'isActive' | 'accessCount'>
    ) => Promise<SecurePrivacyOperationResult<string>>;
    revokeAccess: (
        accessId: string,
        accessType: 'family' | 'provider' | 'temporary'
    ) => Promise<SecurePrivacyOperationResult<void>>;

    // State
    loading: boolean;
    error: string | null;
}

/**
 * Hook for secure privacy operations
 * 
 * Provides a React interface for privacy operations with built-in
 * authorization, error handling, and loading states.
 */
export const useSecurePrivacy = (childId?: string): UseSecurePrivacyReturn => {
    const { user, sessionId, isSessionValid } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create operation context
    const createContext = useCallback((): SecureOperationContext | null => {
        if (!user || !sessionId || !isSessionValid) {
            return null;
        }

        return {
            user,
            sessionId,
            ipAddress: undefined, // Will be determined server-side
            userAgent: navigator.userAgent,
            childId
        };
    }, [user, sessionId, isSessionValid, childId]);

    // Generic operation executor
    const executeOperation = useCallback(async <T>(
        operation: (context: SecureOperationContext) => Promise<any>
    ): Promise<SecurePrivacyOperationResult<T>> => {
        const context = createContext();

        if (!context) {
            return {
                loading: false,
                error: 'Authentication required - please log in'
            };
        }

        setLoading(true);
        setError(null);

        try {
            const result = await operation(context);

            setLoading(false);

            if (result.success) {
                return {
                    data: result.data,
                    loading: false
                };
            } else {
                setError(result.error || 'Operation failed');
                return {
                    loading: false,
                    error: result.error || 'Operation failed',
                    requiresAdditionalAuth: result.requiresAdditionalAuth,
                    requiresConfirmation: result.requiresConfirmation
                };
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setLoading(false);

            return {
                loading: false,
                error: errorMessage
            };
        }
    }, [createContext]);

    // Privacy settings operations
    const getPrivacySettings = useCallback(async (): Promise<SecurePrivacyOperationResult<PrivacySettings>> => {
        return executeOperation<PrivacySettings>(
            (context) => securePrivacyService.getPrivacySettings(context)
        );
    }, [executeOperation]);

    const updatePrivacySettings = useCallback(async (
        settings: Partial<PrivacySettings>,
        currentSettings?: PrivacySettings
    ): Promise<SecurePrivacyOperationResult<void>> => {
        return executeOperation<void>(
            (context) => securePrivacyService.updatePrivacySettings(context, settings, currentSettings)
        );
    }, [executeOperation]);

    // Consent operations
    const revokeConsent = useCallback(async (
        consentType: ConsentType
    ): Promise<SecurePrivacyOperationResult<void>> => {
        return executeOperation<void>(
            (context) => securePrivacyService.revokeConsent(context, consentType)
        );
    }, [executeOperation]);

    // Data deletion operations
    const requestDataDeletion = useCallback(async (
        deletionScope: DeletionScope,
        reason?: string
    ): Promise<SecurePrivacyOperationResult<string>> => {
        return executeOperation<string>(
            (context) => securePrivacyService.requestDataDeletion(context, deletionScope, reason)
        );
    }, [executeOperation]);

    const getDeletionRequests = useCallback(async (): Promise<SecurePrivacyOperationResult<any[]>> => {
        return executeOperation<any[]>(
            (context) => securePrivacyService.getDeletionRequests(context)
        );
    }, [executeOperation]);

    // Access management operations
    const grantTemporaryAccess = useCallback(async (
        accessConfig: Omit<TemporaryAccess, 'id' | 'grantedAt' | 'isActive' | 'accessCount'>
    ): Promise<SecurePrivacyOperationResult<string>> => {
        return executeOperation<string>(
            (context) => securePrivacyService.grantTemporaryAccess(context, accessConfig)
        );
    }, [executeOperation]);

    const revokeAccess = useCallback(async (
        accessId: string,
        accessType: 'family' | 'provider' | 'temporary'
    ): Promise<SecurePrivacyOperationResult<void>> => {
        return executeOperation<void>(
            (context) => securePrivacyService.revokeAccess(context, accessId, accessType)
        );
    }, [executeOperation]);

    return {
        // Operations
        getPrivacySettings,
        updatePrivacySettings,
        revokeConsent,
        requestDataDeletion,
        getDeletionRequests,
        grantTemporaryAccess,
        revokeAccess,

        // State
        loading,
        error
    };
};

/**
 * Hook for administrative privacy operations
 * 
 * Provides access to administrative privacy operations that require
 * elevated privileges.
 */
export const useSecurePrivacyAdmin = (): {
    processScheduledDeletions: () => Promise<SecurePrivacyOperationResult<void>>;
    processAutomaticDataDeletion: () => Promise<SecurePrivacyOperationResult<void>>;
    processExpiredAccess: () => Promise<SecurePrivacyOperationResult<void>>;
    loading: boolean;
    error: string | null;
} => {
    const { user, sessionId, isSessionValid, elevateSession } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create elevated operation context
    const createElevatedContext = useCallback(async (): Promise<SecureOperationContext | null> => {
        if (!user || !sessionId || !isSessionValid) {
            return null;
        }

        // Elevate session for administrative operations
        const elevated = await elevateSession();
        if (!elevated) {
            throw new Error('Failed to elevate session for administrative operation');
        }

        return {
            user,
            sessionId,
            ipAddress: undefined,
            userAgent: navigator.userAgent
        };
    }, [user, sessionId, isSessionValid, elevateSession]);

    // Generic elevated operation executor
    const executeElevatedOperation = useCallback(async (
        operation: (context: SecureOperationContext) => Promise<any>
    ): Promise<SecurePrivacyOperationResult<void>> => {
        setLoading(true);
        setError(null);

        try {
            const context = await createElevatedContext();

            if (!context) {
                throw new Error('Authentication required for administrative operation');
            }

            const result = await operation(context);

            setLoading(false);

            if (result.success) {
                return {
                    data: result.data,
                    loading: false
                };
            } else {
                setError(result.error || 'Administrative operation failed');
                return {
                    loading: false,
                    error: result.error || 'Administrative operation failed'
                };
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setLoading(false);

            return {
                loading: false,
                error: errorMessage
            };
        }
    }, [createElevatedContext]);

    // Administrative operations
    const processScheduledDeletions = useCallback(async (): Promise<SecurePrivacyOperationResult<void>> => {
        return executeElevatedOperation(
            (context) => securePrivacyService.processScheduledDeletions(context)
        );
    }, [executeElevatedOperation]);

    const processAutomaticDataDeletion = useCallback(async (): Promise<SecurePrivacyOperationResult<void>> => {
        return executeElevatedOperation(
            (context) => securePrivacyService.processAutomaticDataDeletion(context)
        );
    }, [executeElevatedOperation]);

    const processExpiredAccess = useCallback(async (): Promise<SecurePrivacyOperationResult<void>> => {
        return executeElevatedOperation(
            (context) => securePrivacyService.processExpiredAccess(context)
        );
    }, [executeElevatedOperation]);

    return {
        processScheduledDeletions,
        processAutomaticDataDeletion,
        processExpiredAccess,
        loading,
        error
    };
};