/**
 * OWASP A01:2025 - Centralized Authorization Middleware
 * 
 * This middleware ensures that ALL privacy operations go through proper
 * server-side authorization checks. It prevents bypassing of access controls
 * and ensures consistent security policy enforcement.
 * 
 * CRITICAL: This middleware MUST be used for all privacy-related operations.
 * Direct access to privacy services without authorization is a security vulnerability.
 */

import { User } from 'firebase/auth';
import { accessControlService, AccessContext, AccessAction } from './accessControl';
import { privacyAccessControlService, PrivacyAccessContext } from './privacyAccessControl';
import { auditService } from '../auditService';
import { HIPAAComplianceService } from '../hipaaCompliance';

export interface AuthorizationResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    requiresAdditionalAuth?: boolean;
    requiresConfirmation?: boolean;
}

export interface OperationContext {
    user: User;
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
    operation: string;
    resourceType: string;
    resourceId?: string;
    childId?: string;
    data?: any;
}

/**
 * Centralized Authorization Middleware
 * 
 * This class provides a single point of authorization for all privacy operations,
 * ensuring that security policies are consistently enforced across the application.
 */
export class AuthorizationMiddleware {
    private static instance: AuthorizationMiddleware;

    public static getInstance(): AuthorizationMiddleware {
        if (!AuthorizationMiddleware.instance) {
            AuthorizationMiddleware.instance = new AuthorizationMiddleware();
        }
        return AuthorizationMiddleware.instance;
    }

