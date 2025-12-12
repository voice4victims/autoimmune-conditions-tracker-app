import { User } from 'firebase/auth';
import { securePrivacyService } from './securePrivacyService';
import { privacyService } from './privacyService';
import { Permission, PrivacySettings, AccessControlSettings } from '@/types/privacy';
import { UserRole, Permission as LegacyPermission } from '@/types/roles';

/**
 * Privacy Integration Service
 * 
 * This service bridges the privacy settings system with the existing authentication
 * and role-based access control systems. It provides a unified interface for
 * permission checking that considers both legacy roles and privacy settings.
 */
export class PrivacyIntegrationService {
    private static instance: PrivacyIntegrationService;

    public static getInstance(): PrivacyIntegrationService {
        if (!PrivacyIntegrationService.instance) {
            PrivacyIntegrationService.instance = new PrivacyIntegrationService();
        }
        return PrivacyIntegrationService.instance;
    }

    /**
     * Map legacy permissions to privacy permissions
     */
    private mapLegacyPermission(legacyPermission: LegacyPermission): Permission[] {
        const permissionMap: Record<LegacyPermission, Permission[]> = {
            'read_data': ['view_symptoms', 'view_treatments', 'view_vitals', 'view_notes', 'view_files'],
            'write_data': ['edit_symptoms', 'edit_treatments', 'edit_vitals', 'edit_notes'],
            'manage_children': ['view_symptoms', 'edit_symptoms', 'view_treatments', 'edit_treatments'],
            'invite_users': ['manage_access'],
            'view_analytics': ['view_analytics'],
            'export_data': ['export_data'],
            'manage_settings': ['manage_access'],
            'admin': ['view_symptoms', 'edit_symptoms', 'view_treatments', 'edit_treatments', 'view_vitals', 'edit_vitals', 'view_notes', 'edit_notes', 'view_files', 'upload_files', 'view_analytics', 'export_data', 'manage_access']
        };

        return permissionMap[legacyPermission] || [];
    }

