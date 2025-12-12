import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { UserRole, Permission, ROLE_PERMISSIONS, UserPermissionContext } from '@/types/roles';
import { roleService } from '@/lib/firebaseService';

export const useRoleAccess = (): UserPermissionContext => {
    const { user } = useAuth();
    const { childProfile } = useApp();
    const [roleContext, setRoleContext] = useState<UserPermissionContext>({
        role: null,
        permissions: [],
        familyId: null,
        isOwner: false
    });

    useEffect(() => {
        const loadUserRole = async () => {
            if (!user || !childProfile) {
                setRoleContext({
                    role: null,
                    permissions: [],
                    familyId: null,
                    isOwner: false
                });
                return;
            }

            try {
                // Check if user is the owner of the child profile
                const isOwner = childProfile.userId === user.uid;

                if (isOwner) {
                    // Owner has admin privileges
                    setRoleContext({
                        role: 'admin',
                        permissions: ROLE_PERMISSIONS.admin,
                        familyId: user.uid,
                        isOwner: true
                    });
                    return;
                }

                // Check family access for non-owners
                const familyAccess = await roleService.getUserFamilyAccess(user.uid, childProfile.userId);

                if (familyAccess) {
                    setRoleContext({
                        role: familyAccess.role,
                        permissions: ROLE_PERMISSIONS[familyAccess.role] || [],
                        familyId: familyAccess.family_id,
                        isOwner: false
                    });
                } else {
                    // No access
                    setRoleContext({
                        role: null,
                        permissions: [],
                        familyId: null,
                        isOwner: false
                    });
                }
            } catch (error) {
                console.error('Error loading user role:', error);
                setRoleContext({
                    role: null,
                    permissions: [],
                    familyId: null,
                    isOwner: false
                });
            }
        };

        loadUserRole();
    }, [user, childProfile]);

    return roleContext;
};

export const usePermissions = () => {
    const roleContext = useRoleAccess();

    const hasPermission = (permission: Permission): boolean => {
        return roleContext.permissions.includes(permission);
    };

    const hasAnyPermission = (permissions: Permission[]): boolean => {
        return permissions.some(permission => roleContext.permissions.includes(permission));
    };

    const hasAllPermissions = (permissions: Permission[]): boolean => {
        return permissions.every(permission => roleContext.permissions.includes(permission));
    };

    const canRead = () => hasPermission('read_data');
    const canWrite = () => hasPermission('write_data');
    const canDelete = () => hasPermission('delete_data');
    const canManageUsers = () => hasPermission('manage_users');
    const canInviteUsers = () => hasPermission('invite_users');
    const canExportData = () => hasPermission('export_data');
    const canManageSettings = () => hasPermission('manage_settings');
    const canViewAnalytics = () => hasPermission('view_analytics');

    return {
        ...roleContext,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canRead,
        canWrite,
        canDelete,
        canManageUsers,
        canInviteUsers,
        canExportData,
        canManageSettings,
        canViewAnalytics
    };
};