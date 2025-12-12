import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useSecurePrivacy } from './useSecurePrivacy';
import { useRoleAccess } from './useRoleAccess';
import { securePrivacyService } from '@/lib/securePrivacyService';
import {
    Permission as PrivacyPermission,
    PrivacySettings,
    ChildPrivacySettings,
    AccessLog,
    PrivacyAction
} from '@/types/privacy';
import {
    Permission as RolePermission,
    UserRole,
    UserPermissionContext
} from '@/types/roles';

/**
 * Enhanced permission context that combines privacy settings with role-based access control
 */
export interface EnhancedPermissionContext {
    // User identity and role
    user: any;
    role: UserRole | null;
    isOwner: boolean;
    familyId: string | null;

    // Privacy settings
    privacySettings: PrivacySettings | null;
    childPrivacySettings: Record<string, ChildPrivacySettings>;

    // Combined permissions
    effectivePermissions: PrivacyPermission[];
    rolePermissions: RolePermission[];

    // Permission checking functions
    hasPrivacyPermission: (permission: PrivacyPermission, childId?: string) => Promise<boolean>;
    hasRolePermission: (permission: RolePermission) => boolean;
    canAccessData: (dataType: string, childId?: string, action?: 'view' | 'edit' | 'delete') => Promise<boolean>;
    canManageChild: (childId: string) => Promise<boolean>;
    canExportData: (childId?: string) => Promise<boolean>;

    // Privacy enforcement
    filterDataByPermissions: <T extends { userId: string; childId?: string }>(
        data: T[],
        requiredPermission: PrivacyPermission
    ) => Promise<T[]>;
    enforceChildPrivacy: <T>(data: T, childId: string, action: PrivacyAction) => Promise<T | null>;

    // Audit and logging
    logAccess: (action: PrivacyAction, resourceType: string, resourceId?: string, childId?: string) => Promise<void>;

    // Loading states
    loading: boolean;
    error: string | null;
}

/**
 * Enhanced permission hook that integrates privacy settings with role-based access control
 */
