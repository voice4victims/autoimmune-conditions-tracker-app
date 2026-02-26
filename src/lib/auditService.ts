import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    and,
    or
} from 'firebase/firestore';
import { db } from './firebase';
import {
    AccessLog,
    AuditServiceInterface,
    PrivacyAction,
    LogFilters,
    AuditReport,
    SuspiciousActivity,
    AuditSummary
} from '@/types/privacy';

export class AuditService implements AuditServiceInterface {
    private static instance: AuditService;

    public static getInstance(): AuditService {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }

    async logPrivacyAction(userId: string, action: PrivacyAction, details: Partial<AccessLog>): Promise<void> {
        try {
            const logEntry: Record<string, any> = {
                userId,
                accessorId: details.accessorId || userId,
                accessorName: details.accessorName || 'User',
                accessorType: details.accessorType || 'system',
                action,
                resourceType: details.resourceType || 'unknown',
                resourceId: details.resourceId || 'unknown',
                timestamp: new Date(),
                ipAddress: await this.getClientIP() || 'unknown',
                userAgent: navigator.userAgent,
                result: details.result || 'success',
                sessionId: details.sessionId || this.generateSessionId()
            };
            if (details.childId) logEntry.childId = details.childId;
            if (details.details) logEntry.details = details.details;

            await addDoc(collection(db, 'privacy_audit_logs'), {
                ...logEntry,
                timestamp: Timestamp.fromDate(logEntry.timestamp)
            });
        } catch (error) {
            console.error('Failed to log privacy action:', error);
            // Critical: Audit logging failure should be escalated
            await this.escalateAuditFailure(error, { userId, action, details });
        }
    }

