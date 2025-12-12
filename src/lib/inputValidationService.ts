import { z } from 'zod';

/**
 * Input Validation and Sanitization Service
 * Implements OWASP A05:2025 - Injection Attack Prevention
 */
export class InputValidationService {
    private static instance: InputValidationService;
    private readonly maxStringLength = 10000;
    private readonly maxArrayLength = 1000;
    private readonly allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

    public static getInstance(): InputValidationService {
        if (!InputValidationService.instance) {
            InputValidationService.instance = new InputValidationService();
        }
        return InputValidationService.instance;
    }

    /**
     * Privacy settings validation schemas
     */
    readonly privacySchemas = {
        // User ID validation
        userId: z.string()
            .min(1, 'User ID is required')
            .max(128, 'User ID too long')
            .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid user ID format'),

        // Email validation
        email: z.string()
            .email('Invalid email format')
            .max(254, 'Email too long')
            .transform(email => email.toLowerCase().trim()),

        // Child ID validation
        childId: z.string()
            .min(1, 'Child ID is required')
            .max(128, 'Child ID too long')
            .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid child ID format'),

        // Communication type validation
        communicationType: z.enum([
            'email_notifications',
            'sms_notifications',
            'marketing_emails',
            'security_alerts',
            'medical_reminders',
            'third_party_marketing'
        ]),

        // Permission validation
        permission: z.enum([
            'view_symptoms',
            'edit_symptoms',
            'view_treatments',
            'edit_treatments',
            'view_vitals',
            'edit_vitals',
            'view_notes',
            'edit_notes',
            'view_files',
            'upload_files',
            'view_analytics',
            'export_data',
            'manage_access'
        ]),

        // Privacy action validation
        privacyAction: z.enum([
            'view_data',
            'edit_data',
            'export_data',
            'delete_data',
            'grant_access',
            'revoke_access',
            'update_privacy_settings',
            'consent_change',
            'login',
            'logout',
            'access_denied'
        ]),

        // Text content validation
        textContent: z.string()
            .max(this.maxStringLength, `Text too long (max ${this.maxStringLength} characters)`)
            .transform(text => this.sanitizeText(text)),

        // HTML content validation
        htmlContent: z.string()
            .max(this.maxStringLength, `HTML content too long`)
            .transform(html => this.sanitizeHTML(html)),

        // Date validation
        date: z.union([
            z.string().datetime(),
            z.date()
        ]).transform(date => new Date(date)),

        // Numeric validation
        positiveInteger: z.number()
            .int('Must be an integer')
            .positive('Must be positive'),

        // Boolean validation
        boolean: z.boolean(),

        // Array validation
        stringArray: z.array(z.string().max(255))
            .max(this.maxArrayLength, `Too many items (max ${this.maxArrayLength})`),

        // Object validation for privacy settings
        privacySettings: z.object({
            dataSharing: z.object({
                researchParticipation: z.boolean(),
                anonymizedDataSharing: z.boolean(),
                thirdPartyIntegrations: z.record(z.boolean()),
                marketingConsent: z.boolean()
            }),
            communications: z.object({
                emailNotifications: z.boolean(),
                smsNotifications: z.boolean(),
                marketingEmails: z.boolean(),
                securityAlerts: z.boolean(),
                medicalReminders: z.boolean(),
                thirdPartyMarketing: z.boolean()
            }),
            dataRetention: z.object({
                automaticDeletion: z.boolean(),
                retentionPeriod: z.number().int().min(1).max(120),
                deleteAfterInactivity: z.boolean(),
                inactivityPeriod: z.number().int().min(1).max(60)
            })
        })
    };

