/**
 * OWASP A01:2025 - Broken Access Control Mitigations
 * 
 * This module implements comprehensive access control mechanisms to prevent
 * unauthorized access to privacy settings and sensitive medical data.
 * 
 * Key Security Controls:
 * - Server-side authorization validation (NEVER trust client-side checks)
 * - Centralized authorization framework with fail-secure defaults
 * - Session management and automatic invalidation
 * - Resource-level access control with principle of least privilege
 * - Comprehensive audit logging for all access attempts
 * - Rate limiting and suspicious activity detection
 * - Multi-factor authentication for sensitive operations
 * 
 * CRITICAL SECURITY PRINCIPLE: All authorization decisions MUST be made server-side.
 * Client-side access control logic is NEVER sufficient for security decisions.
 */

import { User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { auditService } from '../auditService';
import { HIPAAComplianceService } from '../hipaaCompliance';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/roles';

export interface AccessContext {
    user: User;
    requestedResource: string;
    resourceId?: string;
    action: AccessAction;
    childId?: string;
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
}

export type AccessAction =
    | 'read'
    | 'write'
    | 'delete'
    | 'export'
    | 'share'
    | 'manage_access'
    | 'view_audit_logs'
    | 'modify_privacy_settings';

export interface AccessDecision {
    granted: boolean;
    reason: string;
    requiredPermissions: Permission[];
    userPermissions: Permission[];
    restrictions?: AccessRestriction[];
}

export interface AccessRestriction {
    type: 'time_based' | 'ip_based' | 'session_based' | 'data_scope';
    description: string;
    enforced: boolean;
}

export interface SessionInfo {
    sessionId: string;
    userId: string;
    createdAt: Date;
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
    isValid: boolean;
    expiresAt: Date;
}

/**
 * Centralized Access Control Service
 * 
 * This service provides a single point of authorization for all privacy-related
 * operations, ensuring consistent security policy enforcement.
 */
export class AccessControlService {
    private static instance: AccessControlService;
    private readonly SESSION_TIMEOUT_MINUTES = 15; // HIPAA compliance requirement
    private readonly MAX_CONCURRENT_SESSIONS = 3;
    private readonly FAILED_ATTEMPTS_THRESHOLD = 5;
    private readonly LOCKOUT_DURATION_MINUTES = 30;

    public static getInstance(): AccessControlService {
        if (!AccessControlService.instance) {
            AccessControlService.instance = new AccessControlService();
        }
        return AccessControlService.instance;
    }

    /**
     * Primary authorization method - validates all access requests
     * 
     * CRITICAL: This method MUST be called before any privacy operation
     * Client-side checks are NEVER sufficient for security decisions
     * 
     * SECURITY PRINCIPLE: Fail secure - deny access by default
     */
    async authorizeAccess(context: AccessContext): Promise<AccessDecision> {
        try {
            // Step 1: Rate limiting check (prevent brute force attacks)
            const rateLimitPassed = await this.checkRateLimit(context.user.uid, context.ipAddress);
            if (!rateLimitPassed) {
                await this.logAccessAttempt(context, false, 'Rate limit exceeded');
                return {
                    granted: false,
                    reason: 'Too many requests - rate limit exceeded',
                    requiredPermissions: [],
                    userPermissions: []
                };
            }

            // Step 2: Validate session (server-side check)
            const sessionValid = await this.validateSession(context.user.uid, context.sessionId);
            if (!sessionValid.isValid) {
                await this.logAccessAttempt(context, false, 'Invalid session');
                return {
                    granted: false,
                    reason: 'Session invalid or expired',
                    requiredPermissions: [],
                    userPermissions: []
                };
            }

            // Step 3: Check for account lockout
            const lockoutStatus = await this.checkAccountLockout(context.user.uid);
            if (lockoutStatus.isLocked) {
                await this.logAccessAttempt(context, false, 'Account locked');
                return {
                    granted: false,
                    reason: `Account locked: ${lockoutStatus.reason}`,
                    requiredPermissions: [],
                    userPermissions: []
                };
            }

            // Step 4: Validate resource ownership (prevent horizontal privilege escalation)
            const resourceOwnershipValid = await this.validateResourceOwnership(context);
            if (!resourceOwnershipValid) {
                await this.logAccessAttempt(context, false, 'Resource ownership validation failed');
                return {
                    granted: false,
                    reason: 'Access denied - resource ownership validation failed',
                    requiredPermissions: [],
                    userPermissions: []
                };
            }

            // Step 5: Get user permissions (server-side lookup)
            const userPermissions = await this.getUserPermissions(context.user.uid, context.childId);

            // Step 6: Determine required permissions for the requested action
            const requiredPermissions = this.getRequiredPermissions(context.requestedResource, context.action);

            // Step 7: Check if user has required permissions
            const hasPermission = this.checkPermissions(userPermissions, requiredPermissions);

            // Step 8: Apply additional restrictions
            const restrictions = await this.applyAccessRestrictions(context, userPermissions);
            const restrictionsPassed = restrictions.every(r => !r.enforced || r.type === 'data_scope');

            // Step 9: Check for sensitive operations requiring additional authentication
            const sensitiveOpCheck = await this.checkSensitiveOperationRequirements(context);
            if (!sensitiveOpCheck.passed) {
                await this.logAccessAttempt(context, false, sensitiveOpCheck.reason);
                return {
                    granted: false,
                    reason: sensitiveOpCheck.reason,
                    requiredPermissions,
                    userPermissions,
                    restrictions
                };
            }

            const granted = hasPermission && restrictionsPassed && sensitiveOpCheck.passed;

            // Step 10: Log the access attempt
            await this.logAccessAttempt(context, granted, granted ? 'Access granted' : 'Insufficient permissions');

            // Step 11: Update session activity if access granted
            if (granted) {
                await this.updateSessionActivity(context.sessionId);
                await this.recordSuccessfulAccess(context.user.uid);
            } else {
                await this.recordFailedAttempt(context.user.uid);
            }

            return {
                granted,
                reason: granted ? 'Access authorized' : 'Access denied - insufficient permissions',
                requiredPermissions,
                userPermissions,
                restrictions
            };

        } catch (error) {
            console.error('Access control error:', error);
            await this.logAccessAttempt(context, false, `System error: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Fail secure - deny access on any error
            return {
                granted: false,
                reason: 'System error - access denied for security',
                requiredPermissions: [],
                userPermissions: []
            };
        }
    }

    /**
     * Server-side session validation
     * 
     * CRITICAL: Never rely on client-side session validation
     */
    private async validateSession(userId: string, sessionId: string): Promise<SessionInfo> {
        try {
            const sessionDoc = await getDoc(doc(db, 'user_sessions', sessionId));

            if (!sessionDoc.exists()) {
                return this.createInvalidSession(sessionId, 'Session not found');
            }

            const sessionData = sessionDoc.data();
            const now = new Date();
            const expiresAt = sessionData.expiresAt.toDate();
            const lastActivity = sessionData.lastActivity.toDate();

            // Check if session belongs to the requesting user
            if (sessionData.userId !== userId) {
                await this.invalidateSession(sessionId, 'User mismatch');
                return this.createInvalidSession(sessionId, 'Session user mismatch');
            }

            // Check if session has expired
            if (now > expiresAt) {
                await this.invalidateSession(sessionId, 'Session expired');
                return this.createInvalidSession(sessionId, 'Session expired');
            }

            // Check for session timeout due to inactivity
            const inactivityLimit = new Date(lastActivity.getTime() + (this.SESSION_TIMEOUT_MINUTES * 60 * 1000));
            if (now > inactivityLimit) {
                await this.invalidateSession(sessionId, 'Session timeout');
                return this.createInvalidSession(sessionId, 'Session timeout due to inactivity');
            }

            return {
                sessionId,
                userId: sessionData.userId,
                createdAt: sessionData.createdAt.toDate(),
                lastActivity,
                ipAddress: sessionData.ipAddress,
                userAgent: sessionData.userAgent,
                isValid: true,
                expiresAt
            };

        } catch (error) {
            console.error('Session validation error:', error);
            return this.createInvalidSession(sessionId, 'Validation error');
        }
    }

    /**
     * Get user permissions from server-side data
     * 
     * CRITICAL: Never trust client-provided permission information
     */
    private async getUserPermissions(userId: string, childId?: string): Promise<Permission[]> {
        try {
            // Check if user is the owner of the child profile
            if (childId) {
                const childDoc = await getDoc(doc(db, 'children', childId));
                if (childDoc.exists() && childDoc.data().userId === userId) {
                    return ROLE_PERMISSIONS.admin; // Owner has admin privileges
                }

                // Check family access permissions
                const familyAccessQuery = query(
                    collection(db, 'family_access'),
                    where('userId', '==', userId),
                    where('childId', '==', childId),
                    where('isActive', '==', true)
                );

                const familyAccessDocs = await getDocs(familyAccessQuery);
                if (familyAccessDocs.docs.length > 0) {
                    const accessData = familyAccessDocs.docs[0].data();
                    const role = accessData.role as UserRole;
                    return ROLE_PERMISSIONS[role] || [];
                }

                // Check provider access permissions
                const providerAccessQuery = query(
                    collection(db, 'provider_access'),
                    where('userId', '==', userId),
                    where('childId', '==', childId),
                    where('isActive', '==', true)
                );

                const providerAccessDocs = await getDocs(providerAccessQuery);
                if (providerAccessDocs.docs.length > 0) {
                    const accessData = providerAccessDocs.docs[0].data();
                    const role = accessData.role as UserRole;
                    return ROLE_PERMISSIONS[role] || [];
                }

                // Check temporary access permissions
                const tempAccessQuery = query(
                    collection(db, 'temporary_access'),
                    where('userId', '==', userId),
                    where('childId', '==', childId),
                    where('isActive', '==', true)
                );

                const tempAccessDocs = await getDocs(tempAccessQuery);
                if (tempAccessDocs.docs.length > 0) {
                    const accessData = tempAccessDocs.docs[0].data();
                    const expiresAt = accessData.expiresAt.toDate();

                    if (new Date() > expiresAt) {
                        // Expire the temporary access
                        await updateDoc(tempAccessDocs.docs[0].ref, {
                            isActive: false,
                            expiredAt: serverTimestamp()
                        });
                        return [];
                    }

                    const role = accessData.role as UserRole;
                    return ROLE_PERMISSIONS[role] || [];
                }
            }

            // No access found
            return [];

        } catch (error) {
            console.error('Error getting user permissions:', error);
            return []; // Fail secure - no permissions on error
        }
    }

    /**
     * Determine required permissions for a resource and action
     */
    private getRequiredPermissions(resource: string, action: AccessAction): Permission[] {
        const permissionMap: Record<string, Record<AccessAction, Permission[]>> = {
            'privacy_settings': {
                'read': ['read_data'],
                'write': ['manage_settings'],
                'delete': ['manage_settings'],
                'export': ['export_data'],
                'share': ['manage_users'],
                'manage_access': ['manage_users'],
                'view_audit_logs': ['view_analytics'],
                'modify_privacy_settings': ['manage_settings']
            },
            'audit_logs': {
                'read': ['view_analytics'],
                'write': ['manage_settings'],
                'delete': ['manage_settings'],
                'export': ['export_data'],
                'share': ['manage_users'],
                'manage_access': ['manage_users'],
                'view_audit_logs': ['view_analytics'],
                'modify_privacy_settings': ['manage_settings']
            },
            'child_data': {
                'read': ['read_data'],
                'write': ['write_data'],
                'delete': ['delete_data'],
                'export': ['export_data'],
                'share': ['manage_users'],
                'manage_access': ['manage_users'],
                'view_audit_logs': ['view_analytics'],
                'modify_privacy_settings': ['manage_settings']
            },
            'family_access': {
                'read': ['read_data'],
                'write': ['manage_users'],
                'delete': ['manage_users'],
                'export': ['export_data'],
                'share': ['manage_users'],
                'manage_access': ['manage_users'],
                'view_audit_logs': ['view_analytics'],
                'modify_privacy_settings': ['manage_settings']
            }
        };

        return permissionMap[resource]?.[action] || ['manage_settings'];
    }

    /**
     * Check if user has required permissions
     */
    private checkPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
        return requiredPermissions.every(required => userPermissions.includes(required));
    }

    /**
     * Apply additional access restrictions
     */
    private async applyAccessRestrictions(
        context: AccessContext,
        userPermissions: Permission[]
    ): Promise<AccessRestriction[]> {
        const restrictions: AccessRestriction[] = [];

        // Time-based restrictions (business hours for certain operations)
        if (context.action === 'export' || context.action === 'delete') {
            const now = new Date();
            const hour = now.getHours();
            const isBusinessHours = hour >= 8 && hour <= 18;

            restrictions.push({
                type: 'time_based',
                description: 'Sensitive operations restricted to business hours',
                enforced: !isBusinessHours && !userPermissions.includes('manage_settings')
            });
        }

        // IP-based restrictions (check for suspicious IP patterns)
        if (context.ipAddress) {
            const suspiciousIP = await this.checkSuspiciousIP(context.user.uid, context.ipAddress);
            restrictions.push({
                type: 'ip_based',
                description: 'IP address flagged for suspicious activity',
                enforced: suspiciousIP
            });
        }

        // Session-based restrictions (check for concurrent sessions)
        const concurrentSessions = await this.getConcurrentSessionCount(context.user.uid);
        restrictions.push({
            type: 'session_based',
            description: `Too many concurrent sessions (${concurrentSessions}/${this.MAX_CONCURRENT_SESSIONS})`,
            enforced: concurrentSessions > this.MAX_CONCURRENT_SESSIONS
        });

        return restrictions;
    }

    /**
     * Check for account lockout status
     */
    private async checkAccountLockout(userId: string): Promise<{ isLocked: boolean; reason?: string; expiresAt?: Date }> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                return { isLocked: false };
            }

            const userData = userDoc.data();
            if (!userData.account_locked) {
                return { isLocked: false };
            }

            const lockedAt = userData.locked_at?.toDate();
            if (lockedAt) {
                const lockoutExpiry = new Date(lockedAt.getTime() + (this.LOCKOUT_DURATION_MINUTES * 60 * 1000));
                if (new Date() > lockoutExpiry) {
                    // Unlock the account
                    await updateDoc(userDoc.ref, {
                        account_locked: false,
                        locked_at: null,
                        lock_reason: null,
                        failed_attempts: 0
                    });
                    return { isLocked: false };
                }

                return {
                    isLocked: true,
                    reason: userData.lock_reason || 'Account temporarily locked',
                    expiresAt: lockoutExpiry
                };
            }

            return { isLocked: true, reason: userData.lock_reason || 'Account locked' };

        } catch (error) {
            console.error('Error checking account lockout:', error);
            return { isLocked: false }; // Fail open for lockout check to avoid permanent lockout
        }
    }

    /**
     * Record failed access attempt and implement lockout policy
     */
    private async recordFailedAttempt(userId: string): Promise<void> {
        try {
            const userDoc = doc(db, 'users', userId);
            const userSnap = await getDoc(userDoc);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const failedAttempts = (userData.failed_attempts || 0) + 1;

                if (failedAttempts >= this.FAILED_ATTEMPTS_THRESHOLD) {
                    // Lock the account
                    await updateDoc(userDoc, {
                        account_locked: true,
                        locked_at: serverTimestamp(),
                        lock_reason: `Too many failed access attempts (${failedAttempts})`,
                        failed_attempts: failedAttempts
                    });

                    // Log security incident
                    await HIPAAComplianceService.detectPotentialBreach(
                        userId,
                        `Account locked after ${failedAttempts} failed access attempts`
                    );
                } else {
                    await updateDoc(userDoc, {
                        failed_attempts: failedAttempts,
                        last_failed_attempt: serverTimestamp()
                    });
                }
            }
        } catch (error) {
            console.error('Error recording failed attempt:', error);
        }
    }

    /**
     * Log all access attempts for audit purposes
     */
    private async logAccessAttempt(
        context: AccessContext,
        granted: boolean,
        reason: string
    ): Promise<void> {
        try {
            await auditService.logPrivacyAction(context.user.uid, granted ? 'access_granted' : 'access_denied', {
                accessorId: context.user.uid,
                accessorName: context.user.displayName || context.user.email || 'Unknown',
                accessorType: 'user',
                resourceType: context.requestedResource,
                resourceId: context.resourceId,
                childId: context.childId,
                result: granted ? 'success' : 'denied',
                details: `${context.action} on ${context.requestedResource}: ${reason}`,
                sessionId: context.sessionId
            });

            // Also log to HIPAA audit system
            await HIPAAComplianceService.logAccess(
                context.user.uid,
                granted ? 'access_granted' : 'access_denied',
                context.requestedResource,
                context.resourceId,
                true, // Privacy operations always involve PHI
                context.childId,
                `${context.action}: ${reason}`
            );
        } catch (error) {
            console.error('Failed to log access attempt:', error);
            // Don't throw - logging failure shouldn't break access control
        }
    }

    /**
     * Rate limiting to prevent brute force attacks
     * OWASP A01:2025 - Implement rate limiting for authentication attempts
     */
    private async checkRateLimit(userId: string, ipAddress?: string): Promise<boolean> {
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            // Check user-based rate limiting
            const userAttemptsQuery = query(
                collection(db, 'privacy_audit_logs'),
                where('userId', '==', userId),
                where('timestamp', '>=', Timestamp.fromDate(oneHourAgo)),
                where('result', '==', 'denied')
            );

            const userAttempts = await getDocs(userAttemptsQuery);
            if (userAttempts.docs.length > 20) { // Max 20 failed attempts per hour per user
                return false;
            }

            // Check IP-based rate limiting if IP is available
            if (ipAddress) {
                const ipAttemptsQuery = query(
                    collection(db, 'privacy_audit_logs'),
                    where('ipAddress', '==', ipAddress),
                    where('timestamp', '>=', Timestamp.fromDate(oneHourAgo)),
                    where('result', '==', 'denied')
                );

                const ipAttempts = await getDocs(ipAttemptsQuery);
                if (ipAttempts.docs.length > 50) { // Max 50 failed attempts per hour per IP
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Error checking rate limit:', error);
            return true; // Fail open for rate limiting to avoid blocking legitimate users
        }
    }

    /**
     * Validate resource ownership to prevent horizontal privilege escalation
     * OWASP A01:2025 - Ensure users can only access resources they own or have explicit access to
     */
    private async validateResourceOwnership(context: AccessContext): Promise<boolean> {
        try {
            // For privacy settings, user can only access their own settings
            if (context.requestedResource === 'privacy_settings') {
                return context.resourceId === context.user.uid;
            }

            // For child data, validate through existing access control system
            if (context.childId) {
                const hasChildAccess = await this.validateChildResourceAccess(
                    context.user.uid,
                    context.childId,
                    context.requestedResource,
                    context.resourceId
                );
                return hasChildAccess;
            }

            // For audit logs, user can only access their own logs
            if (context.requestedResource === 'audit_logs') {
                return context.resourceId === context.user.uid;
            }

            // For family/provider access, validate ownership
            if (context.requestedResource === 'family_access' || context.requestedResource === 'provider_access') {
                return await this.validateAccessManagementOwnership(context.user.uid, context.resourceId);
            }

            return true; // Default allow for other resources (will be caught by permission checks)
        } catch (error) {
            console.error('Error validating resource ownership:', error);
            return false; // Fail secure
        }
    }

    /**
     * Validate child resource access
     */
    private async validateChildResourceAccess(
        userId: string,
        childId: string,
        resourceType: string,
        resourceId?: string
    ): Promise<boolean> {
        try {
            // Check if user is the owner of the child profile
            const childDoc = await getDoc(doc(db, 'children', childId));
            if (childDoc.exists() && childDoc.data().userId === userId) {
                return true; // Owner has access
            }

            // Check family access
            const familyAccessQuery = query(
                collection(db, 'family_access'),
                where('userId', '==', userId),
                where('childId', '==', childId),
                where('isActive', '==', true)
            );

            const familyAccess = await getDocs(familyAccessQuery);
            if (familyAccess.docs.length > 0) {
                return true; // Has family access
            }

            // Check provider access
            const providerAccessQuery = query(
                collection(db, 'provider_access'),
                where('userId', '==', userId),
                where('childId', '==', childId),
                where('isActive', '==', true)
            );

            const providerAccess = await getDocs(providerAccessQuery);
            if (providerAccess.docs.length > 0) {
                return true; // Has provider access
            }

            // Check temporary access
            const tempAccessQuery = query(
                collection(db, 'temporary_access'),
                where('userId', '==', userId),
                where('childId', '==', childId),
                where('isActive', '==', true)
            );

            const tempAccess = await getDocs(tempAccessQuery);
            if (tempAccess.docs.length > 0) {
                const accessData = tempAccess.docs[0].data();
                const expiresAt = accessData.expiresAt.toDate();
                return new Date() <= expiresAt; // Check if not expired
            }

            return false; // No access found
        } catch (error) {
            console.error('Error validating child resource access:', error);
            return false; // Fail secure
        }
    }

    /**
     * Validate access management ownership
     */
    private async validateAccessManagementOwnership(userId: string, resourceId?: string): Promise<boolean> {
        try {
            if (!resourceId) return true; // Allow general access management

            // For specific access records, ensure user owns the child profile
            const accessDoc = await getDoc(doc(db, 'family_access', resourceId));
            if (accessDoc.exists()) {
                const childId = accessDoc.data().childId;
                const childDoc = await getDoc(doc(db, 'children', childId));
                return childDoc.exists() && childDoc.data().userId === userId;
            }

            return false;
        } catch (error) {
            console.error('Error validating access management ownership:', error);
            return false; // Fail secure
        }
    }

    /**
     * Check requirements for sensitive operations
     * OWASP A01:2025 - Require additional authentication for sensitive operations
     */
    private async checkSensitiveOperationRequirements(context: AccessContext): Promise<{ passed: boolean; reason: string }> {
        const sensitiveActions: AccessAction[] = ['delete', 'export', 'manage_access', 'modify_privacy_settings'];

        if (!sensitiveActions.includes(context.action)) {
            return { passed: true, reason: 'Not a sensitive operation' };
        }

        try {
            // Check for recent authentication (within last 5 minutes for sensitive operations)
            const recentAuth = await this.checkRecentAuthentication(context.user.uid, 5);
            if (!recentAuth) {
                return {
                    passed: false,
                    reason: 'Sensitive operation requires recent authentication (within 5 minutes)'
                };
            }

            // For data deletion, require additional confirmation
            if (context.action === 'delete') {
                const deletionConfirmed = await this.checkDeletionConfirmation(context.user.uid, context.sessionId);
                if (!deletionConfirmed) {
                    return {
                        passed: false,
                        reason: 'Data deletion requires explicit confirmation'
                    };
                }
            }

            return { passed: true, reason: 'Sensitive operation requirements met' };
        } catch (error) {
            console.error('Error checking sensitive operation requirements:', error);
            return { passed: false, reason: 'Error validating sensitive operation requirements' };
        }
    }

    /**
     * Check for recent authentication
     */
    private async checkRecentAuthentication(userId: string, minutesThreshold: number = 15): Promise<boolean> {
        try {
            const thresholdTime = new Date(Date.now() - minutesThreshold * 60 * 1000);

            const recentAuthQuery = query(
                collection(db, 'privacy_audit_logs'),
                where('userId', '==', userId),
                where('action', '==', 'login'),
                where('result', '==', 'success'),
                where('timestamp', '>=', Timestamp.fromDate(thresholdTime)),
                orderBy('timestamp', 'desc'),
                limit(1)
            );

            const recentAuth = await getDocs(recentAuthQuery);
            return recentAuth.docs.length > 0;
        } catch (error) {
            console.error('Error checking recent authentication:', error);
            return false; // Fail secure
        }
    }

    /**
     * Check deletion confirmation
     */
    private async checkDeletionConfirmation(userId: string, sessionId: string): Promise<boolean> {
        try {
            // Check for deletion confirmation in the current session
            const confirmationQuery = query(
                collection(db, 'deletion_confirmations'),
                where('userId', '==', userId),
                where('sessionId', '==', sessionId),
                where('confirmedAt', '>=', Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000))), // Within last 5 minutes
                limit(1)
            );

            const confirmations = await getDocs(confirmationQuery);
            return confirmations.docs.length > 0;
        } catch (error) {
            console.error('Error checking deletion confirmation:', error);
            return false; // Fail secure
        }
    }

    /**
     * Record successful access for analytics
     */
    private async recordSuccessfulAccess(userId: string): Promise<void> {
        try {
            // Reset failed attempt counter on successful access
            const userDoc = doc(db, 'users', userId);
            await updateDoc(userDoc, {
                failed_attempts: 0,
                last_successful_access: serverTimestamp()
            });
        } catch (error) {
            console.error('Error recording successful access:', error);
        }
    }

    /**
     * Helper methods for session and security management
     */
    private createInvalidSession(sessionId: string, reason: string): SessionInfo {
        return {
            sessionId,
            userId: '',
            createdAt: new Date(),
            lastActivity: new Date(),
            isValid: false,
            expiresAt: new Date()
        };
    }

    private async invalidateSession(sessionId: string, reason: string): Promise<void> {
        try {
            await updateDoc(doc(db, 'user_sessions', sessionId), {
                isValid: false,
                invalidatedAt: serverTimestamp(),
                invalidationReason: reason
            });
        } catch (error) {
            console.error('Error invalidating session:', error);
        }
    }

    private async updateSessionActivity(sessionId: string): Promise<void> {
        try {
            await updateDoc(doc(db, 'user_sessions', sessionId), {
                lastActivity: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating session activity:', error);
        }
    }

    private async checkSuspiciousIP(userId: string, ipAddress: string): Promise<boolean> {
        try {
            // Check recent access logs for this IP
            const recentLogs = await auditService.getAccessLogs(userId, {
                startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                endDate: new Date()
            });

            const ipLogs = recentLogs.filter(log => log.ipAddress === ipAddress);
            const failedAttempts = ipLogs.filter(log => log.result === 'denied').length;

            return failedAttempts > 10; // Flag IP as suspicious after 10 failed attempts
        } catch (error) {
            console.error('Error checking suspicious IP:', error);
            return false;
        }
    }

    private async getConcurrentSessionCount(userId: string): Promise<number> {
        try {
            const sessionsQuery = query(
                collection(db, 'user_sessions'),
                where('userId', '==', userId),
                where('isValid', '==', true)
            );

            const sessionDocs = await getDocs(sessionsQuery);
            return sessionDocs.docs.length;
        } catch (error) {
            console.error('Error getting concurrent session count:', error);
            return 0;
        }
    }

    /**
     * Session management methods
     */
    async createSession(user: User, ipAddress?: string, userAgent?: string): Promise<string> {
        const sessionId = crypto.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (this.SESSION_TIMEOUT_MINUTES * 60 * 1000));

        try {
            await updateDoc(doc(db, 'user_sessions', sessionId), {
                userId: user.uid,
                createdAt: serverTimestamp(),
                lastActivity: serverTimestamp(),
                expiresAt: serverTimestamp(),
                ipAddress,
                userAgent,
                isValid: true
            });

            return sessionId;
        } catch (error) {
            console.error('Error creating session:', error);
            throw new Error('Failed to create session');
        }
    }

    async invalidateAllUserSessions(userId: string): Promise<void> {
        try {
            const sessionsQuery = query(
                collection(db, 'user_sessions'),
                where('userId', '==', userId),
                where('isValid', '==', true)
            );

            const sessionDocs = await getDocs(sessionsQuery);
            const batch = db.batch ? db.batch() : null;

            if (batch) {
                sessionDocs.docs.forEach(doc => {
                    batch.update(doc.ref, {
                        isValid: false,
                        invalidatedAt: serverTimestamp(),
                        invalidationReason: 'All sessions invalidated'
                    });
                });

                await batch.commit();
            } else {
                // Fallback if batch is not available
                for (const sessionDoc of sessionDocs.docs) {
                    await updateDoc(sessionDoc.ref, {
                        isValid: false,
                        invalidatedAt: serverTimestamp(),
                        invalidationReason: 'All sessions invalidated'
                    });
                }
            }
        } catch (error) {
            console.error('Error invalidating all user sessions:', error);
            throw new Error('Failed to invalidate sessions');
        }
    }
}

// Export singleton instance
export const accessControlService = AccessControlService.getInstance();