    async getAccessLogs(userId: string, filters?: LogFilters): Promise<AccessLog[]> {
        try {
            const logsRef = collection(db, 'privacy_audit_logs');
            let q = query(logsRef, where('userId', '==', userId));

            // Apply filters
            if (filters) {
                if (filters.startDate) {
                    q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
                }
                if (filters.endDate) {
                    q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
                }
                if (filters.accessorId) {
                    q = query(q, where('accessorId', '==', filters.accessorId));
                }
                if (filters.action) {
                    q = query(q, where('action', '==', filters.action));
                }
                if (filters.resourceType) {
                    q = query(q, where('resourceType', '==', filters.resourceType));
                }
                if (filters.childId) {
                    q = query(q, where('childId', '==', filters.childId));
                }
                if (filters.result) {
                    q = query(q, where('result', '==', filters.result));
                }
            }

            // Order by timestamp descending and limit to prevent excessive data retrieval
            q = query(q, orderBy('timestamp', 'desc'), limit(1000));

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp.toDate()
            } as AccessLog));
        } catch (error) {
            console.error('Error getting access logs:', error);
            throw new Error('Failed to retrieve access logs');
        }
    }

    async generateAuditReport(
        userId: string,
        dateRange: { startDate: Date; endDate: Date },
        filters?: LogFilters
    ): Promise<AuditReport> {
        try {
            // Get logs for the specified date range
            const reportFilters: LogFilters = {
                ...filters,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            };

            const logs = await this.getAccessLogs(userId, reportFilters);
            const summary = this.generateAuditSummary(logs);
            const suspiciousActivity = await this.detectSuspiciousActivity(userId);

            const report: AuditReport = {
                id: crypto.randomUUID(),
                userId,
                generatedAt: new Date(),
                dateRange,
                filters: reportFilters,
                entries: logs,
                summary: {
                    ...summary,
                    suspiciousActivity
                },
                format: 'json' // Default format, can be changed based on requirements
            };

            // Log the report generation
            await this.logPrivacyAction(userId, 'export_data', {
                resourceType: 'audit_report',
                resourceId: report.id,
                details: `Audit report generated for ${dateRange.startDate.toISOString()} to ${dateRange.endDate.toISOString()}`
            });

            return report;
        } catch (error) {
            console.error('Error generating audit report:', error);
            throw new Error('Failed to generate audit report');
        }
    }

    async detectSuspiciousActivity(userId: string): Promise<SuspiciousActivity[]> {
        try {
            const suspiciousActivities: SuspiciousActivity[] = [];
            const recentLogs = await this.getRecentLogs(userId, 7); // Last 7 days

            // Detect multiple failed attempts
            const failedAttempts = recentLogs.filter(log => log.result === 'denied');
            if (failedAttempts.length > 5) {
                suspiciousActivities.push({
                    type: 'multiple_failed_attempts',
                    description: `${failedAttempts.length} failed access attempts detected`,
                    severity: failedAttempts.length > 10 ? 'high' : 'medium',
                    timestamp: new Date(),
                    relatedLogs: failedAttempts.slice(0, 10).map(log => log.id)
                });
            }

            // Detect unusual access patterns (access outside normal hours)
            const offHoursAccess = recentLogs.filter(log => {
                const hour = log.timestamp.getHours();
                return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
            });

            if (offHoursAccess.length > 3) {
                suspiciousActivities.push({
                    type: 'off_hours_access',
                    description: `${offHoursAccess.length} access attempts outside normal hours`,
                    severity: 'medium',
                    timestamp: new Date(),
                    relatedLogs: offHoursAccess.slice(0, 5).map(log => log.id)
                });
            }

            // Detect bulk data access
            const exportActions = recentLogs.filter(log => log.action === 'export_data');
            if (exportActions.length > 3) {
                suspiciousActivities.push({
                    type: 'bulk_data_access',
                    description: `${exportActions.length} data export attempts detected`,
                    severity: 'high',
                    timestamp: new Date(),
                    relatedLogs: exportActions.map(log => log.id)
                });
            }

            // Detect unusual access patterns (same IP accessing multiple accounts)
            const ipGroups = this.groupLogsByIP(recentLogs);
            for (const [ip, logs] of Object.entries(ipGroups)) {
                const uniqueUsers = new Set(logs.map(log => log.userId));
                if (uniqueUsers.size > 3 && ip !== 'unknown') {
                    suspiciousActivities.push({
                        type: 'unusual_access_pattern',
                        description: `IP address ${ip} accessed ${uniqueUsers.size} different user accounts`,
                        severity: 'high',
                        timestamp: new Date(),
                        relatedLogs: logs.slice(0, 10).map(log => log.id)
                    });
                }
            }

            return suspiciousActivities;
        } catch (error) {
            console.error('Error detecting suspicious activity:', error);
            return [];
        }
    }

    // Private helper methods
    private async getRecentLogs(userId: string, days: number): Promise<AccessLog[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return this.getAccessLogs(userId, {
            startDate,
            endDate: new Date()
        });
    }

    private generateAuditSummary(logs: AccessLog[]): Omit<AuditSummary, 'suspiciousActivity'> {
        const totalEntries = logs.length;
        const successfulAccess = logs.filter(log => log.result === 'success').length;
        const deniedAccess = logs.filter(log => log.result === 'denied').length;
        const uniqueAccessors = new Set(logs.map(log => log.accessorId)).size;

        // Find most accessed resource
        const resourceCounts: Record<string, number> = {};
        logs.forEach(log => {
            const key = `${log.resourceType}:${log.resourceId || 'unknown'}`;
            resourceCounts[key] = (resourceCounts[key] || 0) + 1;
        });

        const mostAccessedResource = Object.entries(resourceCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

        return {
            totalEntries,
            successfulAccess,
            deniedAccess,
            uniqueAccessors,
            mostAccessedResource,
            suspiciousActivity: [] // Will be populated by detectSuspiciousActivity
        };
    }

    private groupLogsByIP(logs: AccessLog[]): Record<string, AccessLog[]> {
        return logs.reduce((groups, log) => {
            const ip = log.ipAddress || 'unknown';
            if (!groups[ip]) {
                groups[ip] = [];
            }
            groups[ip].push(log);
            return groups;
        }, {} as Record<string, AccessLog[]>);
    }

    private async getClientIP(): Promise<string | undefined> {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return undefined;
        }
    }

    private generateSessionId(): string {
        return crypto.randomUUID();
    }

    private async escalateAuditFailure(error: any, context: any): Promise<void> {
        // In production, this should alert security team
        console.error('CRITICAL: Privacy Audit Logging Failure', { error, context });

        try {
            // Attempt to log the failure to a backup system
            await addDoc(collection(db, 'audit_failures'), {
                error: error.message,
                context,
                timestamp: Timestamp.now(),
                severity: 'critical'
            });
        } catch (backupError) {
            console.error('Failed to log audit failure to backup system:', backupError);
            // Could integrate with external monitoring services here
        }
    }
}

// Export singleton instance
export const auditService = AuditService.getInstance();