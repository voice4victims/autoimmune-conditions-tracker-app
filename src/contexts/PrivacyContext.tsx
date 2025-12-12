import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { securePrivacyService } from '@/lib/securePrivacyService';
import { privacyService } from '@/lib/privacyService';
import {
    PrivacySettings,
    Permission,
    AccessControlSettings,
    PrivacyAction
} from '@/types/privacy';

interface PrivacyContextType {
    // Current user's privacy settings
    privacySettings: PrivacySettings | null;
    accessControlSettings: AccessControlSettings | null;
    userPermissions: Record<string, Permission[]>; // targetUserId -> permissions

    // Loading states
    loading: boolean;
    error: string | null;

    // Actions
    loadPrivacySettings: (userId?: string) => Promise<void>;
    updatePrivacySettings: (userId: string, updates: Partial<PrivacySettings>) => Promise<void>;
    hasPermission: (targetUserId: string, permission: Permission, childId?: string) => Promise<boolean>;
    getEffectivePermissions: (targetUserId: string, childId?: string) => Promise<Permission[]>;
    enforcePrivacySettings: <T extends Record<string, any>>(
        data: T,
        dataOwnerId: string,
        requiredPermission: Permission,
        childId?: string
    ) => Promise<T | null>;
    filterDataByPermissions: <T extends { userId: string; childId?: string }>(
        data: T[],
        requiredPermission: Permission
    ) => Promise<T[]>;

    // Privacy-aware data access
    canAccessChildData: (parentUserId: string, childId: string, permission: Permission) => Promise<boolean>;
    processChildPrivacyTransfer: (childUserId: string, parentUserId: string, childDateOfBirth: Date) => Promise<void>;

    // Audit and logging
    logPrivacyAction: (userId: string, action: PrivacyAction, details?: any) => Promise<void>;

    // Utility functions
    refreshPermissions: (targetUserId: string) => Promise<void>;
    clearCache: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
    privacySettings: null,
    accessControlSettings: null,
    userPermissions: {},
    loading: false,
    error: null,
    loadPrivacySettings: async () => { },
    updatePrivacySettings: async () => { },
    hasPermission: async () => false,
    getEffectivePermissions: async () => [],
    enforcePrivacySettings: async () => null,
    filterDataByPermissions: async () => [],
    canAccessChildData: async () => false,
    processChildPrivacyTransfer: async () => { },
    logPrivacyAction: async () => { },
    refreshPermissions: async () => { },
    clearCache: () => { }
});

export const usePrivacy = () => {
    const context = useContext(PrivacyContext);
    if (!context) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
};

interface PrivacyProviderProps {
    children: React.ReactNode;
}

