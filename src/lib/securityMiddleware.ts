import { inputValidationService } from './inputValidationService';
import { privacyService } from './privacyService';

/**
 * Security Middleware for Privacy Settings
 * Implements comprehensive injection attack prevention and security controls
 */
export class SecurityMiddleware {
    private static instance: SecurityMiddleware;
    private readonly rateLimitMap = new Map<string, RateLimitEntry>();
    private readonly suspiciousActivityLog: SuspiciousActivity[] = [];

    public static getInstance(): SecurityMiddleware {
        if (!SecurityMiddleware.instance) {
            SecurityMiddleware.instance = new SecurityMiddleware();
        }
        return SecurityMiddleware.instance;
    }

    /**
     * Validate and sanitize privacy settings update request
     */
    async validatePrivacyUpdate(
        userId: string,
        updates: any,
        userAgent?: string,
        ipAddress?: string
    ): Promise<SecurityValidationResult> {
        try {
            // Rate limiting check
            const rateLimitResult = this.checkRateLimit(userId, 'privacy_update');
            if (!rateLimitResult.allowed) {
                return {
                    allowed: false,
                    reason: 'Rate limit exceeded',
                    sanitizedData: null,
                    securityFlags: ['rate_limit_exceeded']
                };
            }

            // Input validation
            const validationResult = inputValidationService.validatePrivacyUpdate({
                userId,
                updates,
                timestamp: new Date()
            });

            if (!validationResult.success) {
                await this.logSuspiciousActivity({
                    userId,
                    activity: 'invalid_privacy_update',
                    details: `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
                    severity: 'medium',
                    timestamp: new Date(),
                    ipAddress,
                    userAgent
                });

                return {
                    allowed: false,
                    reason: 'Invalid input data',
                    sanitizedData: null,
                    securityFlags: ['validation_failed'],
                    errors: validationResult.errors
                };
            }

            // Check for suspicious patterns
            const suspiciousFlags = this.detectSuspiciousPatterns(updates, userAgent, ipAddress);

            if (suspiciousFlags.length > 0) {
                await this.logSuspiciousActivity({
                    userId,
                    activity: 'suspicious_privacy_update',
                    details: `Suspicious patterns detected: ${suspiciousFlags.join(', ')}`,
                    severity: 'high',
                    timestamp: new Date(),
                    ipAddress,
                    userAgent
                });

                // Allow but flag for review
                return {
                    allowed: true,
                    reason: 'Allowed with security review',
                    sanitizedData: validationResult.data,
                    securityFlags: suspiciousFlags,
                    requiresReview: true
                };
            }

            return {
                allowed: true,
                reason: 'Validation passed',
                sanitizedData: validationResult.data,
                securityFlags: []
            };

        } catch (error) {
            console.error('Security validation failed:', error);
            return {
                allowed: false,
                reason: 'Security validation error',
                sanitizedData: null,
                securityFlags: ['validation_error']
            };
        }
    }

    /**
     * Validate data export request
     */
    async validateDataExport(
        userId: string,
        exportType: string,
        filters?: any,
        userAgent?: string,
        ipAddress?: string
    ): Promise<SecurityValidationResult> {
        try {
            // Rate limiting for data exports (more restrictive)
            const rateLimitResult = this.checkRateLimit(userId, 'data_export', 5, 3600000); // 5 per hour
            if (!rateLimitResult.allowed) {
                return {
                    allowed: false,
                    reason: 'Export rate limit exceeded',
                    sanitizedData: null,
                    securityFlags: ['export_rate_limit_exceeded']
                };
            }

            // Validate export type
            const allowedExportTypes = ['json', 'csv', 'pdf'];
            if (!allowedExportTypes.includes(exportType)) {
                return {
                    allowed: false,
                    reason: 'Invalid export type',
                    sanitizedData: null,
                    securityFlags: ['invalid_export_type']
                };
            }

            // Validate filters if provided
            if (filters) {
                const sanitizedFilters = this.sanitizeExportFilters(filters);

                return {
                    allowed: true,
                    reason: 'Export validation passed',
                    sanitizedData: { exportType, filters: sanitizedFilters },
                    securityFlags: []
                };
            }

            return {
                allowed: true,
                reason: 'Export validation passed',
                sanitizedData: { exportType },
                securityFlags: []
            };

        } catch (error) {
            console.error('Export validation failed:', error);
            return {
                allowed: false,
                reason: 'Export validation error',
                sanitizedData: null,
                securityFlags: ['export_validation_error']
            };
        }
    }

    /**
     * Validate file upload for privacy-related documents
     */
    async validateFileUpload(
        userId: string,
        file: File,
        uploadType: string,
        userAgent?: string,
        ipAddress?: string
    ): Promise<FileUploadValidationResult> {
        try {
            // Rate limiting for file uploads
            const rateLimitResult = this.checkRateLimit(userId, 'file_upload', 10, 3600000); // 10 per hour
            if (!rateLimitResult.allowed) {
                return {
                    allowed: false,
                    reason: 'File upload rate limit exceeded',
                    sanitizedFileName: null,
                    securityFlags: ['upload_rate_limit_exceeded']
                };
            }

            // File validation
            const fileValidation = inputValidationService.validateFile(file);
            if (!fileValidation.valid) {
                await this.logSuspiciousActivity({
                    userId,
                    activity: 'invalid_file_upload',
                    details: `File validation failed: ${fileValidation.errors.join(', ')}`,
                    severity: 'medium',
                    timestamp: new Date(),
                    ipAddress,
                    userAgent
                });

                return {
                    allowed: false,
                    reason: 'File validation failed',
                    sanitizedFileName: null,
                    securityFlags: ['file_validation_failed'],
                    errors: fileValidation.errors
                };
            }

            // Check upload type
            const allowedUploadTypes = ['privacy_document', 'audit_report', 'consent_form'];
            if (!allowedUploadTypes.includes(uploadType)) {
                return {
                    allowed: false,
                    reason: 'Invalid upload type',
                    sanitizedFileName: null,
                    securityFlags: ['invalid_upload_type']
                };
            }

            // Additional security checks for file content
            const contentFlags = await this.scanFileContent(file);

            return {
                allowed: true,
                reason: 'File upload validation passed',
                sanitizedFileName: fileValidation.sanitizedName,
                securityFlags: contentFlags
            };

        } catch (error) {
            console.error('File upload validation failed:', error);
            return {
                allowed: false,
                reason: 'File upload validation error',
                sanitizedFileName: null,
                securityFlags: ['upload_validation_error']
            };
        }
    }

    /**
     * Validate audit log access request
     */
    async validateAuditLogAccess(
        userId: string,
        filters: any,
        userAgent?: string,
        ipAddress?: string
    ): Promise<SecurityValidationResult> {
        try {
            // Rate limiting for audit log access
            const rateLimitResult = this.checkRateLimit(userId, 'audit_access', 20, 3600000); // 20 per hour
            if (!rateLimitResult.allowed) {
                return {
                    allowed: false,
                    reason: 'Audit access rate limit exceeded',
                    sanitizedData: null,
                    securityFlags: ['audit_rate_limit_exceeded']
                };
            }

            // Sanitize and validate filters
            const sanitizedFilters = this.sanitizeAuditFilters(filters);

            // Log audit access for compliance
            await privacyService.logPrivacyAction(userId, 'view_data', {
                resourceType: 'audit_logs',
                resourceId: userId,
                details: 'Audit log access requested'
            });

            return {
                allowed: true,
                reason: 'Audit access validation passed',
                sanitizedData: sanitizedFilters,
                securityFlags: []
            };

        } catch (error) {
            console.error('Audit access validation failed:', error);
            return {
                allowed: false,
                reason: 'Audit access validation error',
                sanitizedData: null,
                securityFlags: ['audit_validation_error']
            };
        }
    }

    /**
     * Check rate limiting for user actions
     */
    private checkRateLimit(
        userId: string,
        action: string,
        maxRequests: number = 10,
        windowMs: number = 900000 // 15 minutes
    ): RateLimitResult {
        const key = `${userId}:${action}`;
        const now = Date.now();
        const entry = this.rateLimitMap.get(key);

        if (!entry) {
            this.rateLimitMap.set(key, {
                requests: 1,
                windowStart: now,
                lastRequest: now
            });
            return { allowed: true, remaining: maxRequests - 1 };
        }

        // Reset window if expired
        if (now - entry.windowStart > windowMs) {
            this.rateLimitMap.set(key, {
                requests: 1,
                windowStart: now,
                lastRequest: now
            });
            return { allowed: true, remaining: maxRequests - 1 };
        }

        // Check if limit exceeded
        if (entry.requests >= maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.windowStart + windowMs
            };
        }

        // Increment counter
        entry.requests++;
        entry.lastRequest = now;
        this.rateLimitMap.set(key, entry);

        return {
            allowed: true,
            remaining: maxRequests - entry.requests
        };
    }

    /**
     * Detect suspicious patterns in input data
     */
    private detectSuspiciousPatterns(
        data: any,
        userAgent?: string,
        ipAddress?: string
    ): string[] {
        const flags: string[] = [];

        // Check for SQL injection patterns
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
            /(--|\/\*|\*\/|;)/g
        ];

        const dataString = JSON.stringify(data).toLowerCase();
        for (const pattern of sqlPatterns) {
            if (pattern.test(dataString)) {
                flags.push('sql_injection_pattern');
                break;
            }
        }

        // Check for XSS patterns
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /on\w+\s*=/gi
        ];

        for (const pattern of xssPatterns) {
            if (pattern.test(dataString)) {
                flags.push('xss_pattern');
                break;
            }
        }

        // Check for suspicious user agent
        if (userAgent) {
            const suspiciousAgents = [
                /bot/i,
                /crawler/i,
                /spider/i,
                /scanner/i,
                /curl/i,
                /wget/i
            ];

            for (const pattern of suspiciousAgents) {
                if (pattern.test(userAgent)) {
                    flags.push('suspicious_user_agent');
                    break;
                }
            }
        }

        // Check for unusual data patterns
        if (typeof data === 'object' && data !== null) {
            // Check for excessive nesting
            if (this.getObjectDepth(data) > 10) {
                flags.push('excessive_nesting');
            }

            // Check for large payloads
            if (JSON.stringify(data).length > 100000) {
                flags.push('large_payload');
            }
        }

        return flags;
    }

    /**
     * Sanitize export filters
     */
    private sanitizeExportFilters(filters: any): any {
        const sanitized: any = {};

        if (filters.startDate) {
            const date = new Date(filters.startDate);
            if (!isNaN(date.getTime())) {
                sanitized.startDate = date;
            }
        }

        if (filters.endDate) {
            const date = new Date(filters.endDate);
            if (!isNaN(date.getTime())) {
                sanitized.endDate = date;
            }
        }

        if (filters.dataTypes && Array.isArray(filters.dataTypes)) {
            const allowedTypes = ['symptoms', 'treatments', 'vitals', 'notes', 'files'];
            sanitized.dataTypes = filters.dataTypes.filter((type: string) =>
                allowedTypes.includes(type)
            );
        }

        return sanitized;
    }

    /**
     * Sanitize audit log filters
     */
    private sanitizeAuditFilters(filters: any): any {
        const sanitized: any = {};

        if (filters.startDate) {
            const date = new Date(filters.startDate);
            if (!isNaN(date.getTime())) {
                sanitized.startDate = date;
            }
        }

        if (filters.endDate) {
            const date = new Date(filters.endDate);
            if (!isNaN(date.getTime())) {
                sanitized.endDate = date;
            }
        }

        if (filters.action) {
            const allowedActions = [
                'view_data', 'edit_data', 'export_data', 'delete_data',
                'grant_access', 'revoke_access', 'update_privacy_settings',
                'consent_change', 'login', 'logout', 'access_denied'
            ];
            if (allowedActions.includes(filters.action)) {
                sanitized.action = filters.action;
            }
        }

        if (filters.resourceType) {
            sanitized.resourceType = inputValidationService.sanitizeText(filters.resourceType);
        }

        return sanitized;
    }

    /**
     * Scan file content for security threats (basic implementation)
     */
    private async scanFileContent(file: File): Promise<string[]> {
        const flags: string[] = [];

        try {
            // Read file as text for basic scanning
            const text = await this.readFileAsText(file);

            // Check for suspicious content
            const suspiciousPatterns = [
                /<script/gi,
                /javascript:/gi,
                /vbscript:/gi,
                /data:text\/html/gi,
                /eval\s*\(/gi,
                /document\.write/gi
            ];

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(text)) {
                    flags.push('suspicious_file_content');
                    break;
                }
            }

            // Check for embedded executables (basic check)
            if (text.includes('MZ') || text.includes('PK')) {
                flags.push('potential_executable');
            }

        } catch (error) {
            // If we can't read the file, flag it for manual review
            flags.push('unreadable_file');
        }

        return flags;
    }

    /**
     * Read file as text for content scanning
     */
    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file.slice(0, 10000)); // Read first 10KB only
        });
    }

    /**
     * Get object nesting depth
     */
    private getObjectDepth(obj: any, depth: number = 0): number {
        if (typeof obj !== 'object' || obj === null) {
            return depth;
        }

        let maxDepth = depth;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const childDepth = this.getObjectDepth(obj[key], depth + 1);
                maxDepth = Math.max(maxDepth, childDepth);
            }
        }

        return maxDepth;
    }

    /**
     * Log suspicious activity
     */
    private async logSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
        this.suspiciousActivityLog.push(activity);

        // Keep only last 1000 entries
        if (this.suspiciousActivityLog.length > 1000) {
            this.suspiciousActivityLog.shift();
        }

        // Log to privacy service for audit trail
        await privacyService.logPrivacyAction(activity.userId, 'access_denied', {
            resourceType: 'security_event',
            details: `Suspicious activity: ${activity.activity} - ${activity.details}`
        });

        // In production, this would also:
        // - Send alerts to security team
        // - Update threat intelligence
        // - Trigger automated responses
        console.warn('Suspicious activity detected:', activity);
    }

    /**
     * Get security statistics
     */
    getSecurityStats(): SecurityStats {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * oneHour;

        const recentActivity = this.suspiciousActivityLog.filter(
            activity => now - activity.timestamp.getTime() < oneDay
        );

        const rateLimitEntries = Array.from(this.rateLimitMap.values());
        const activeRateLimits = rateLimitEntries.filter(
            entry => now - entry.windowStart < oneHour
        );

        return {
            timestamp: new Date(),
            suspiciousActivityCount: recentActivity.length,
            activeRateLimits: activeRateLimits.length,
            topThreats: this.getTopThreats(recentActivity),
            securityRecommendations: this.getSecurityRecommendations()
        };
    }

    /**
     * Get top security threats
     */
    private getTopThreats(activities: SuspiciousActivity[]): Array<{ threat: string; count: number }> {
        const threatCounts = new Map<string, number>();

        for (const activity of activities) {
            const count = threatCounts.get(activity.activity) || 0;
            threatCounts.set(activity.activity, count + 1);
        }

        return Array.from(threatCounts.entries())
            .map(([threat, count]) => ({ threat, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    /**
     * Get security recommendations
     */
    private getSecurityRecommendations(): string[] {
        return [
            'Regularly review suspicious activity logs',
            'Monitor rate limiting effectiveness',
            'Update input validation rules based on new threats',
            'Implement additional file scanning capabilities',
            'Consider implementing CAPTCHA for sensitive operations',
            'Set up automated alerting for high-severity threats'
        ];
    }
}

// Type definitions
interface RateLimitEntry {
    requests: number;
    windowStart: number;
    lastRequest: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime?: number;
}

interface SecurityValidationResult {
    allowed: boolean;
    reason: string;
    sanitizedData: any;
    securityFlags: string[];
    requiresReview?: boolean;
    errors?: Array<{ field: string; message: string; code: string }>;
}

interface FileUploadValidationResult {
    allowed: boolean;
    reason: string;
    sanitizedFileName: string | null;
    securityFlags: string[];
    errors?: string[];
}

interface SuspiciousActivity {
    userId: string;
    activity: string;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}

interface SecurityStats {
    timestamp: Date;
    suspiciousActivityCount: number;
    activeRateLimits: number;
    topThreats: Array<{ threat: string; count: number }>;
    securityRecommendations: string[];
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();