export const useEnhancedPermissions = (targetUserId?: string): EnhancedPermissionContext => {
    const { user } = useAuth();
    const { childProfile } = useApp();
    const roleContext = useRoleAccess();
    const {
        privacySettings,
        userPermissions: privacyPermissions,
        loading: privacyLoading,
        error: privacyError,
        hasPermission: hasPrivacyPermissionBase,
        canAccessChildData,
        filterDataByPermissions: filterByPrivacy,
        enforcePrivacySettings
    } = useSecurePrivacy(targetUserId);

    const [childPrivacySettings, setChildPrivacySettings] = useState<Record<string, ChildPrivacySettings>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const effectiveTargetUserId = targetUserId || user?.uid;

    // Load child-specific privacy settings
    useEffect(() => {
        const loadChildPrivacySettings = async () => {
            if (!privacySettings?.childSpecific) {
                setChildPrivacySettings({});
                return;
            }

            setChildPrivacySettings(privacySettings.childSpecific);
        };

        loadChildPrivacySettings();
    }, [privacySettings]);

    // Combine loading states
    useEffect(() => {
        setLoading(privacyLoading);
        setError(privacyError);
    }, [privacyLoading, privacyError]);

    /**
     * Check if user has a specific privacy permission
     */
    const hasPrivacyPermission = useCallback(async (
        permission: PrivacyPermission,
        childId?: string
    ): Promise<boolean> => {
        if (!user || !effectiveTargetUserId) return false;

        try {
            return await hasPrivacyPermissionBase(permission, childId);
        } catch (error) {
            console.error('Error checking privacy permission:', error);
            return false;
        }
    }, [user, effectiveTargetUserId, hasPrivacyPermissionBase]);

    /**
     * Check if user has a specific role permission
     */
    const hasRolePermission = useCallback((permission: RolePermission): boolean => {
        return roleContext.permissions.includes(permission);
    }, [roleContext.permissions]);

    /**
     * Check if user can access specific data type with privacy and role enforcement
     */
    const canAccessData = useCallback(async (
        dataType: string,
        childId?: string,
        action: 'view' | 'edit' | 'delete' = 'view'
    ): Promise<boolean> => {
        if (!user || !effectiveTargetUserId) return false;

        // Map data types to privacy permissions
        const privacyPermissionMap: Record<string, PrivacyPermission> = {
            'symptoms': action === 'view' ? 'view_symptoms' : 'edit_symptoms',
            'treatments': action === 'view' ? 'view_treatments' : 'edit_treatments',
            'vitals': action === 'view' ? 'view_vitals' : 'edit_vitals',
            'notes': action === 'view' ? 'view_notes' : 'edit_notes',
            'files': action === 'view' ? 'view_files' : 'upload_files',
            'analytics': 'view_analytics'
        };

        // Map actions to role permissions
        const rolePermissionMap: Record<string, RolePermission> = {
            'view': 'read_data',
            'edit': 'write_data',
            'delete': 'delete_data'
        };

        const privacyPermission = privacyPermissionMap[dataType];
        const rolePermission = rolePermissionMap[action];

        // Check both privacy and role permissions
        const hasPrivacy = privacyPermission ? await hasPrivacyPermission(privacyPermission, childId) : true;
        const hasRole = rolePermission ? hasRolePermission(rolePermission) : true;

        // For child-specific data, check child privacy settings
        if (childId && childPrivacySettings[childId]) {
            const childSettings = childPrivacySettings[childId];

            // If restricted access is enabled, check if user is in allowed list
            if (childSettings.restrictedAccess && !childSettings.allowedUsers.includes(user.uid)) {
                return false;
            }

            // Check custom permissions for this child
            if (childSettings.customPermissions?.[user.uid]) {
                const customPermissions = childSettings.customPermissions[user.uid];
                return customPermissions.includes(privacyPermission);
            }
        }

        return hasPrivacy && hasRole;
    }, [user, effectiveTargetUserId, hasPrivacyPermission, hasRolePermission, childPrivacySettings]);

    /**
     * Check if user can manage a specific child
     */
    const canManageChild = useCallback(async (childId: string): Promise<boolean> => {
        if (!user || !effectiveTargetUserId) return false;

        // Owner can always manage
        if (roleContext.isOwner) return true;

        // Check if user has manage_access permission
        const hasManageAccess = await hasPrivacyPermission('manage_access', childId);
        const hasManageRole = hasRolePermission('manage_users');

        return hasManageAccess && hasManageRole;
    }, [user, effectiveTargetUserId, roleContext.isOwner, hasPrivacyPermission, hasRolePermission]);

    /**
     * Check if user can export data
     */
    const canExportData = useCallback(async (childId?: string): Promise<boolean> => {
        if (!user || !effectiveTargetUserId) return false;

        const hasPrivacyExport = await hasPrivacyPermission('export_data', childId);
        const hasRoleExport = hasRolePermission('export_data');

        return hasPrivacyExport && hasRoleExport;
    }, [user, effectiveTargetUserId, hasPrivacyPermission, hasRolePermission]);

    /**
     * Filter data based on combined privacy and role permissions
     */
    const filterDataByPermissions = useCallback(async <T extends { userId: string; childId?: string }>(
        data: T[],
        requiredPermission: PrivacyPermission
    ): Promise<T[]> => {
        if (!user) return [];

        try {
            // First filter by privacy permissions
            const privacyFiltered = await filterByPrivacy(data, requiredPermission);

            // Then filter by role permissions and child privacy settings
            const finalFiltered = [];
            for (const item of privacyFiltered) {
                const canAccess = await canAccessData(
                    requiredPermission.split('_')[1], // Extract data type from permission
                    item.childId,
                    requiredPermission.startsWith('edit_') ? 'edit' : 'view'
                );

                if (canAccess) {
                    finalFiltered.push(item);
                }
            }

            return finalFiltered;
        } catch (error) {
            console.error('Error filtering data by permissions:', error);
            return [];
        }
    }, [user, filterByPrivacy, canAccessData]);

    /**
     * Enforce child-specific privacy settings on data
     */
    const enforceChildPrivacy = useCallback(async <T>(
        data: T,
        childId: string,
        action: PrivacyAction
    ): Promise<T | null> => {
        if (!user || !effectiveTargetUserId) return null;

        try {
            // Check child privacy settings
            const childSettings = childPrivacySettings[childId];
            if (childSettings?.restrictedAccess && !childSettings.allowedUsers.includes(user.uid)) {
                await logAccess(action, 'child_data', childId, childId);
                return null;
            }

            // Use existing privacy enforcement
            const result = await enforcePrivacySettings(data, effectiveTargetUserId, 'view_symptoms', childId);

            if (result) {
                await logAccess(action, 'child_data', childId, childId);
            }

            return result;
        } catch (error) {
            console.error('Error enforcing child privacy:', error);
            return null;
        }
    }, [user, effectiveTargetUserId, childPrivacySettings, enforcePrivacySettings]);

    /**
     * Log access with enhanced context
     */
    const logAccess = useCallback(async (
        action: PrivacyAction,
        resourceType: string,
        resourceId?: string,
        childId?: string
    ): Promise<void> => {
        if (!user || !effectiveTargetUserId) return;

        try {
            await securePrivacyService.logPrivacyAction(effectiveTargetUserId, action, {
                accessorId: user.uid,
                accessorName: user.displayName || user.email || 'Unknown User',
                accessorType: roleContext.isOwner ? 'family_member' : 'family_member',
                resourceType,
                resourceId,
                childId,
                result: 'success',
                details: `Role: ${roleContext.role}, Permissions: ${roleContext.permissions.join(', ')}`
            });
        } catch (error) {
            console.error('Error logging access:', error);
        }
    }, [user, effectiveTargetUserId, roleContext]);

    // Memoized effective permissions combining privacy and role permissions
    const effectivePermissions = useMemo(() => {
        return privacyPermissions || [];
    }, [privacyPermissions]);

    return {
        // User identity and role
        user,
        role: roleContext.role,
        isOwner: roleContext.isOwner,
        familyId: roleContext.familyId,

        // Privacy settings
        privacySettings,
        childPrivacySettings,

        // Combined permissions
        effectivePermissions,
        rolePermissions: roleContext.permissions,

        // Permission checking functions
        hasPrivacyPermission,
        hasRolePermission,
        canAccessData,
        canManageChild,
        canExportData,

        // Privacy enforcement
        filterDataByPermissions,
        enforceChildPrivacy,

        // Audit and logging
        logAccess,

        // Loading states
        loading,
        error
    };
};