    /**
     * Validate and sanitize user input
     */
    validateInput<T>(schema: z.ZodSchema<T>, input: unknown): ValidationResult<T> {
        try {
            const validated = schema.parse(input);
            return {
                success: true,
                data: validated,
                errors: []
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    data: null,
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code
                    }))
                };
            }

            return {
                success: false,
                data: null,
                errors: [{
                    field: 'unknown',
                    message: 'Validation failed',
                    code: 'unknown_error'
                }]
            };
        }
    }

    /**
     * Sanitize text content to prevent XSS
     */
    sanitizeText(text: string): string {
        if (typeof text !== 'string') {
            return '';
        }

        // Remove null bytes and control characters
        let sanitized = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Normalize whitespace
        sanitized = sanitized.replace(/\s+/g, ' ').trim();

        // Remove potentially dangerous patterns
        const dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /data:text\/html/gi,
            /on\w+\s*=/gi
        ];

        for (const pattern of dangerousPatterns) {
            sanitized = sanitized.replace(pattern, '');
        }

        return sanitized;
    }

    /**
     * Sanitize HTML content (basic implementation without DOMPurify)
     */
    sanitizeHTML(html: string): string {
        if (typeof html !== 'string') {
            return '';
        }

        // Basic HTML sanitization - remove all HTML tags and dangerous content
        let sanitized = html;

        // Remove script tags and their content
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove all HTML tags
        sanitized = sanitized.replace(/<[^>]*>/g, '');

        // Decode HTML entities
        const entityMap: Record<string, string> = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#x27;': "'",
            '&#x2F;': '/',
            '&#x60;': '`',
            '&#x3D;': '='
        };

        sanitized = sanitized.replace(/&[#\w]+;/g, (entity) => {
            return entityMap[entity] || entity;
        });

        // Remove dangerous patterns
        const dangerousPatterns = [
            /javascript:/gi,
            /vbscript:/gi,
            /data:text\/html/gi,
            /on\w+\s*=/gi
        ];

        for (const pattern of dangerousPatterns) {
            sanitized = sanitized.replace(pattern, '');
        }

        return sanitized.trim();
    }

    /**
     * Validate file uploads
     */
    validateFile(file: File): FileValidationResult {
        const errors: string[] = [];

        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(`File too large (max ${this.maxFileSize / 1024 / 1024}MB)`);
        }

        // Check file type
        if (!this.allowedFileTypes.includes(file.type)) {
            errors.push(`File type not allowed. Allowed types: ${this.allowedFileTypes.join(', ')}`);
        }

        // Check file name
        if (!this.isValidFileName(file.name)) {
            errors.push('Invalid file name');
        }

        // Additional security checks
        if (this.hasExecutableExtension(file.name)) {
            errors.push('Executable files are not allowed');
        }

        return {
            valid: errors.length === 0,
            errors,
            sanitizedName: this.sanitizeFileName(file.name)
        };
    }

    /**
     * Validate Firebase query parameters to prevent injection
     */
    validateFirebaseQuery(query: FirebaseQueryParams): ValidationResult<FirebaseQueryParams> {
        const schema = z.object({
            collection: z.string()
                .min(1, 'Collection name required')
                .max(100, 'Collection name too long')
                .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid collection name'),

            field: z.string()
                .min(1, 'Field name required')
                .max(100, 'Field name too long')
                .regex(/^[a-zA-Z0-9_.]+$/, 'Invalid field name'),

            operator: z.enum(['==', '!=', '<', '<=', '>', '>=', 'array-contains', 'in', 'not-in', 'array-contains-any']),

            value: z.union([
                z.string().max(1000),
                z.number(),
                z.boolean(),
                z.array(z.union([z.string(), z.number()]))
            ]),

            orderBy: z.string()
                .max(100, 'OrderBy field too long')
                .regex(/^[a-zA-Z0-9_.]+$/, 'Invalid orderBy field')
                .optional(),

            limit: z.number()
                .int('Limit must be integer')
                .min(1, 'Limit must be positive')
                .max(1000, 'Limit too large')
                .optional()
        });

        return this.validateInput(schema, query);
    }

    /**
     * Validate audit log entries
     */
    validateAuditLogEntry(entry: AuditLogEntry): ValidationResult<AuditLogEntry> {
        const schema = z.object({
            userId: this.privacySchemas.userId,
            action: this.privacySchemas.privacyAction,
            resourceType: z.string()
                .min(1, 'Resource type required')
                .max(50, 'Resource type too long')
                .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid resource type'),
            resourceId: z.string()
                .max(128, 'Resource ID too long')
                .optional(),
            details: this.privacySchemas.textContent.optional(),
            timestamp: this.privacySchemas.date,
            ipAddress: z.string()
                .ip('Invalid IP address')
                .optional(),
            userAgent: z.string()
                .max(500, 'User agent too long')
                .optional()
        });

        return this.validateInput(schema, entry);
    }

    /**
     * Validate privacy setting updates
     */
    validatePrivacyUpdate(update: PrivacyUpdateRequest): ValidationResult<PrivacyUpdateRequest> {
        const schema = z.object({
            userId: this.privacySchemas.userId,
            updates: z.record(z.unknown()),
            reason: this.privacySchemas.textContent.optional(),
            timestamp: this.privacySchemas.date.optional()
        });

        return this.validateInput(schema, update);
    }

    /**
     * Prevent SQL injection in search queries
     */
    sanitizeSearchQuery(query: string): string {
        if (typeof query !== 'string') {
            return '';
        }

        // Remove SQL injection patterns
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
            /(--|\/\*|\*\/|;)/g,
            /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\()/gi,
            /(\b(CAST|CONVERT|SUBSTRING|ASCII|CHAR_LENGTH)\s*\()/gi
        ];

        let sanitized = query;
        for (const pattern of sqlPatterns) {
            sanitized = sanitized.replace(pattern, '');
        }

        // Limit length and normalize
        sanitized = sanitized.substring(0, 100).trim();

        return sanitized;
    }

    /**
     * Validate and sanitize URL parameters
     */
    validateUrlParams(params: URLSearchParams): Record<string, string> {
        const sanitized: Record<string, string> = {};
        const allowedParams = ['page', 'limit', 'sort', 'filter', 'search'];

        for (const [key, value] of params.entries()) {
            // Only allow whitelisted parameters
            if (!allowedParams.includes(key)) {
                continue;
            }

            // Sanitize parameter value
            const sanitizedValue = this.sanitizeText(value);

            // Additional validation based on parameter type
            switch (key) {
                case 'page':
                case 'limit':
                    const num = parseInt(sanitizedValue, 10);
                    if (!isNaN(num) && num > 0 && num <= 1000) {
                        sanitized[key] = num.toString();
                    }
                    break;
                case 'sort':
                    if (/^[a-zA-Z0-9_]+$/.test(sanitizedValue)) {
                        sanitized[key] = sanitizedValue;
                    }
                    break;
                case 'search':
                    sanitized[key] = this.sanitizeSearchQuery(sanitizedValue);
                    break;
                default:
                    sanitized[key] = sanitizedValue;
            }
        }

        return sanitized;
    }

    /**
     * Generate input validation report
     */
    generateValidationReport(): ValidationReport {
        return {
            timestamp: new Date().toISOString(),
            configuration: {
                maxStringLength: this.maxStringLength,
                maxArrayLength: this.maxArrayLength,
                allowedFileTypes: this.allowedFileTypes,
                maxFileSize: this.maxFileSize
            },
            securityMeasures: [
                'XSS prevention through HTML sanitization',
                'SQL injection prevention in search queries',
                'File upload validation and sanitization',
                'Input length limits and type validation',
                'URL parameter whitelisting and sanitization',
                'Firebase query parameter validation',
                'Audit log entry validation'
            ],
            recommendations: [
                'Regularly update DOMPurify library',
                'Monitor for new injection attack vectors',
                'Implement rate limiting for input validation',
                'Add CAPTCHA for sensitive operations',
                'Log and monitor validation failures',
                'Implement input validation on server side as well'
            ]
        };
    }

    // Private helper methods

    private isValidFileName(fileName: string): boolean {
        // Check for valid file name patterns
        const validPattern = /^[a-zA-Z0-9._-]+$/;
        const invalidPatterns = [
            /\.\./,  // Directory traversal
            /^\./, // Hidden files
            /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|app|deb|pkg|dmg)$/i // Executable extensions
        ];

        if (!validPattern.test(fileName)) {
            return false;
        }

        return !invalidPatterns.some(pattern => pattern.test(fileName));
    }

    private hasExecutableExtension(fileName: string): boolean {
        const executableExtensions = [
            'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
            'app', 'deb', 'pkg', 'dmg', 'msi', 'run', 'bin', 'sh', 'ps1'
        ];

        const extension = fileName.split('.').pop()?.toLowerCase();
        return extension ? executableExtensions.includes(extension) : false;
    }

    private sanitizeFileName(fileName: string): string {
        // Remove dangerous characters and normalize
        let sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Limit length
        if (sanitized.length > 100) {
            const extension = sanitized.split('.').pop();
            const name = sanitized.substring(0, 95 - (extension?.length || 0));
            sanitized = extension ? `${name}.${extension}` : name;
        }

        return sanitized;
    }
}

// Type definitions
interface ValidationResult<T> {
    success: boolean;
    data: T | null;
    errors: ValidationError[];
}

interface ValidationError {
    field: string;
    message: string;
    code: string;
}

interface FileValidationResult {
    valid: boolean;
    errors: string[];
    sanitizedName: string;
}

interface FirebaseQueryParams {
    collection: string;
    field: string;
    operator: string;
    value: any;
    orderBy?: string;
    limit?: number;
}

interface AuditLogEntry {
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}

interface PrivacyUpdateRequest {
    userId: string;
    updates: Record<string, any>;
    reason?: string;
    timestamp?: Date;
}

interface ValidationReport {
    timestamp: string;
    configuration: {
        maxStringLength: number;
        maxArrayLength: number;
        allowedFileTypes: string[];
        maxFileSize: number;
    };
    securityMeasures: string[];
    recommendations: string[];
}

// Export singleton instance
export const inputValidationService = InputValidationService.getInstance();