    /**
     * Check if user has legacy permission with privacy settings integration
     */
    async hasLegacyPermission(
        currentUser: User | null,
        targetUserId: string,
        legacyPermission: LegacyPermission,
        childId?: string
    ): Promise<boolean> {
        if (!currentUser) return false;

        // Map legacy permission to privacy permissions
        const privacyPermissions = this.mapLegacyPermission(legacyPermission);

        // Check if user has any of the mapped privacy permissions
        for (const permission of privacyPermissions) {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                targetUserId,
                permission,
                childId
            );
            if (hasPermission) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get effective legacy permissions for backward compatibility
     */
    async getEffectiveLegacyPermissions(
        currentUser: User | null,
        targetUserId: string,
        childId?: string
    ): Promise<LegacyPermission[]> {
        if (!currentUser) return [];

        const privacyPermissions = await securePrivacyService.getEffectivePermissions(
            currentUser,
            targetUserId,
            childId
        );

        const legacyPermissions: LegacyPermission[] = [];

        // Map privacy permissions back to legacy permissions
        if (privacyPermissions.includes('manage_access')) {
            legacyPermissions.push('invite_users', 'manage_settings');
        }

        if (privacyPermissions.some(p => ['view_symptoms', 'view_treatments', 'view_vitals', 'view_notes', 'view_files'].includes(p))) {
            legacyPermissions.push('read_data');
        }

        if (privacyPermissions.some(p => ['edit_symptoms', 'edit_treatments', 'edit_vitals', 'edit_notes'].includes(p))) {
            legacyPermissions.push('write_data');
        }

        if (privacyPermissions.some(p => ['edit_symptoms', 'edit_treatments'].includes(p))) {
            legacyPermissions.push('manage_children');
        }

        if (privacyPermissions.includes('view_analytics')) {
            legacyPermissions.push('view_analytics');
        }

        if (privacyPermissions.includes('export_data')) {
            legacyPermissions.push('export_data');
        }

        // Check if user has admin-level access
        const adminPermissions = ['view_symptoms', 'edit_symptoms', 'view_treatments', 'edit_treatments', 'view_vitals', 'edit_vitals', 'view_notes', 'edit_notes', 'view_files', 'upload_files', 'view_analytics', 'export_data', 'manage_access'];
        if (adminPermissions.every(p => privacyPermissions.includes(p as Permission))) {
            legacyPermissions.push('admin');
        }

        return [...new Set(legacyPermissions)];
    }

    /**
     * Get user role based on privacy settings for backward compatibility
     */
    async getUserRole(
        currentUser: User | null,
        targetUserId: string,
        childId?: string
    ): Promise<UserRole | null> {
        if (!currentUser) return null;

        // Owner is always admin
        if (currentUser.uid === targetUserId) {
            return 'admin';
        }

        try {
            const privacySettings = await privacyService.getPrivacySettings(targetUserId);

            // Check family member role
            const familyMember = privacySettings.accessControl.familyMembers.find(
                member => member.userId === currentUser.uid && member.isActive
            );

            if (familyMember) {
                // Map family role to user role
                const roleMap: Record<string, UserRole> = {
                    'parent': 'admin',
                    'guardian': 'admin',
                    'caregiver': 'editor',
                    'viewer': 'viewer'
                };
                return roleMap[familyMember.role] || 'viewer';
            }

            // Check healthcare provider access
            const providerAccess = privacySettings.accessControl.healthcareProviders.find(
                provider => provider.providerId === currentUser.uid &&
                    provider.isActive &&
                    (!provider.expiresAt || provider.expiresAt > new Date())
            );

            if (providerAccess) {
                // Providers are typically editors with limited access
                return 'editor';
            }

            // Check temporary access
            const tempAccess = privacySettings.accessControl.temporaryAccess.find(
                temp => temp.grantedTo === currentUser.uid &&
                    temp.isActive &&
                    temp.expiresAt > new Date() &&
                    (!temp.maxAccessCount || temp.accessCount < temp.maxAccessCount)
            );

            if (tempAccess) {
                // Temporary access is typically viewer level
                return 'viewer';
            }

            return null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    }

    /**
     * Initialize privacy settings for new users
     */
    async initializeUserPrivacySettings(userId: string): Promise<void> {
        try {
            // Check if privacy settings already exist
            const existingSettings = await privacyService.getPrivacySettings(userId);
            if (existingSettings) {
                return; // Settings already exist
            }

            // Create default privacy settings
            const defaultSettings: Partial<PrivacySettings> = {
                dataSharing: {
                    researchParticipation: false,
                    anonymizedDataSharing: false,
                    thirdPartyIntegrations: {},
                    marketingConsent: false,
                    consentHistory: []
                },
                accessControl: {
                    familyMembers: [],
                    healthcareProviders: [],
                    temporaryAccess: []
                },
                dataRetention: {
                    automaticDeletion: false,
                    retentionPeriod: 84, // 7 years
                    deleteAfterInactivity: false,
                    inactivityPeriod: 24, // 2 years
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
                childSpecific: {}
            };

            await privacyService.updatePrivacySettings(userId, defaultSettings);
        } catch (error) {
            console.error('Error initializing privacy settings:', error);
            throw error;
        }
    }

    /**
     * Migrate legacy role assignments to privacy settings
     */
    async migrateLegacyRoles(
        userId: string,
        legacyRoleAssignments: Array<{
            assignedUserId: string;
            role: UserRole;
            assignedAt: Date;
            assignedBy: string;
        }>
    ): Promise<void> {
        try {
            const privacySettings = await privacyService.getPrivacySettings(userId);
            const updatedFamilyMembers = [...privacySettings.accessControl.familyMembers];

            for (const assignment of legacyRoleAssignments) {
                // Check if family member already exists
                const existingMember = updatedFamilyMembers.find(
                    member => member.userId === assignment.assignedUserId
                );

                if (!existingMember) {
                    // Map legacy role to family role and permissions
                    const roleMap: Record<UserRole, { familyRole: string; permissions: Permission[] }> = {
                        'admin': { familyRole: 'parent', permissions: ['view_symptoms', 'edit_symptoms', 'view_treatments', 'edit_treatments', 'view_vitals', 'edit_vitals', 'view_notes', 'edit_notes', 'view_files', 'upload_files', 'view_analytics', 'export_data', 'manage_access'] },
                        'editor': { familyRole: 'caregiver', permissions: ['view_symptoms', 'edit_symptoms', 'view_treatments', 'edit_treatments', 'view_vitals', 'edit_vitals', 'view_notes', 'edit_notes', 'view_files', 'upload_files', 'view_analytics', 'export_data'] },
                        'viewer': { familyRole: 'viewer', permissions: ['view_symptoms', 'view_treatments', 'view_vitals', 'view_notes', 'view_files', 'view_analytics'] }
                    };

                    const mappedRole = roleMap[assignment.role];

                    updatedFamilyMembers.push({
                        id: crypto.randomUUID(),
                        userId: assignment.assignedUserId,
                        name: 'Migrated User', // This would need to be populated from user profile
                        email: '', // This would need to be populated from user profile
                        role: mappedRole.familyRole as any,
                        permissions: mappedRole.permissions,
                        grantedAt: assignment.assignedAt,
                        grantedBy: assignment.assignedBy,
                        isActive: true
                    });
                }
            }

            await privacyService.updatePrivacySettings(userId, {
                accessControl: {
                    ...privacySettings.accessControl,
                    familyMembers: updatedFamilyMembers
                }
            });
        } catch (error) {
            console.error('Error migrating legacy roles:', error);
            throw error;
        }
    }

    /**
     * Enforce privacy settings across data access
     */
    async enforceDataAccess<T extends { userId: string; childId?: string }>(
        currentUser: User | null,
        data: T[],
        requiredPermission: Permission
    ): Promise<T[]> {
        if (!currentUser) return [];

        return await securePrivacyService.filterDataByPermissions(
            currentUser,
            data,
            requiredPermission
        );
    }

    /**
     * Check if user can access child data with privacy settings
     */
    async canAccessChildData(
        currentUser: User | null,
        parentUserId: string,
        childId: string,
        permission: Permission
    ): Promise<boolean> {
        if (!currentUser) return false;

        return await securePrivacyService.canAccessChildData(
            currentUser,
            parentUserId,
            childId,
            permission
        );
    }

    /**
     * Get privacy-aware access control settings
     */
    async getAccessControlSettings(
        currentUser: User | null,
        targetUserId: string
    ): Promise<AccessControlSettings | null> {
        if (!currentUser) return null;

        return await securePrivacyService.getAccessControlSettings(currentUser, targetUserId);
    }

    /**
     * Validate and process automatic privacy transfers
     */
    async processAutomaticPrivacyTransfers(): Promise<void> {
        // This would be called periodically to check for children reaching age of majority
        // Implementation would query for children with upcoming birthdays and process transfers
        console.log('Processing automatic privacy transfers...');

        // This is a placeholder - in a real implementation, this would:
        // 1. Query for children approaching age of majority
        // 2. Process privacy control transfers
        // 3. Notify affected parties
        // 4. Log the transfers for audit purposes
    }
}

// Export singleton instance
export const privacyIntegration = PrivacyIntegrationService.getInstance();