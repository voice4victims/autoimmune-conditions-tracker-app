/**
 * OWASP A01:2025 - Secure Session Management
 * 
 * This service provides comprehensive session management with automatic
 * invalidation, concurrent session control, and security monitoring.
 * 
 * Key Security Features:
 * - Automatic session timeout (HIPAA compliance)
 * - Concurrent session limiting
 * - Session hijacking detection
 * - Secure session invalidation
 * - Activity-based session extension
 */

import { User } from 'firebase/auth';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { auditService } from '../auditService';
import { HIPAAComplianceService } from '../hipaaCompliance';

export interface SessionInfo {
    sessionId: string;
    userId: string;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    isValid: boolean;
    deviceFingerprint?: string;
    securityLevel: 'standard' | 'elevated';
}

export interface SessionValidationResult {
    isValid: boolean;
    session?: SessionInfo;
    reason?: string;
    requiresReauth?: boolean;
}

export interface SessionSecurityEvent {
    type: 'session_hijack' | 'concurrent_limit' | 'suspicious_activity' | 'timeout';
    sessionId: string;
    userId: string;
    details: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
}

/**
 * Secure Session Manager
 * 
 * Provides comprehensive session management with security controls
 * to prevent session-based attacks and ensure HIPAA compliance.
 */
export class SessionManager {
    private static instance: SessionManager;