/**
 * Simplified hook for quick permission checks without full context
 */
export const useQuickPermissionCheck = () => {
    const { user } = useAuth();
    const roleContext = useRoleAccess();

    const checkDataAccess = useCallback(async (
        targetUserId: string,
        dataType: string,
        action: 'view' | 'edit' | 'delete' = 'view',
        childId?: string
    ): Promise<boolean> => {
        if (!user) return false;

        try {
            // Quick role check first
            const rolePermissionMap: Record<string, RolePermission> = {
                'view': 'read_data',
                'edit': 'write_data',
                'delete': 'delete_data'
            };

            const rolePermission = rolePermissionMap[action];
            if (rolePermission && !roleContext.permissions.includes(rolePermission)) {
                return false;
            }

            // Then check privacy permissions
            const privacyPermissionMap: Record<string, PrivacyPermission> = {
                'symptoms': action === 'view' ? 'view_symptoms' : 'edit_symptoms',
                'treatments': action === 'view' ? 'view_treatments' : 'edit_treatments',
                'vitals': action === 'view' ? 'view_vitals' : 'edit_vitals',
                'notes': action === 'view' ? 'view_notes' : 'edit_notes',
                'files': action === 'view' ? 'view_files' : 'upload_files',
                'analytics': 'view_analytics'
            };

            const privacyPermission = privacyPermissionMap[dataType];
            if (privacyPermission) {
                return await securePrivacyService.hasPermission(
                    user,
                    targetUserId,
                    privacyPermission,
                    childId
                );
            }

            return true;
        } catch (error) {
            console.error('Error checking data access:', error);
            return false;
        }
    }, [user, roleContext.permissions]);

    return {
        checkDataAccess,
        isOwner: roleContext.isOwner,
        role: roleContext.role,
        hasRolePermission: (permission: RolePermission) => roleContext.permissions.includes(permission)
    };
};

/**
 * Hook for permission-aware data loading
 */
export const usePermissionAwareData = <T extends { userId: string; childId?: string }>(
    dataLoader: () => Promise<T[]>,
    requiredPermission: PrivacyPermission,
    dependencies: any[] = []
) => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { filterDataByPermissions } = useEnhancedPermissions();

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const rawData = await dataLoader();
            const filteredData = await filterDataByPermissions(rawData, requiredPermission);
            setData(filteredData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
            setError(errorMessage);
            console.error('Error loading permission-aware data:', err);
        } finally {
            setLoading(false);
        }
    }, [dataLoader, filterDataByPermissions, requiredPermission]);

    useEffect(() => {
        loadData();
    }, [loadData, ...dependencies]);

    return {
        data,
        loading,
        error,
        reload: loadData
    };
};