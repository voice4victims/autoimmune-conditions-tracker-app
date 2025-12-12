/**
 * Privacy-Specific Access Control
 * 
 * This module provides specialized access control for privacy settings operations,
 * ensuring that all privacy-related actions are properly authorized and audited.
 */

import { User } from 'firebase/auth';
import { accessControlService, AccessContext, AccessAction } from './accessControl';
import { auditService } from '../auditService';
import { PrivacySettings, ConsentType, DeletionScope } from '@/types/privacy';

export interface PrivacyAccessContext extends Omit<AccessContext, 'requestedResource'> {
    privacyOperation: PrivacyOperation;
    consentType?: ConsentType;
    deletionScope?: DeletionScope;
    affectedChildIds?: string[];
}

export type PrivacyOperation =
    | 'view_privacy_settings'
    | 'modify_privacy_settings'
    | 'revoke_consent'
    | 'grant_consent'
    | 'request_data_deletion'
    | 'manage_family_access'
    | 'manage_provider_access'
    | 'view_audit_logs'
    | 'export_audit_logs'
    | 'modify_child_privacy'
    | 'view_data_retention'
    | 'modify_data_retention';

/**
 * Privacy Access Control Service
 * 
 * Provides specialized authorization for privacy operations with enhanced
 * security controls and comprehensive audit logging.
 */
export class PrivacyAccessControlService {
    private static instance: PrivacyAccessControlService;

    public static getInstance(): PrivacyAccessControlService {
        if (!PrivacyAccessControlService.instance) {
            PrivacyAccessControlService.instance = new PrivacyAccessControlService();
        }
        return PrivacyAccessControlService.instance;
    }