    // HIPAA compliance requires 15-minute timeout for unattended systems
    private readonly SESSION_TIMEOUT_MINUTES = 15;
    private readonly ELEVATED_SESSION_TIMEOUT_MINUTES = 5; // For sensitive operations
    private readonly MAX_CONCURRENT_SESSIONS = 3;
    private readonly SESSION_EXTENSION_THRESHOLD_MINUTES = 5; // Extend session if activity within 5 minutes of expiry

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    /**
     * Create a new secure session
     */
    async createSession(
        user: User,
        ipAddress?: string,
        userAgent?: string,
        deviceFingerprint?: string,
        securityLevel: 'standard' | 'elevated' = 'standard'
    ): Promise<string> {
        try {
            // Check concurrent session limit
            await this.enforceConcurrentSessionLimit(user.uid);

            const sessionId = crypto.randomUUID();
            const now = new Date();
            const timeoutMinutes = securityLevel === 'elevated'
                ? this.ELEVATED_SESSION_TIMEOUT_MINUTES
                : this.SESSION_TIMEOUT_MINUTES;
            const expiresAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000);

            const sessionData = {
                userId: user.uid,
                createdAt: Timestamp.fromDate(now),
                lastActivity: Timestamp.fromDate(now),
                expiresAt: Timestamp.fromDate(expiresAt),
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
                deviceFingerprint: deviceFingerprint || 'unknown',
                isValid: true,
                securityLevel,
                activityCount: 0,
                lastSecurityCheck: Timestamp.fromDate(now)
            };

            await addDoc(collection(db, 'user_sessions'), {
                sessionId,
                ...sessionData
            });

            // Log session creation
            await auditService.logPrivacyAction(user.uid, 'login', {
                resourceType: 'session',
                resourceId: sessionId,
                details: `Session created with ${securityLevel} security level`,
                sessionId
            });

            // Start session monitoring
            this.startSessionMonitoring(sessionId);

            return sessionId;

        } catch (error) {
            console.error('Error creating session:', error);
            throw new Error('Failed to create secure session');
        }
    }

    /**
     * Validate session with comprehensive security checks
     */
    async validateSession(
        sessionId: string,
        userId: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<SessionValidationResult> {
        try {
            // Get session from database
            const sessionQuery = query(
                collection(db, 'user_sessions'),
                where('sessionId', '==', sessionId),
                where('userId', '==', userId),
                limit(1)
            );

            const sessionDocs = await getDocs(sessionQuery);

            if (sessionDocs.empty) {
                return {
                    isValid: false,
                    reason: 'Session not found'
                };
            }

            const sessionDoc = sessionDocs.docs[0];
            const sessionData = sessionDoc.data();
            const now = new Date();

            // Check if session is marked as invalid
            if (!sessionData.isValid) {
                return {
                    isValid: false,
                    reason: 'Session invalidated'
                };
            }

            // Check expiration
            const expiresAt = sessionData.expiresAt.toDate();
            if (now > expiresAt) {
                await this.invalidateSession(sessionId, 'Session expired');
                return {
                    isValid: false,
                    reason: 'Session expired'
                };
            }

            // Check for session hijacking indicators
            const hijackCheck = await this.checkForSessionHijacking(sessionData, ipAddress, userAgent);
            if (hijackCheck.suspicious) {
                await this.handleSuspiciousSession(sessionId, userId, hijackCheck.reason);
                return {
                    isValid: false,
                    reason: 'Suspicious session activity detected',
                    requiresReauth: true
                };
            }

            // Check if session needs extension
            const shouldExtend = this.shouldExtendSession(sessionData.lastActivity.toDate(), expiresAt);
            if (shouldExtend) {
                await this.extendSession(sessionId);
            }

            // Update last activity
            await this.updateSessionActivity(sessionId, ipAddress, userAgent);

            const sessionInfo: SessionInfo = {
                sessionId,
                userId: sessionData.userId,
                createdAt: sessionData.createdAt.toDate(),
                lastActivity: now,
                expiresAt: shouldExtend ? new Date(now.getTime() + this.SESSION_TIMEOUT_MINUTES * 60 * 1000) : expiresAt,
                ipAddress: sessionData.ipAddress,
                userAgent: sessionData.userAgent,
                isValid: true,
                deviceFingerprint: sessionData.deviceFingerprint,
                securityLevel: sessionData.securityLevel || 'standard'
            };

            return {
                isValid: true,
                session: sessionInfo
            };

        } catch (error) {
            console.error('Error validating session:', error);
            return {
                isValid: false,
                reason: 'Session validation error'
            };
        }
    }

    /**
     * Invalidate a specific session
     */
    async invalidateSession(sessionId: string, reason: string = 'Manual invalidation'): Promise<void> {
        try {
            const sessionQuery = query(
                collection(db, 'user_sessions'),
                where('sessionId', '==', sessionId),
                limit(1)
            );

            const sessionDocs = await getDocs(sessionQuery);

            if (!sessionDocs.empty) {
                const sessionDoc = sessionDocs.docs[0];
                const sessionData = sessionDoc.data();

                await updateDoc(sessionDoc.ref, {
                    isValid: false,
                    invalidatedAt: serverTimestamp(),
                    invalidationReason: reason
                });

                // Log session invalidation
                await auditService.logPrivacyAction(sessionData.userId, 'logout', {
                    resourceType: 'session',
                    resourceId: sessionId,
                    details: `Session invalidated: ${reason}`,
                    sessionId
                });
            }
        } catch (error) {
            console.error('Error invalidating session:', error);
        }
    }

    /**
     * Invalidate all sessions for a user
     */
    async invalidateAllUserSessions(userId: string, reason: string = 'Security measure'): Promise<void> {
        try {
            const userSessionsQuery = query(
                collection(db, 'user_sessions'),
                where('userId', '==', userId),
                where('isValid', '==', true)
            );

            const userSessions = await getDocs(userSessionsQuery);
            const batch = writeBatch(db);

            userSessions.docs.forEach(sessionDoc => {
                batch.update(sessionDoc.ref, {
                    isValid: false,
                    invalidatedAt: serverTimestamp(),
                    invalidationReason: reason
                });
            });

            await batch.commit();

            // Log mass session invalidation
            await auditService.logPrivacyAction(userId, 'logout', {
                resourceType: 'session',
                details: `All sessions invalidated: ${reason} (${userSessions.docs.length} sessions)`
            });

            // Log as potential security incident
            if (userSessions.docs.length > 1) {
                await HIPAAComplianceService.detectPotentialBreach(
                    userId,
                    `Multiple active sessions invalidated: ${reason}`
                );
            }

        } catch (error) {
            console.error('Error invalidating all user sessions:', error);
            throw new Error('Failed to invalidate user sessions');
        }
    }

    /**
     * Elevate session security level for sensitive operations
     */
    async elevateSessionSecurity(sessionId: string, userId: string): Promise<boolean> {
        try {
            const sessionQuery = query(
                collection(db, 'user_sessions'),
                where('sessionId', '==', sessionId),
                where('userId', '==', userId),
                limit(1)
            );

            const sessionDocs = await getDocs(sessionQuery);

            if (sessionDocs.empty) {
                return false;
            }

            const sessionDoc = sessionDocs.docs[0];
            const now = new Date();
            const elevatedExpiresAt = new Date(now.getTime() + this.ELEVATED_SESSION_TIMEOUT_MINUTES * 60 * 1000);

            await updateDoc(sessionDoc.ref, {
                securityLevel: 'elevated',
                elevatedAt: serverTimestamp(),
                expiresAt: Timestamp.fromDate(elevatedExpiresAt)
            });

            // Log security elevation
            await auditService.logPrivacyAction(userId, 'access_granted', {
                resourceType: 'session',
                resourceId: sessionId,
                details: 'Session security level elevated for sensitive operation',
                sessionId
            });

            return true;

        } catch (error) {
            console.error('Error elevating session security:', error);
            return false;
        }
    }

    /**
     * Private helper methods
     */
    private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
        const activeSessionsQuery = query(
            collection(db, 'user_sessions'),
            where('userId', '==', userId),
            where('isValid', '==', true),
            orderBy('lastActivity', 'desc')
        );

        const activeSessions = await getDocs(activeSessionsQuery);

        if (activeSessions.docs.length >= this.MAX_CONCURRENT_SESSIONS) {
            // Invalidate oldest sessions
            const sessionsToInvalidate = activeSessions.docs.slice(this.MAX_CONCURRENT_SESSIONS - 1);

            for (const sessionDoc of sessionsToInvalidate) {
                await updateDoc(sessionDoc.ref, {
                    isValid: false,
                    invalidatedAt: serverTimestamp(),
                    invalidationReason: 'Concurrent session limit exceeded'
                });
            }

            // Log security event
            await this.logSecurityEvent({
                type: 'concurrent_limit',
                sessionId: 'multiple',
                userId,
                details: `Invalidated ${sessionsToInvalidate.length} sessions due to concurrent limit`,
                timestamp: new Date(),
                severity: 'medium'
            });
        }
    }

    private async checkForSessionHijacking(
        sessionData: any,
        currentIpAddress?: string,
        currentUserAgent?: string
    ): Promise<{ suspicious: boolean; reason?: string }> {
        // Check for IP address changes (potential session hijacking)
        if (currentIpAddress && sessionData.ipAddress &&
            currentIpAddress !== sessionData.ipAddress &&
            sessionData.ipAddress !== 'unknown') {

            // Allow for reasonable IP changes (same subnet, known mobile carriers)
            const suspiciousIpChange = await this.isSuspiciousIpChange(
                sessionData.ipAddress,
                currentIpAddress
            );

            if (suspiciousIpChange) {
                return {
                    suspicious: true,
                    reason: `Suspicious IP change from ${sessionData.ipAddress} to ${currentIpAddress}`
                };
            }
        }

        // Check for user agent changes (potential session hijacking)
        if (currentUserAgent && sessionData.userAgent &&
            currentUserAgent !== sessionData.userAgent &&
            sessionData.userAgent !== 'unknown') {

            // Allow for minor user agent variations (browser updates)
            const suspiciousUaChange = this.isSuspiciousUserAgentChange(
                sessionData.userAgent,
                currentUserAgent
            );

            if (suspiciousUaChange) {
                return {
                    suspicious: true,
                    reason: 'Suspicious user agent change detected'
                };
            }
        }

        return { suspicious: false };
    }

    private async isSuspiciousIpChange(oldIp: string, newIp: string): Promise<boolean> {
        // Simple heuristic: different first three octets indicate suspicious change
        const oldOctets = oldIp.split('.');
        const newOctets = newIp.split('.');

        if (oldOctets.length !== 4 || newOctets.length !== 4) {
            return true; // Invalid IP format is suspicious
        }

        // Allow changes within same /24 subnet
        return !(oldOctets[0] === newOctets[0] &&
            oldOctets[1] === newOctets[1] &&
            oldOctets[2] === newOctets[2]);
    }

    private isSuspiciousUserAgentChange(oldUa: string, newUa: string): boolean {
        // Extract browser and OS information
        const oldBrowser = this.extractBrowserInfo(oldUa);
        const newBrowser = this.extractBrowserInfo(newUa);

        // Suspicious if browser or OS family changes
        return oldBrowser.family !== newBrowser.family || oldBrowser.os !== newBrowser.os;
    }

    private extractBrowserInfo(userAgent: string): { family: string; os: string } {
        // Simple user agent parsing (in production, use a proper library)
        const family = userAgent.includes('Chrome') ? 'Chrome' :
            userAgent.includes('Firefox') ? 'Firefox' :
                userAgent.includes('Safari') ? 'Safari' :
                    userAgent.includes('Edge') ? 'Edge' : 'Unknown';

        const os = userAgent.includes('Windows') ? 'Windows' :
            userAgent.includes('Mac') ? 'Mac' :
                userAgent.includes('Linux') ? 'Linux' :
                    userAgent.includes('Android') ? 'Android' :
                        userAgent.includes('iOS') ? 'iOS' : 'Unknown';

        return { family, os };
    }

    private shouldExtendSession(lastActivity: Date, expiresAt: Date): boolean {
        const now = new Date();
        const timeSinceActivity = now.getTime() - lastActivity.getTime();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        // Extend if there's been recent activity and session is close to expiring
        return timeSinceActivity < (this.SESSION_EXTENSION_THRESHOLD_MINUTES * 60 * 1000) &&
            timeUntilExpiry < (this.SESSION_EXTENSION_THRESHOLD_MINUTES * 60 * 1000);
    }

    private async extendSession(sessionId: string): Promise<void> {
        try {
            const sessionQuery = query(
                collection(db, 'user_sessions'),
                where('sessionId', '==', sessionId),
                limit(1)
            );

            const sessionDocs = await getDocs(sessionQuery);

            if (!sessionDocs.empty) {
                const sessionDoc = sessionDocs.docs[0];
                const sessionData = sessionDoc.data();
                const now = new Date();
                const timeoutMinutes = sessionData.securityLevel === 'elevated'
                    ? this.ELEVATED_SESSION_TIMEOUT_MINUTES
                    : this.SESSION_TIMEOUT_MINUTES;
                const newExpiresAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000);

                await updateDoc(sessionDoc.ref, {
                    expiresAt: Timestamp.fromDate(newExpiresAt),
                    extendedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error extending session:', error);
        }
    }

    private async updateSessionActivity(
        sessionId: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        try {
            const sessionQuery = query(
                collection(db, 'user_sessions'),
                where('sessionId', '==', sessionId),
                limit(1)
            );

            const sessionDocs = await getDocs(sessionQuery);

            if (!sessionDocs.empty) {
                const sessionDoc = sessionDocs.docs[0];
                const updateData: any = {
                    lastActivity: serverTimestamp(),
                    activityCount: (sessionDoc.data().activityCount || 0) + 1
                };

                if (ipAddress) updateData.lastIpAddress = ipAddress;
                if (userAgent) updateData.lastUserAgent = userAgent;

                await updateDoc(sessionDoc.ref, updateData);
            }
        } catch (error) {
            console.error('Error updating session activity:', error);
        }
    }

    private async handleSuspiciousSession(sessionId: string, userId: string, reason: string): Promise<void> {
        // Invalidate the suspicious session
        await this.invalidateSession(sessionId, `Suspicious activity: ${reason}`);

        // Log security event
        await this.logSecurityEvent({
            type: 'suspicious_activity',
            sessionId,
            userId,
            details: reason,
            timestamp: new Date(),
            severity: 'high'
        });

        // Notify security team (in production, integrate with alerting system)
        await HIPAAComplianceService.detectPotentialBreach(userId, `Suspicious session activity: ${reason}`);
    }

    private async logSecurityEvent(event: SessionSecurityEvent): Promise<void> {
        try {
            await addDoc(collection(db, 'session_security_events'), {
                ...event,
                timestamp: Timestamp.fromDate(event.timestamp)
            });

            // Also log to audit system
            await auditService.logPrivacyAction(event.userId, 'access_denied', {
                resourceType: 'session_security',
                resourceId: event.sessionId,
                details: `Security event: ${event.type} - ${event.details}`,
                sessionId: event.sessionId
            });
        } catch (error) {
            console.error('Error logging security event:', error);
        }
    }

    private startSessionMonitoring(sessionId: string): void {
        // In a production environment, this would integrate with a background job system
        // For now, we'll use a simple timeout to check session validity
        setTimeout(async () => {
            try {
                const sessionQuery = query(
                    collection(db, 'user_sessions'),
                    where('sessionId', '==', sessionId),
                    limit(1)
                );

                const sessionDocs = await getDocs(sessionQuery);

                if (!sessionDocs.empty) {
                    const sessionData = sessionDocs.docs[0].data();
                    const now = new Date();
                    const expiresAt = sessionData.expiresAt.toDate();

                    if (now > expiresAt && sessionData.isValid) {
                        await this.invalidateSession(sessionId, 'Automatic timeout');
                    }
                }
            } catch (error) {
                console.error('Error in session monitoring:', error);
            }
        }, this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
    }

    /**
     * Cleanup expired sessions (should be run periodically)
     */
    async cleanupExpiredSessions(): Promise<void> {
        try {
            const now = new Date();
            const expiredSessionsQuery = query(
                collection(db, 'user_sessions'),
                where('expiresAt', '<', Timestamp.fromDate(now)),
                where('isValid', '==', true)
            );

            const expiredSessions = await getDocs(expiredSessionsQuery);
            const batch = writeBatch(db);

            expiredSessions.docs.forEach(sessionDoc => {
                batch.update(sessionDoc.ref, {
                    isValid: false,
                    invalidatedAt: serverTimestamp(),
                    invalidationReason: 'Automatic cleanup - expired'
                });
            });

            await batch.commit();

            console.log(`Cleaned up ${expiredSessions.docs.length} expired sessions`);

        } catch (error) {
            console.error('Error cleaning up expired sessions:', error);
        }
    }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();