    /**
     * Execute a privacy operation with full authorization checks
     * 
     * This method wraps all privacy operations to ensure they go through
     * proper authorization and audit logging.
     */
    async executeAuthorizedOperation<T>(
        context: OperationContext,
        operation: () => Promise<T>
    ): Promise<AuthorizationResult<T>> {
        const startTime = Date.now();

        try {
            // Step 1: Validate input parameters
            const validationResult = this.validateOperationContext(context);
            if (!validationResult.valid) {
                await this.logUnauthorizedAttempt(context, validationResult.reason);
                return {
                    success: false,
                    error: validationResult.reason
                };
            }

            // Step 2: Perform authorization check
            const authResult = await this.performAuthorizationCheck(context);
            if (!authResult.granted) {
                await this.logUnauthorizedAttempt(context, authResult.reason);
                return {
                    success: false,
                    error: authResult.reason,
                    requiresAdditionalAuth: authResult.requiresAdditionalAuth,
                    requiresConfirmation: authResult.requiresConfirmation
                };
            }

            // Step 3: Execute the operation
            const result = await operation();

            // Step 4: Log successful operation
            await this.logAuthorizedOperation(context, true, 'Operation completed successfully');

            // Step 5: Record performance metrics
            const executionTime = Date.now() - startTime;
            await this.recordPerformanceMetrics(context, executionTime);

            return {
                success: true,
                data: result
            };

        } catch (error) {
            // Log failed operation
            await this.logAuthorizedOperation(context, false, `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Check if this might be a security incident
            await this.checkForSecurityIncident(context, error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Operation failed'
            };
        }
    }

    /**
     * Validate operation context
     */
    private validateOperationContext(context: OperationContext): { valid: boolean; reason?: string } {
        if (!context.user || !context.user.uid) {
            return { valid: false, reason: 'Invalid user context' };
        }

        if (!context.sessionId) {
            return { valid: false, reason: 'Missing session ID' };
        }

        if (!context.operation || !context.resourceType) {
            return { valid: false, reason: 'Missing operation or resource type' };
        }

        // Validate session format (should be UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(context.sessionId)) {
            return { valid: false, reason: 'Invalid session ID format' };
        }

        return { valid: true };
    }

    /**
     * Perform comprehensive authorization check
     */
    private async performAuthorizationCheck(context: OperationContext): Promise<{
        granted: boolean;
        reason: string;
        requiresAdditionalAuth?: boolean;
        requiresConfirmation?: boolean;
    }> {
        try {
            // Map operation to access action
            const accessAction = this.mapOperationToAccessAction(context.operation);

            // Create access context
            const accessContext: AccessContext = {
                user: context.user,
                requestedResource: context.resourceType,
                resourceId: context.resourceId,
                action: accessAction,
                childId: context.childId,
                sessionId: context.sessionId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent
            };

            // Perform standard access control check
            const decision = await accessControlService.authorizeAccess(accessContext);

            if (!decision.granted) {
                return {
                    granted: false,
                    reason: decision.reason
                };
            }

            // For privacy-specific operations, perform additional checks
            if (this.isPrivacyOperation(context.operation)) {
                const privacyResult = await this.performPrivacySpecificChecks(context);
                if (!privacyResult.granted) {
                    return privacyResult;
                }
            }

            return {
                granted: true,
                reason: 'Authorization successful'
            };

        } catch (error) {
            console.error('Authorization check error:', error);
            return {
                granted: false,
                reason: 'Authorization system error'
            };
        }
    }

    /**
     * Perform privacy-specific authorization checks
     */
    private async performPrivacySpecificChecks(context: OperationContext): Promise<{
        granted: boolean;
        reason: string;
        requiresAdditionalAuth?: boolean;
        requiresConfirmation?: boolean;
    }> {
        try {
            // Handle different privacy operations
            switch (context.operation) {
                case 'modify_privacy_settings':
                    return await this.checkPrivacySettingsModification(context);

                case 'revoke_consent':
                case 'grant_consent':
                    return await this.checkConsentOperation(context);

                case 'request_data_deletion':
                    return await this.checkDataDeletion(context);

                case 'export_audit_logs':
                    return await this.checkAuditLogExport(context);

                default:
                    return { granted: true, reason: 'Standard privacy operation' };
            }
        } catch (error) {
            console.error('Privacy-specific check error:', error);
            return {
                granted: false,
                reason: 'Privacy authorization system error'
            };
        }
    }

    /**
     * Check privacy settings modification
     */
    private async checkPrivacySettingsModification(context: OperationContext): Promise<{
        granted: boolean;
        reason: string;
        requiresConfirmation?: boolean;
    }> {
        // Privacy settings modifications always require confirmation for sensitive changes
        const requiresConfirmation = this.checkIfChangesRequireConfirmation(context.data);

        return {
            granted: true,
            reason: 'Privacy settings modification authorized',
            requiresConfirmation
        };
    }

    /**
     * Check consent operation
     */
    private async checkConsentOperation(context: OperationContext): Promise<{
        granted: boolean;
        reason: string;
    }> {
        const authorized = await privacyAccessControlService.authorizeConsentOperation(
            context.user,
            context.sessionId,
            context.operation === 'grant_consent' ? 'grant' : 'revoke',
            context.data?.consentType,
            context.childId
        );

        return {
            granted: authorized,
            reason: authorized ? 'Consent operation authorized' : 'Consent operation denied'
        };
    }

    /**
     * Check data deletion
     */
    private async checkDataDeletion(context: OperationContext): Promise<{
        granted: boolean;
        reason: string;
        requiresAdditionalAuth?: boolean;
    }> {
        const result = await privacyAccessControlService.authorizeDataDeletion(
            context.user,
            context.sessionId,
            context.data?.deletionScope,
            context.childId
        );

        return {
            granted: result.authorized,
            reason: result.reason,
            requiresAdditionalAuth: result.requiresAdditionalAuth
        };
    }

    /**
     * Check audit log export
     */
    private async checkAuditLogExport(context: OperationContext): Promise<{
        granted: boolean;
        reason: string;
    }> {
        const authorized = await privacyAccessControlService.authorizeAuditLogAccess(
            context.user,
            context.sessionId,
            'export',
            context.childId
        );

        return {
            granted: authorized,
            reason: authorized ? 'Audit log export authorized' : 'Audit log export denied'
        };
    }

    /**
     * Helper methods
     */
    private mapOperationToAccessAction(operation: string): AccessAction {
        const operationMap: Record<string, AccessAction> = {
            'view_privacy_settings': 'read',
            'modify_privacy_settings': 'modify_privacy_settings',
            'revoke_consent': 'write',
            'grant_consent': 'write',
            'request_data_deletion': 'delete',
            'manage_family_access': 'manage_access',
            'manage_provider_access': 'manage_access',
            'view_audit_logs': 'view_audit_logs',
            'export_audit_logs': 'export',
            'export_data': 'export'
        };

        return operationMap[operation] || 'read';
    }

    private isPrivacyOperation(operation: string): boolean {
        const privacyOperations = [
            'modify_privacy_settings',
            'revoke_consent',
            'grant_consent',
            'request_data_deletion',
            'export_audit_logs',
            'manage_family_access',
            'manage_provider_access'
        ];

        return privacyOperations.includes(operation);
    }

    private checkIfChangesRequireConfirmation(data: any): boolean {
        if (!data || !data.proposedChanges) return false;

        // Sensitive changes that require confirmation
        const sensitiveFields = [
            'dataSharing.researchParticipation',
            'dataSharing.anonymizedDataSharing',
            'dataSharing.marketingConsent',
            'dataRetention.automaticDeletion',
            'dataRetention.retentionPeriod'
        ];

        return sensitiveFields.some(field => {
            const keys = field.split('.');
            let value = data.proposedChanges;
            for (const key of keys) {
                value = value?.[key];
            }
            return value !== undefined;
        });
    }

    /**
     * Logging methods
     */
    private async logUnauthorizedAttempt(context: OperationContext, reason: string): Promise<void> {
        try {
            await auditService.logPrivacyAction(context.user.uid, 'access_denied', {
                resourceType: context.resourceType,
                resourceId: context.resourceId,
                childId: context.childId,
                details: `Unauthorized ${context.operation}: ${reason}`,
                sessionId: context.sessionId
            });

            // Also log to HIPAA audit system
            await HIPAAComplianceService.logAccess(
                context.user.uid,
                'access_denied',
                context.resourceType,
                context.resourceId,
                true, // Privacy operations always involve PHI
                context.childId,
                `${context.operation}: ${reason}`
            );
        } catch (error) {
            console.error('Failed to log unauthorized attempt:', error);
        }
    }

    private async logAuthorizedOperation(context: OperationContext, success: boolean, details: string): Promise<void> {
        try {
            await auditService.logPrivacyAction(
                context.user.uid,
                success ? 'access_granted' : 'access_denied',
                {
                    resourceType: context.resourceType,
                    resourceId: context.resourceId,
                    childId: context.childId,
                    details: `${context.operation}: ${details}`,
                    sessionId: context.sessionId
                }
            );

            // Also log to HIPAA audit system
            await HIPAAComplianceService.logAccess(
                context.user.uid,
                success ? 'access_granted' : 'access_denied',
                context.resourceType,
                context.resourceId,
                true, // Privacy operations always involve PHI
                context.childId,
                `${context.operation}: ${details}`
            );
        } catch (error) {
            console.error('Failed to log authorized operation:', error);
        }
    }

    private async recordPerformanceMetrics(context: OperationContext, executionTime: number): Promise<void> {
        try {
            // Record performance metrics for monitoring
            await auditService.logPrivacyAction(context.user.uid, 'view_data', {
                resourceType: 'performance_metrics',
                resourceId: context.operation,
                details: `Execution time: ${executionTime}ms`,
                sessionId: context.sessionId
            });
        } catch (error) {
            console.error('Failed to record performance metrics:', error);
        }
    }

    private async checkForSecurityIncident(context: OperationContext, error: any): Promise<void> {
        try {
            // Check if this error pattern indicates a potential security incident
            const errorMessage = error instanceof Error ? error.message : String(error);

            const suspiciousPatterns = [
                'unauthorized',
                'access denied',
                'permission',
                'forbidden',
                'injection',
                'sql',
                'script',
                'xss'
            ];

            const isSuspicious = suspiciousPatterns.some(pattern =>
                errorMessage.toLowerCase().includes(pattern)
            );

            if (isSuspicious) {
                await HIPAAComplianceService.detectPotentialBreach(
                    context.user.uid,
                    `Suspicious operation failure: ${context.operation} - ${errorMessage}`
                );
            }
        } catch (incidentError) {
            console.error('Failed to check for security incident:', incidentError);
        }
    }
}

// Export singleton instance
export const authorizationMiddleware = AuthorizationMiddleware.getInstance();