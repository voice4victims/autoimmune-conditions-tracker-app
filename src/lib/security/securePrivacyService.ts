/**
 * OWASP A01:2025 - Secure Privacy Service Wrapper
 * 
 * This service wraps the privacy service with comprehensive authorization checks,
 * ensuring that all privacy operations are properly authorized and audited.
 * 
 * CRITICAL: This service MUST be used instead of direct privacy service access.
 * Direct access bypasses security controls and creates vulnerabilities.
 */

import { User } from 'firebase/auth';
import { privacyService } from '../privacyService';
import { authorizationMiddleware, OperationContext, AuthorizationResult } from './authorizationMiddleware';
import { PrivacySettings, ConsentType, DeletionScope, TemporaryAccess } from '@/types/privacy';

export interface SecureOperationContext {
    user: User;
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
    childId?: string;
}

/**
 * Secure Privacy Service
 * 
 * This service provides secure access to privacy operations with comprehensive
 * authorization checks and audit logging.
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
     * Get privacy settings with authorization
     */
    async getPrivacySettings(context: SecureOperationContext): Promise<AuthorizationResult<PrivacySettings>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'view_privacy_settings',
            resourceType: 'privacy_settings',
            resourceId: context.user.uid
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            () => privacyService.getPrivacySettings(context.user.uid)
        );
    }

    /**
     * Update privacy settings with authorization and confirmation checks
     */
    async updatePrivacySettings(
        context: SecureOperationContext,
        settings: Partial<PrivacySettings>,
        currentSettings?: PrivacySettings
    ): Promise<AuthorizationResult<void>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'modify_privacy_settings',
            resourceType: 'privacy_settings',
            resourceId: context.user.uid,
            data: {
                proposedChanges: settings,
                currentSettings
            }
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            async () => {
                // Additional validation before update
                await this.validatePrivacySettingsUpdate(context.user.uid, settings);
                return privacyService.updatePrivacySettings(context.user.uid, settings);
            }
        );
    }

    /**
     * Revoke consent with authorization
     */
    async revokeConsent(
        context: SecureOperationContext,
        consentType: ConsentType
    ): Promise<AuthorizationResult<void>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'revoke_consent',
            resourceType: 'privacy_settings',
            resourceId: context.user.uid,
            data: { consentType }
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            () => privacyService.revokeConsent(context.user.uid, consentType)
        );
    }

    /**
     * Request data deletion with authorization
     */
    async requestDataDeletion(
        context: SecureOperationContext,
        deletionScope: DeletionScope,
        reason?: string
    ): Promise<AuthorizationResult<string>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'request_data_deletion',
            resourceType: 'privacy_settings',
            resourceId: context.user.uid,
            data: { deletionScope, reason }
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            async () => {
                // Additional validation for data deletion
                await this.validateDataDeletionRequest(context.user.uid, deletionScope);
                return privacyService.requestDataDeletion(context.user.uid, deletionScope, reason);
            }
        );
    }

    /**
     * Grant temporary access with authorization
     */
    async grantTemporaryAccess(
        context: SecureOperationContext,
        accessConfig: Omit<TemporaryAccess, 'id' | 'grantedAt' | 'isActive' | 'accessCount'>
    ): Promise<AuthorizationResult<string>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'manage_family_access',
            resourceType: 'family_access',
            resourceId: context.user.uid,
            data: { accessConfig }
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            async () => {
                // Additional validation for temporary access
                await this.validateTemporaryAccessGrant(context.user.uid, accessConfig);
                return privacyService.grantTemporaryAccess(context.user.uid, accessConfig);
            }
        );
    }

    /**
     * Revoke access with authorization
     */
    async revokeAccess(
        context: SecureOperationContext,
        accessId: string,
        accessType: 'family' | 'provider' | 'temporary'
    ): Promise<AuthorizationResult<void>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'manage_family_access',
            resourceType: `${accessType}_access`,
            resourceId: accessId,
            data: { accessType }
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            async () => {
                // Additional validation for access revocation
                await this.validateAccessRevocation(context.user.uid, accessId, accessType);
                return privacyService.revokeAccess(context.user.uid, accessId, accessType);
            }
        );
    }

    /**
     * Get deletion requests with authorization
     */
    async getDeletionRequests(context: SecureOperationContext): Promise<AuthorizationResult<any[]>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'view_privacy_settings',
            resourceType: 'privacy_settings',
            resourceId: context.user.uid
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            () => privacyService.getDeletionRequests(context.user.uid)
        );
    }

    /**
     * Validation methods for additional security checks
     */
    private async validatePrivacySettingsUpdate(
        userId: string,
        settings: Partial<PrivacySettings>
    ): Promise<void> {
        // Validate that the user is not trying to escalate privileges
        if (settings.accessControl?.familyMembers) {
            for (const member of settings.accessControl.familyMembers) {
                if (member.userId === userId) {
                    throw new Error('Cannot modify own access permissions');
                }
            }
        }

        // Validate retention period is within legal limits
        if (settings.dataRetention?.retentionPeriod !== undefined) {
            const minRetention = 12; // 1 year minimum
            const maxRetention = 84; // 7 years maximum (HIPAA requirement)

            if (settings.dataRetention.retentionPeriod < minRetention ||
                settings.dataRetention.retentionPeriod > maxRetention) {
                throw new Error(`Retention period must be between ${minRetention} and ${maxRetention} months`);
            }
        }

        // Validate communication preferences
        if (settings.communications) {
            // Security alerts cannot be disabled
            if (settings.communications.securityAlerts === false) {
                throw new Error('Security alerts cannot be disabled');
            }
        }
    }

    private async validateDataDeletionRequest(
        userId: string,
        deletionScope: DeletionScope
    ): Promise<void> {
        // Check for active legal holds
        const currentSettings = await privacyService.getPrivacySettings(userId);
        const activeLegalHolds = currentSettings.dataRetention.legalHolds?.filter(hold => hold.isActive) || [];

        if (activeLegalHolds.length > 0) {
            throw new Error('Data deletion blocked by active legal holds');
        }

        // Validate deletion scope
        const validScopes: DeletionScope[] = ['all_data', 'child_specific', 'date_range', 'data_type_specific'];
        if (!validScopes.includes(deletionScope)) {
            throw new Error('Invalid deletion scope');
        }

        // Check for recent deletion requests (prevent spam)
        const recentRequests = await privacyService.getDeletionRequests(userId);
        const recentPendingRequests = recentRequests.filter(req =>
            req.status === 'pending' || req.status === 'scheduled'
        );

        if (recentPendingRequests.length > 0) {
            throw new Error('Cannot create new deletion request while existing requests are pending');
        }
    }

    private async validateTemporaryAccessGrant(
        userId: string,
        accessConfig: Omit<TemporaryAccess, 'id' | 'grantedAt' | 'isActive' | 'accessCount'>
    ): Promise<void> {
        // Validate expiration date is in the future but not too far
        const now = new Date();
        const maxFutureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days max

        if (accessConfig.expiresAt <= now) {
            throw new Error('Expiration date must be in the future');
        }

        if (accessConfig.expiresAt > maxFutureDate) {
            throw new Error('Temporary access cannot exceed 90 days');
        }

        // Validate permissions are not excessive
        const allowedPermissions = [
            'view_symptoms', 'view_treatments', 'view_vitals', 'view_notes',
            'view_files', 'view_analytics'
        ];

        const hasExcessivePermissions = accessConfig.permissions.some(
            permission => !allowedPermissions.includes(permission)
        );

        if (hasExcessivePermissions) {
            throw new Error('Temporary access cannot include administrative permissions');
        }

        // Validate email format if provided
        if (accessConfig.grantedToEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(accessConfig.grantedToEmail)) {
                throw new Error('Invalid email format');
            }
        }
    }

    private async validateAccessRevocation(
        userId: string,
        accessId: string,
        accessType: 'family' | 'provider' | 'temporary'
    ): Promise<void> {
        // Validate that the access record exists and belongs to the user
        // This is handled by the authorization middleware's resource ownership validation

        // Additional validation: cannot revoke own access
        if (accessType === 'family') {
            // Check if trying to revoke own family access
            const currentSettings = await privacyService.getPrivacySettings(userId);
            const familyMember = currentSettings.accessControl.familyMembers.find(
                member => member.id === accessId && member.userId === userId
            );

            if (familyMember) {
                throw new Error('Cannot revoke own family access');
            }
        }
    }

    /**
     * Administrative methods (require elevated privileges)
     */
    async processScheduledDeletions(context: SecureOperationContext): Promise<AuthorizationResult<void>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'delete_data',
            resourceType: 'system_administration',
            resourceId: 'scheduled_deletions'
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            () => privacyService.processScheduledDeletions()
        );
    }

    async processAutomaticDataDeletion(context: SecureOperationContext): Promise<AuthorizationResult<void>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'delete_data',
            resourceType: 'system_administration',
            resourceId: 'automatic_deletion'
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            () => privacyService.processAutomaticDataDeletion()
        );
    }

    async processExpiredAccess(context: SecureOperationContext): Promise<AuthorizationResult<void>> {
        const operationContext: OperationContext = {
            ...context,
            operation: 'manage_access',
            resourceType: 'system_administration',
            resourceId: 'expired_access'
        };

        return authorizationMiddleware.executeAuthorizedOperation(
            operationContext,
            () => privacyService.processExpiredAccess()
        );
    }
}

// Export singleton instance
export const securePrivacyService = SecurePrivacyService.getInstance();