    /**
     * Authorize privacy-specific operations
     * 
     * This method provides enhanced authorization for privacy operations,
     * including additional checks for sensitive operations like data deletion.
     */
    async authorizePrivacyOperation(context: PrivacyAccessContext): Promise<boolean> {
        try {
            // Convert privacy operation to access context
            const accessContext: AccessContext = {
                user: context.user,
                requestedResource: this.getResourceFromOperation(context.privacyOperation),
                resourceId: context.resourceId,
                action: this.getActionFromOperation(context.privacyOperation),
                childId: context.childId,
                sessionId: context.sessionId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent
            };

            // Perform standard access control check
            const decision = await accessControlService.authorizeAccess(accessContext);

            if (!decision.granted) {
                await this.logPrivacyAccessDenied(context, decision.reason);
                return false;
            }

            // Apply privacy-specific additional checks
            const privacyChecksPass = await this.performPrivacySpecificChecks(context);

            if (!privacyChecksPass) {
                await this.logPrivacyAccessDenied(context, 'Privacy-specific checks failed');
                return false;
            }

            // Log successful authorization
            await this.logPrivacyAccessGranted(context);
            return true;

        } catch (error) {
            console.error('Privacy access control error:', error);
            await this.logPrivacyAccessDenied(context, `System error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false; // Fail secure
        }
    }

    /**
     * Authorize privacy settings modification
     * 
     * Special authorization for modifying privacy settings with additional
     * validation and confirmation requirements.
     */
    async authorizePrivacySettingsModification(
        user: User,
        sessionId: string,
        currentSettings: PrivacySettings,
        proposedChanges: Partial<PrivacySettings>,
        childId?: string
    ): Promise<{ authorized: boolean; requiresConfirmation: boolean; reason: string }> {

        const context: PrivacyAccessContext = {
            user,
            privacyOperation: 'modify_privacy_settings',
            sessionId,
            childId,
            resourceId: user.uid
        };

        const authorized = await this.authorizePrivacyOperation(context);

        if (!authorized) {
            return {
                authorized: false,
                requiresConfirmation: false,
                reason: 'Access denied - insufficient permissions'
            };
        }

        // Check if changes require additional confirmation
        const requiresConfirmation = this.checkIfChangesRequireConfirmation(currentSettings, proposedChanges);

        // Log the modification attempt
        await auditService.logPrivacyAction(user.uid, 'modify_privacy_settings', {
            resourceType: 'privacy_settings',
            resourceId: user.uid,
            childId,
            details: `Privacy settings modification ${requiresConfirmation ? '(requires confirmation)' : '(direct)'}: ${JSON.stringify(Object.keys(proposedChanges))}`
        });

        return {
            authorized: true,
            requiresConfirmation,
            reason: 'Modification authorized'
        };
    }

    /**
     * Authorize consent operations (grant/revoke)
     */
    async authorizeConsentOperation(
        user: User,
        sessionId: string,
        operation: 'grant' | 'revoke',
        consentType: ConsentType,
        childId?: string
    ): Promise<boolean> {

        const context: PrivacyAccessContext = {
            user,
            privacyOperation: operation === 'grant' ? 'grant_consent' : 'revoke_consent',
            consentType,
            sessionId,
            childId,
            resourceId: user.uid
        };

        const authorized = await this.authorizePrivacyOperation(context);

        if (authorized) {
            // Log consent operation
            await auditService.logPrivacyAction(user.uid, 'consent_change', {
                resourceType: 'consent',
                resourceId: consentType,
                childId,
                details: `Consent ${operation} for ${consentType}`
            });
        }

        return authorized;
    }

    /**
     * Authorize data deletion requests
     */
    async authorizeDataDeletion(
        user: User,
        sessionId: string,
        deletionScope: DeletionScope,
        childId?: string
    ): Promise<{ authorized: boolean; requiresAdditionalAuth: boolean; reason: string }> {

        const context: PrivacyAccessContext = {
            user,
            privacyOperation: 'request_data_deletion',
            deletionScope,
            sessionId,
            childId,
            resourceId: user.uid
        };

        const authorized = await this.authorizePrivacyOperation(context);

        if (!authorized) {
            return {
                authorized: false,
                requiresAdditionalAuth: false,
                reason: 'Access denied - insufficient permissions'
            };
        }

        // Data deletion always requires additional authentication for security
        const requiresAdditionalAuth = true;

        // Log deletion request
        await auditService.logPrivacyAction(user.uid, 'delete_data', {
            resourceType: 'deletion_request',
            resourceId: deletionScope,
            childId,
            details: `Data deletion requested: ${deletionScope}`
        });

        return {
            authorized: true,
            requiresAdditionalAuth,
            reason: 'Deletion authorized - additional authentication required'
        };
    }

    /**
     * Authorize audit log access
     */
    async authorizeAuditLogAccess(
        user: User,
        sessionId: string,
        operation: 'view' | 'export',
        childId?: string
    ): Promise<boolean> {

        const context: PrivacyAccessContext = {
            user,
            privacyOperation: operation === 'view' ? 'view_audit_logs' : 'export_audit_logs',
            sessionId,
            childId,
            resourceId: user.uid
        };

        const authorized = await this.authorizePrivacyOperation(context);

        if (authorized) {
            // Log audit log access
            await auditService.logPrivacyAction(user.uid, operation === 'view' ? 'view_data' : 'export_data', {
                resourceType: 'audit_logs',
                resourceId: user.uid,
                childId,
                details: `Audit logs ${operation}`
            });
        }

        return authorized;
    }

    /**
     * Privacy-specific authorization checks
     */
    private async performPrivacySpecificChecks(context: PrivacyAccessContext): Promise<boolean> {
        // Check for high-risk operations
        if (this.isHighRiskOperation(context.privacyOperation)) {
            // Require recent authentication for high-risk operations
            const recentAuth = await this.checkRecentAuthentication(context.user.uid);
            if (!recentAuth) {
                return false;
            }
        }

        // Check for child-specific privacy restrictions
        if (context.childId && context.affectedChildIds) {
            const childAccessValid = await this.validateChildAccess(
                context.user.uid,
                context.affectedChildIds
            );
            if (!childAccessValid) {
                return false;
            }
        }

        // Check for consent-specific restrictions
        if (context.consentType) {
            const consentValid = await this.validateConsentOperation(
                context.user.uid,
                context.consentType,
                context.privacyOperation
            );
            if (!consentValid) {
                return false;
            }
        }

        return true;
    }

    /**
     * Helper methods
     */
    private getResourceFromOperation(operation: PrivacyOperation): string {
        const resourceMap: Record<PrivacyOperation, string> = {
            'view_privacy_settings': 'privacy_settings',
            'modify_privacy_settings': 'privacy_settings',
            'revoke_consent': 'privacy_settings',
            'grant_consent': 'privacy_settings',
            'request_data_deletion': 'privacy_settings',
            'manage_family_access': 'family_access',
            'manage_provider_access': 'provider_access',
            'view_audit_logs': 'audit_logs',
            'export_audit_logs': 'audit_logs',
            'modify_child_privacy': 'child_privacy',
            'view_data_retention': 'privacy_settings',
            'modify_data_retention': 'privacy_settings'
        };

        return resourceMap[operation];
    }

    private getActionFromOperation(operation: PrivacyOperation): AccessAction {
        const actionMap: Record<PrivacyOperation, AccessAction> = {
            'view_privacy_settings': 'read',
            'modify_privacy_settings': 'modify_privacy_settings',
            'revoke_consent': 'write',
            'grant_consent': 'write',
            'request_data_deletion': 'delete',
            'manage_family_access': 'manage_access',
            'manage_provider_access': 'manage_access',
            'view_audit_logs': 'view_audit_logs',
            'export_audit_logs': 'export',
            'modify_child_privacy': 'modify_privacy_settings',
            'view_data_retention': 'read',
            'modify_data_retention': 'modify_privacy_settings'
        };

        return actionMap[operation];
    }

    private checkIfChangesRequireConfirmation(
        current: PrivacySettings,
        proposed: Partial<PrivacySettings>
    ): boolean {
        // Changes that require confirmation
        const sensitiveChanges = [
            'dataSharing.researchParticipation',
            'dataSharing.anonymizedDataSharing',
            'dataSharing.marketingConsent',
            'dataRetention.automaticDeletion',
            'dataRetention.retentionPeriod'
        ];

        return sensitiveChanges.some(path => {
            const keys = path.split('.');
            let currentValue = current as any;
            let proposedValue = proposed as any;

            for (const key of keys) {
                currentValue = currentValue?.[key];
                proposedValue = proposedValue?.[key];
            }

            return proposedValue !== undefined && proposedValue !== currentValue;
        });
    }

    private isHighRiskOperation(operation: PrivacyOperation): boolean {
        const highRiskOperations: PrivacyOperation[] = [
            'request_data_deletion',
            'modify_data_retention',
            'export_audit_logs'
        ];

        return highRiskOperations.includes(operation);
    }

    private async checkRecentAuthentication(userId: string): Promise<boolean> {
        try {
            // Check if user has authenticated within the last 5 minutes for high-risk operations
            const recentLogs = await auditService.getAccessLogs(userId, {
                startDate: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
                endDate: new Date()
            });

            const recentAuth = recentLogs.some(log =>
                log.action === 'login' && log.result === 'success'
            );

            return recentAuth;
        } catch (error) {
            console.error('Error checking recent authentication:', error);
            return false; // Fail secure
        }
    }

    private async validateChildAccess(userId: string, childIds: string[]): Promise<boolean> {
        // Validate that user has access to all specified children
        for (const childId of childIds) {
            const hasAccess = await this.checkChildAccess(userId, childId);
            if (!hasAccess) {
                return false;
            }
        }
        return true;
    }

    private async checkChildAccess(userId: string, childId: string): Promise<boolean> {
        try {
            // This would integrate with the existing role-based access system
            // For now, we'll use a simplified check
            const context: AccessContext = {
                user: { uid: userId } as User,
                requestedResource: 'child_data',
                resourceId: childId,
                action: 'read',
                childId,
                sessionId: crypto.randomUUID()
            };

            const decision = await accessControlService.authorizeAccess(context);
            return decision.granted;
        } catch (error) {
            console.error('Error checking child access:', error);
            return false;
        }
    }

    private async validateConsentOperation(
        userId: string,
        consentType: ConsentType,
        operation: PrivacyOperation
    ): Promise<boolean> {
        // Validate that the consent operation is appropriate
        // For example, can't revoke consent that's already revoked
        try {
            // This would check current consent status
            // For now, we'll allow all consent operations
            return true;
        } catch (error) {
            console.error('Error validating consent operation:', error);
            return false;
        }
    }

    private async logPrivacyAccessGranted(context: PrivacyAccessContext): Promise<void> {
        await auditService.logPrivacyAction(context.user.uid, 'access_granted', {
            resourceType: this.getResourceFromOperation(context.privacyOperation),
            resourceId: context.resourceId,
            childId: context.childId,
            details: `Privacy operation authorized: ${context.privacyOperation}`,
            sessionId: context.sessionId
        });
    }

    private async logPrivacyAccessDenied(context: PrivacyAccessContext, reason: string): Promise<void> {
        await auditService.logPrivacyAction(context.user.uid, 'access_denied', {
            resourceType: this.getResourceFromOperation(context.privacyOperation),
            resourceId: context.resourceId,
            childId: context.childId,
            details: `Privacy operation denied: ${context.privacyOperation} - ${reason}`,
            sessionId: context.sessionId
        });
    }
}

// Export singleton instance
export const privacyAccessControlService = PrivacyAccessControlService.getInstance();