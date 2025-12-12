// Privacy Settings Core Infrastructure
// This module provides the complete privacy settings infrastructure for the PANDAS tracking application

// Services
export { PrivacyService, privacyService } from '../privacyService';
export { AuditService, auditService } from '../auditService';
export { PrivacyFirebaseSetup, PRIVACY_COLLECTIONS } from '../privacyFirebaseSetup';

// Types and Interfaces
export type {
    PrivacySettings,
    DataSharingPreferences,
    AccessControlSettings,
    DataRetentionSettings,
    CommunicationPreferences,
    ChildPrivacySettings,
    ConsentRecord,
    ConsentType,
    FamilyMemberAccess,
    ProviderAccess,
    TemporaryAccess,
    FamilyRole,
    Permission,
    LegalHold,
    CommunicationRecord,
    CommunicationType,
    AccessLog,
    PrivacyAction,
    AccessResult,
    AuditReport,
    LogFilters,
    AuditSummary,
    SuspiciousActivity,
    DeletionRequest,
    DeletionScope,
    DeletionStatus,
    PrivacyServiceInterface,
    AuditServiceInterface
} from '../../types/privacy';

// Constants
export {
    PRIVACY_SETTINGS_VERSION,
    DEFAULT_RETENTION_PERIOD,
    DEFAULT_INACTIVITY_PERIOD,
    PERMISSION_GROUPS,
    ROLE_PERMISSIONS
} from '../../types/privacy';

// Utility functions for privacy settings
export const PrivacyUtils = {
    /**
     * Check if a user has a specific permission
     */
    hasPermission(permissions: Permission[], requiredPermission: Permission): boolean {
        return permissions.includes(requiredPermission);
    },

    /**
     * Get permissions for a role
     */
    getPermissionsForRole(role: FamilyRole): Permission[] {
        const { ROLE_PERMISSIONS } = require('../../types/privacy');
        return ROLE_PERMISSIONS[role] || [];
    },

    /**
     * Check if consent is required for an action
     */
    isConsentRequired(action: PrivacyAction): boolean {
        const consentRequiredActions: PrivacyAction[] = [
            'export_data',
            'delete_data',
            'grant_access'
        ];
        return consentRequiredActions.includes(action);
    },

    /**
     * Validate privacy settings structure
     */
    validatePrivacySettings(settings: Partial<PrivacySettings>): string[] {
        const errors: string[] = [];

        if (settings.dataRetention) {
            if (settings.dataRetention.retentionPeriod && settings.dataRetention.retentionPeriod < 12) {
                errors.push('Retention period must be at least 12 months for medical data');
            }
            if (settings.dataRetention.inactivityPeriod && settings.dataRetention.inactivityPeriod < 6) {
                errors.push('Inactivity period must be at least 6 months');
            }
        }

        if (settings.accessControl?.temporaryAccess) {
            for (const access of settings.accessControl.temporaryAccess) {
                if (access.expiresAt <= new Date()) {
                    errors.push(`Temporary access for ${access.grantedToName} has already expired`);
                }
                if (access.permissions.length === 0) {
                    errors.push(`Temporary access for ${access.grantedToName} must have at least one permission`);
                }
            }
        }

        return errors;
    },

    /**
     * Generate a privacy settings summary for display
     */
    generatePrivacySettingsSummary(settings: PrivacySettings): {
        dataSharing: string;
        accessControl: string;
        dataRetention: string;
        communications: string;
    } {
        const dataSharing = [
            settings.dataSharing.researchParticipation && 'Research participation',
            settings.dataSharing.anonymizedDataSharing && 'Anonymized data sharing',
            settings.dataSharing.marketingConsent && 'Marketing consent'
        ].filter(Boolean).join(', ') || 'No data sharing enabled';

        const accessControl = [
            `${settings.accessControl.familyMembers.length} family members`,
            `${settings.accessControl.healthcareProviders.length} healthcare providers`,
            `${settings.accessControl.temporaryAccess.filter(a => a.isActive).length} temporary access grants`
        ].join(', ');

        const dataRetention = settings.dataRetention.automaticDeletion
            ? `Auto-delete after ${settings.dataRetention.retentionPeriod} months`
            : 'Manual retention management';

        const communications = [
            settings.communications.emailNotifications && 'Email notifications',
            settings.communications.smsNotifications && 'SMS notifications',
            settings.communications.marketingEmails && 'Marketing emails'
        ].filter(Boolean).join(', ') || 'Minimal communications';

        return {
            dataSharing,
            accessControl,
            dataRetention,
            communications
        };
    }
};

// Validation utilities
export { PrivacyInfrastructureValidator, validatePrivacyInfrastructure } from './validation';
export type { ValidationResult } from './validation';

// Demo and testing utilities
export { PrivacyInfrastructureDemo, runPrivacyDemo } from './demo';

// Re-export types from privacy.ts for convenience
export type { Permission, FamilyRole, ConsentType, PrivacyAction, AccessResult, DeletionScope, DeletionStatus, CommunicationType } from '../../types/privacy';