export const PrivacyProvider: React.FC<PrivacyProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
    const [accessControlSettings, setAccessControlSettings] = useState<AccessControlSettings | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cache for permissions to avoid repeated API calls
    const [permissionCache, setPermissionCache] = useState<Record<string, {
        permissions: Permission[];
        timestamp: number;
        childId?: string;
    }>>({});

    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Load privacy settings for a user
     */
    const loadPrivacySettings = useCallback(async (userId?: string) => {
        if (!user) return;

        const targetUserId = userId || user.uid;
        setLoading(true);
        setError(null);

        try {
            const settings = await securePrivacyService.getPrivacySettings(user, targetUserId);

            if (targetUserId === user.uid) {
                setPrivacySettings(settings);
            }

            if (settings) {
                const accessControl = await securePrivacyService.getAccessControlSettings(user, targetUserId);
                if (targetUserId === user.uid) {
                    setAccessControlSettings(accessControl);
                }

                // Load permissions for this user
                const permissions = await securePrivacyService.getEffectivePermissions(user, targetUserId);
                setUserPermissions(prev => ({
                    ...prev,
                    [targetUserId]: permissions
                }));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load privacy settings';
            setError(errorMessage);
            console.error('Error loading privacy settings:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Update privacy settings with access control
     */
    const updatePrivacySettings = useCallback(async (
        userId: string,
        updates: Partial<PrivacySettings>
    ) => {
        if (!user) throw new Error('User not authenticated');

        setLoading(true);
        setError(null);

        try {
            await securePrivacyService.updatePrivacySettings(user, userId, updates);

            // Reload settings if updating current user
            if (userId === user.uid) {
                await loadPrivacySettings(userId);
            }

            // Clear permission cache for this user
            setPermissionCache(prev => {
                const newCache = { ...prev };
                Object.keys(newCache).forEach(key => {
                    if (key.startsWith(userId)) {
                        delete newCache[key];
                    }
                });
                return newCache;
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update privacy settings';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user, loadPrivacySettings]);

    /**
     * Check if current user has permission with caching
     */
    const hasPermission = useCallback(async (
        targetUserId: string,
        permission: Permission,
        childId?: string
    ): Promise<boolean> => {
        if (!user) return false;

        // Check cache first
        const cacheKey = `${targetUserId}:${childId || 'root'}`;
        const cached = permissionCache[cacheKey];

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.permissions.includes(permission);
        }

        try {
            const hasAccess = await securePrivacyService.hasPermission(
                user,
                targetUserId,
                permission,
                childId
            );

            // Update cache with all permissions for this user/child combination
            if (!cached || Date.now() - cached.timestamp >= CACHE_DURATION) {
                const allPermissions = await securePrivacyService.getEffectivePermissions(
                    user,
                    targetUserId,
                    childId
                );

                setPermissionCache(prev => ({
                    ...prev,
                    [cacheKey]: {
                        permissions: allPermissions,
                        timestamp: Date.now(),
                        childId
                    }
                }));
            }

            return hasAccess;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }, [user, permissionCache]);

    /**
     * Get effective permissions with caching
     */
    const getEffectivePermissions = useCallback(async (
        targetUserId: string,
        childId?: string
    ): Promise<Permission[]> => {
        if (!user) return [];

        // Check cache first
        const cacheKey = `${targetUserId}:${childId || 'root'}`;
        const cached = permissionCache[cacheKey];

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.permissions;
        }

        try {
            const permissions = await securePrivacyService.getEffectivePermissions(
                user,
                targetUserId,
                childId
            );

            // Update cache
            setPermissionCache(prev => ({
                ...prev,
                [cacheKey]: {
                    permissions,
                    timestamp: Date.now(),
                    childId
                }
            }));

            return permissions;
        } catch (error) {
            console.error('Error getting effective permissions:', error);
            return [];
        }
    }, [user, permissionCache]);

    /**
     * Enforce privacy settings on data access
     */
    const enforcePrivacySettings = useCallback(async <T extends Record<string, any>>(
        data: T,
        dataOwnerId: string,
        requiredPermission: Permission,
        childId?: string
    ): Promise<T | null> => {
        if (!user) return null;

        return await securePrivacyService.enforcePrivacySettings(
            user,
            data,
            dataOwnerId,
            requiredPermission,
            childId
        );
    }, [user]);

    /**
     * Filter data based on user permissions
     */
    const filterDataByPermissions = useCallback(async <T extends { userId: string; childId?: string }>(
        data: T[],
        requiredPermission: Permission
    ): Promise<T[]> => {
        if (!user) return [];

        return await securePrivacyService.filterDataByPermissions(
            user,
            data,
            requiredPermission
        );
    }, [user]);

    /**
     * Check if user can access specific child data
     */
    const canAccessChildData = useCallback(async (
        parentUserId: string,
        childId: string,
        permission: Permission
    ): Promise<boolean> => {
        if (!user) return false;

        return await securePrivacyService.canAccessChildData(
            user,
            parentUserId,
            childId,
            permission
        );
    }, [user]);

    /**
     * Process child privacy transfer on age of majority
     */
    const processChildPrivacyTransfer = useCallback(async (
        childUserId: string,
        parentUserId: string,
        childDateOfBirth: Date
    ) => {
        await securePrivacyService.processChildPrivacyTransfer(
            childUserId,
            parentUserId,
            childDateOfBirth
        );

        // Clear relevant caches
        setPermissionCache(prev => {
            const newCache = { ...prev };
            Object.keys(newCache).forEach(key => {
                if (key.startsWith(childUserId) || key.startsWith(parentUserId)) {
                    delete newCache[key];
                }
            });
            return newCache;
        });

        // Reload settings if affected user is current user
        if (user && (user.uid === childUserId || user.uid === parentUserId)) {
            await loadPrivacySettings();
        }
    }, [user, loadPrivacySettings]);

    /**
     * Log privacy action
     */
    const logPrivacyAction = useCallback(async (
        userId: string,
        action: PrivacyAction,
        details?: any
    ) => {
        await privacyService.logPrivacyAction(userId, action, details);
    }, []);

    /**
     * Refresh permissions for a specific user
     */
    const refreshPermissions = useCallback(async (targetUserId: string) => {
        if (!user) return;

        // Clear cache for this user
        setPermissionCache(prev => {
            const newCache = { ...prev };
            Object.keys(newCache).forEach(key => {
                if (key.startsWith(targetUserId)) {
                    delete newCache[key];
                }
            });
            return newCache;
        });

        // Reload permissions
        const permissions = await securePrivacyService.getEffectivePermissions(user, targetUserId);
        setUserPermissions(prev => ({
            ...prev,
            [targetUserId]: permissions
        }));
    }, [user]);

    /**
     * Clear all caches
     */
    const clearCache = useCallback(() => {
        setPermissionCache({});
        setUserPermissions({});
    }, []);

    // Load privacy settings when user changes
    useEffect(() => {
        if (user) {
            loadPrivacySettings();
        } else {
            // Clear state when user logs out
            setPrivacySettings(null);
            setAccessControlSettings(null);
            setUserPermissions({});
            setPermissionCache({});
            setError(null);
        }
    }, [user, loadPrivacySettings]);

    // Clean up expired cache entries periodically
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            setPermissionCache(prev => {
                const newCache = { ...prev };
                Object.keys(newCache).forEach(key => {
                    if (now - newCache[key].timestamp >= CACHE_DURATION) {
                        delete newCache[key];
                    }
                });
                return newCache;
            });
        }, CACHE_DURATION);

        return () => clearInterval(cleanupInterval);
    }, []);

    const contextValue: PrivacyContextType = {
        privacySettings,
        accessControlSettings,
        userPermissions,
        loading,
        error,
        loadPrivacySettings,
        updatePrivacySettings,
        hasPermission,
        getEffectivePermissions,
        enforcePrivacySettings,
        filterDataByPermissions,
        canAccessChildData,
        processChildPrivacyTransfer,
        logPrivacyAction,
        refreshPermissions,
        clearCache
    };

    return (
        <PrivacyContext.Provider value={contextValue}>
            {children}
        </PrivacyContext.Provider>
    );
};