import { User } from 'firebase/auth';
import { privacyService } from './privacyService';
import {
    PrivacySettings,
    Permission,
    FamilyRole,
    AccessControlSettings,
    ChildPrivacySettings,
    PrivacyAction,
    AccessLog,
    ROLE_PERMISSIONS,
    PERMISSION_GROUPS
} from '@/types/privacy';

/**
 * Secure Privacy Service Wrapper
 * 
 * This service provides a secure layer over the privacy service that integrates
 * with authentication and role-based access controls. It ensures that all privacy
 * operations are properly authorized and logged.
 */
export class SecurePrivacyService {
    private static instance: SecurePrivacyService;

    public static getInstance(): SecurePrivacyService {
        if (!SecurePrivacyService.instance) {
            SecurePrivacyService.instance = new SecurePrivacyService();
        }
        return SecurePrivacyService.instance;
    }

    /**
     * Check if a user has permission to perform an action on a resource
     */
    async hasPermission(
        currentUser: User,
        targetUserId: string,
        permission: Permission,
        childId?: string
    ): Promise<boolean> {
        try {
            // Owner always has full access to their own data
            if (currentUser.uid === targetUserId) {
                return true;
            }

            // Get privacy settings for the target user
            const privacySettings = await privacyService.getPrivacySettings(targetUserId);

            // Check family member access
            const familyAccess = privacySettings.accessControl.familyMembers.find(
                member => member.userId === currentUser.uid && member.isActive
            );

            if (familyAccess) {
                // Check if permission is granted
                if (familyAccess.permissions.includes(permission)) {
                    // If child-specific, check child privacy settings
                    if (childId) {
                        return this.checkChildSpecificAccess(
                            privacySettings.childSpecific[childId],
                            currentUser.uid,
                            permission
                        );
                    }
                    return true;
                }
            }

            // Check healthcare provider access
            const providerAccess = privacySettings.accessControl.healthcareProviders.find(
                provider => provider.providerId === currentUser.uid &&
                    provider.isActive &&
                    (!provider.expiresAt || provider.expiresAt > new Date())
            );

            if (providerAccess && providerAccess.permissions.includes(permission)) {
                if (childId) {
                    return this.checkChildSpecificAccess(
                        privacySettings.childSpecific[childId],
                        currentUser.uid,
                        permission
                    );
                }
                return true;
            }

            // Check temporary access
            const tempAccess = privacySettings.accessControl.temporaryAccess.find(
                temp => temp.grantedTo === currentUser.uid &&
                    temp.isActive &&
                    temp.expiresAt > new Date() &&
                    (!temp.maxAccessCount || temp.accessCount < temp.maxAccessCount)
            );

            if (tempAccess && tempAccess.permissions.includes(permission)) {
                if (childId) {
                    return this.checkChildSpecificAccess(
                        privacySettings.childSpecific[childId],
                        currentUser.uid,
                        permission
                    );
                }
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking permission:', error);
            // Fail secure - deny access on error
            return false;
        }
    }

    /**
     * Check child-specific privacy settings
     */
    private checkChildSpecificAccess(
        childSettings: ChildPrivacySettings | undefined,
        userId: string,
        permission: Permission
    ): boolean {
        if (!childSettings) {
            return true; // No child-specific restrictions
        }

        // If restricted access is enabled, check allowed users
        if (childSettings.restrictedAccess) {
            if (!childSettings.allowedUsers.includes(userId)) {
                return false;
            }
        }

        // Check custom permissions for this child
        if (childSettings.customPermissions && childSettings.customPermissions[userId]) {
            return childSettings.customPermissions[userId].includes(permission);
        }

        // If inheriting from parent, the parent permission check already passed
        return childSettings.inheritFromParent;
    }

    /**
     * Secure wrapper for getting privacy settings with access control
     */
    async getPrivacySettings(
        currentUser: User,
        targetUserId: string
    ): Promise<PrivacySettings | null> {
        try {
            // Check if user has permission to view privacy settings
            const hasAccess = await this.hasPermission(
                currentUser,
                targetUserId,
                'manage_access'
            );

            if (!hasAccess) {
                await this.logAccessAttempt(
                    currentUser,
                    targetUserId,
                    'view_data',
                    'privacy_settings',
                    'denied',
                    'Insufficient permissions to view privacy settings'
                );
                return null;
            }

            const settings = await privacyService.getPrivacySettings(targetUserId);

            await this.logAccessAttempt(
                currentUser,
                targetUserId,
                'view_data',
                'privacy_settings',
                'success'
            );

            return settings;
        } catch (error) {
            await this.logAccessAttempt(
                currentUser,
                targetUserId,
                'view_data',
                'privacy_settings',
                'error',
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
        }
    }

    /**
     * Secure wrapper for updating privacy settings with access control
     */
    async updatePrivacySettings(
        currentUser: User,
        targetUserId: string,
        settings: Partial<PrivacySettings>
    ): Promise<void> {
        try {
            // Check if user has permission to manage privacy settings
            const hasAccess = await this.hasPermission(
                currentUser,
                targetUserId,
                'manage_access'
            );

            if (!hasAccess) {
                await this.logAccessAttempt(
                    currentUser,
                    targetUserId,
                    'edit_data',
                    'privacy_settings',
                    'denied',
                    'Insufficient permissions to update privacy settings'
                );
                throw new Error('Access denied: Insufficient permissions to update privacy settings');
            }

            await privacyService.updatePrivacySettings(targetUserId, settings);

            await this.logAccessAttempt(
                currentUser,
                targetUserId,
                'edit_data',
                'privacy_settings',
                'success'
            );
        } catch (error) {
            await this.logAccessAttempt(
                currentUser,
                targetUserId,
                'edit_data',
                'privacy_settings',
                'error',
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
        }
    }

    /**
     * Filter data based on user permissions and privacy settings
     */
    async filterDataByPermissions<T extends { userId: string; childId?: string }>(
        currentUser: User,
        data: T[],
        requiredPermission: Permission
    ): Promise<T[]> {
        const filteredData: T[] = [];

        for (const item of data) {
            const hasAccess = await this.hasPermission(
                currentUser,
                item.userId,
                requiredPermission,
                item.childId
            );

            if (hasAccess) {
                filteredData.push(item);
            }
        }

        return filteredData;
    }

    /**
     * Check if user can access specific child data
     */
    async canAccessChildData(
        currentUser: User,
        parentUserId: string,
        childId: string,
        permission: Permission
    ): Promise<boolean> {
        return this.hasPermission(currentUser, parentUserId, permission, childId);
    }

    /**
     * Get effective permissions for a user on a target user's data
     */
    async getEffectivePermissions(
        currentUser: User,
        targetUserId: string,
        childId?: string
    ): Promise<Permission[]> {
        try {
            // Owner has all permissions
            if (currentUser.uid === targetUserId) {
                return PERMISSION_GROUPS.admin;
            }

            const privacySettings = await privacyService.getPrivacySettings(targetUserId);
            let permissions: Permission[] = [];

            // Check family member permissions
            const familyAccess = privacySettings.accessControl.familyMembers.find(
                member => member.userId === currentUser.uid && member.isActive
            );

            if (familyAccess) {
                permissions = [...familyAccess.permissions];
            }

            // Check provider permissions (additive)
            const providerAccess = privacySettings.accessControl.healthcareProviders.find(
                provider => provider.providerId === currentUser.uid &&
                    provider.isActive &&
                    (!provider.expiresAt || provider.expiresAt > new Date())
            );

            if (providerAccess) {
                permissions = [...new Set([...permissions, ...providerAccess.permissions])];
            }

            // Check temporary access (additive)
            const tempAccess = privacySettings.accessControl.temporaryAccess.find(
                temp => temp.grantedTo === currentUser.uid &&
                    temp.isActive &&
                    temp.expiresAt > new Date() &&
                    (!temp.maxAccessCount || temp.accessCount < temp.maxAccessCount)
            );

            if (tempAccess) {
                permissions = [...new Set([...permissions, ...tempAccess.permissions])];
            }

            // Apply child-specific restrictions if applicable
            if (childId && privacySettings.childSpecific[childId]) {
                const childSettings = privacySettings.childSpecific[childId];

                if (childSettings.restrictedAccess && !childSettings.allowedUsers.includes(currentUser.uid)) {
                    return [];
                }

                if (childSettings.customPermissions && childSettings.customPermissions[currentUser.uid]) {
                    // Use child-specific permissions instead
                    permissions = childSettings.customPermissions[currentUser.uid];
                }
            }

            return permissions;
        } catch (error) {
            console.error('Error getting effective permissions:', error);
            return [];
        }
    }

    /**
     * Validate role assignment permissions
     */
    async canAssignRole(
        currentUser: User,
        targetUserId: string,
        roleToAssign: FamilyRole
    ): Promise<boolean> {
        // Only owners and admins can assign roles
        const hasManageAccess = await this.hasPermission(
            currentUser,
            targetUserId,
            'manage_access'
        );

        if (!hasManageAccess) {
            return false;
        }

        // Additional business logic: only parents/guardians can assign admin roles
        if (roleToAssign === 'parent' || roleToAssign === 'guardian') {
            const currentPermissions = await this.getEffectivePermissions(currentUser, targetUserId);
            return currentPermissions.includes('manage_access');
        }

        return true;
    }

    /**
     * Log access attempts for audit purposes
     */
    private async logAccessAttempt(
        currentUser: User,
        targetUserId: string,
        action: PrivacyAction,
        resourceType: string,
        result: 'success' | 'denied' | 'error',
        details?: string,
        resourceId?: string,
        childId?: string
    ): Promise<void> {
        try {
            await privacyService.logPrivacyAction(targetUserId, action, {
                accessorId: currentUser.uid,
                accessorName: currentUser.displayName || currentUser.email || 'Unknown User',
                accessorType: currentUser.uid === targetUserId ? 'system' : 'family_member',
                resourceType,
                resourceId,
                childId,
                result,
                details
            });
        } catch (error) {
            console.error('Failed to log access attempt:', error);
            // Don't throw here as logging failure shouldn't break the main operation
        }
    }

    /**
     * Enforce privacy settings across application data access
     */
    async enforcePrivacySettings<T extends Record<string, any>>(
        currentUser: User,
        data: T,
        dataOwnerId: string,
        requiredPermission: Permission,
        childId?: string
    ): Promise<T | null> {
        const hasAccess = await this.hasPermission(
            currentUser,
            dataOwnerId,
            requiredPermission,
            childId
        );

        if (!hasAccess) {
            await this.logAccessAttempt(
                currentUser,
                dataOwnerId,
                'access_denied',
                typeof data,
                'denied',
                `Access denied for ${requiredPermission}`,
                data.id,
                childId
            );
            return null;
        }

        await this.logAccessAttempt(
            currentUser,
            dataOwnerId,
            'view_data',
            typeof data,
            'success',
            undefined,
            data.id,
            childId
        );

        return data;
    }

    /**
     * Get privacy-aware access control settings
     */
    async getAccessControlSettings(
        currentUser: User,
        targetUserId: string
    ): Promise<AccessControlSettings | null> {
        const hasAccess = await this.hasPermission(
            currentUser,
            targetUserId,
            'manage_access'
        );

        if (!hasAccess) {
            return null;
        }

        const settings = await privacyService.getPrivacySettings(targetUserId);

        // Update access control with expired items
        return await privacyService.updateAccessControlWithExpiration(targetUserId);
    }

    /**
     * Validate and enforce child privacy transfer on age of majority
     */
    async processChildPrivacyTransfer(
        childUserId: string,
        parentUserId: string,
        childDateOfBirth: Date
    ): Promise<void> {
        const now = new Date();
        const ageOfMajority = new Date(childDateOfBirth);
        ageOfMajority.setFullYear(ageOfMajority.getFullYear() + 18);

        if (now >= ageOfMajority) {
            // Transfer privacy control to the child
            const parentSettings = await privacyService.getPrivacySettings(parentUserId);
            const childSpecificSettings = parentSettings.childSpecific[childUserId];

            if (childSpecificSettings) {
                // Create independent privacy settings for the child
                const independentSettings: PrivacySettings = {
                    id: childUserId,
                    userId: childUserId,
                    dataSharing: {
                        researchParticipation: false,
                        anonymizedDataSharing: false,
                        thirdPartyIntegrations: {},
                        marketingConsent: false,
                        consentHistory: []
                    },
                    accessControl: {
                        familyMembers: [{
                            id: crypto.randomUUID(),
                            userId: parentUserId,
                            name: 'Parent',
                            email: '',
                            role: 'viewer',
                            permissions: PERMISSION_GROUPS.view_only,
                            grantedAt: now,
                            grantedBy: childUserId,
                            isActive: true
                        }],
                        healthcareProviders: [],
                        temporaryAccess: []
                    },
                    dataRetention: childSpecificSettings.dataRetentionOverride || {
                        automaticDeletion: false,
                        retentionPeriod: 84,
                        deleteAfterInactivity: false,
                        inactivityPeriod: 24,
                        legalHolds: []
                    },
                    communications: {
                        emailNotifications: true,
                        smsNotifications: false,
                        marketingEmails: false,
                        securityAlerts: true,
                        medicalReminders: true,
                        thirdPartyMarketing: false,
                        communicationHistory: []
                    },
                    childSpecific: {},
                    lastUpdated: now,
                    version: 1
                };

                await privacyService.updatePrivacySettings(childUserId, independentSettings);

                // Remove child-specific settings from parent
                const updatedChildSpecific = { ...parentSettings.childSpecific };
                delete updatedChildSpecific[childUserId];

                await privacyService.updatePrivacySettings(parentUserId, {
                    childSpecific: updatedChildSpecific
                });

                // Log the transfer
                await privacyService.logPrivacyAction(childUserId, 'update_privacy_settings', {
                    resourceType: 'privacy_transfer',
                    resourceId: childUserId,
                    details: 'Privacy control transferred from parent due to age of majority'
                });
            }
        }
    }
}

// Export singleton instance
export const securePrivacyService = SecurePrivacyService.getInstance();